import type { Scholarship } from "../../models";
import { env } from "../../config/env";
import { JsonFileStore } from "../json-store";
import { scholarshipsSeed } from "../seed/scholarships.seed";

/**
 * Repository interface — depend on this, not on JsonFileScholarshipRepository,
 * from services/controllers. Swapping to a real DB later means writing a
 * new class that implements this interface and changing one line in
 * wherever the repository is instantiated (see bottom of this file).
 */
export interface ScholarshipRepository {
  getAll(): Promise<Scholarship[]>;
  getById(id: string): Promise<Scholarship | null>;
  create(scholarship: Scholarship): Promise<Scholarship>;
  update(id: string, patch: Partial<Scholarship>): Promise<Scholarship | null>;
}

export class JsonFileScholarshipRepository implements ScholarshipRepository {
  private readonly store = new JsonFileStore<Scholarship>(
    "scholarships.runtime.json",
    env.DATA_DIR,
    scholarshipsSeed,
  );

  getAll(): Promise<Scholarship[]> {
    return this.store.getAll();
  }

  getById(id: string): Promise<Scholarship | null> {
    return this.store.getById(id);
  }

  create(scholarship: Scholarship): Promise<Scholarship> {
    return this.store.create(scholarship);
  }
  update(id: string, patch: Partial<Scholarship>): Promise<Scholarship | null> { return this.store.update(id, patch); }
}

// Single shared instance for the app. Replace with a DB-backed
// implementation here once one exists — nothing else needs to change.
export const scholarshipRepository: ScholarshipRepository = new JsonFileScholarshipRepository();
