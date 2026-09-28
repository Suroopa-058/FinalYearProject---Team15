import type { StudentProfile } from "../../models";
import { env } from "../../config/env";
import { JsonFileStore } from "../json-store";

export interface ProfileRepository {
  getAll(): Promise<StudentProfile[]>;
  getById(id: string): Promise<StudentProfile | null>;
  getByEmail(email: string): Promise<StudentProfile | null>;
  create(profile: StudentProfile): Promise<StudentProfile>;
  update(id: string, patch: Partial<StudentProfile>): Promise<StudentProfile | null>;
}

export class JsonFileProfileRepository implements ProfileRepository {
  private readonly store = new JsonFileStore<StudentProfile>(
    "profiles.runtime.json",
    env.DATA_DIR,
    [],
  );

  private migrationPromise: Promise<void> | null = null;

  /**
   * Profiles written before University records existed stored a free-text
   * institution. Preserve it verbatim as legacyInstitutionName; do not
   * invent a University reference. The raw legacy key remains on disk for
   * audit/backward compatibility but is not part of StudentProfile.
   */
  private async migrateLegacyInstitutionFields(): Promise<void> {
    if (!this.migrationPromise) {
      this.migrationPromise = (async () => {
        const profiles = await this.store.getAll();
        await Promise.all(profiles.map(async (profile) => {
          const legacy = profile as StudentProfile & { institution?: unknown };
          if (!profile.institutionId && !profile.legacyInstitutionName && typeof legacy.institution === "string" && legacy.institution.trim()) {
            await this.store.update(profile.id, { legacyInstitutionName: legacy.institution.trim() });
          }
        }));
      })();
    }
    return this.migrationPromise;
  }

  async getAll(): Promise<StudentProfile[]> {
    await this.migrateLegacyInstitutionFields();
    return this.store.getAll();
  }

  async getById(id: string): Promise<StudentProfile | null> {
    await this.migrateLegacyInstitutionFields();
    return this.store.getById(id);
  }

  async getByEmail(email: string): Promise<StudentProfile | null> {
    const all = await this.getAll();
    return all.find((p) => p.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  create(profile: StudentProfile): Promise<StudentProfile> {
    return this.store.create(profile);
  }

  update(id: string, patch: Partial<StudentProfile>): Promise<StudentProfile | null> {
    return this.store.update(id, patch);
  }
}

export const profileRepository: ProfileRepository = new JsonFileProfileRepository();
