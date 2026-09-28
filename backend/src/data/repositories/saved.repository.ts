import type { SavedScholarship } from "../../models";
import { env } from "../../config/env";
import { JsonFileStore } from "../json-store";

export interface SavedRepository {
  getByUserId(userId: string): Promise<SavedScholarship[]>;
  findOne(userId: string, scholarshipId: string): Promise<SavedScholarship | null>;
  create(saved: SavedScholarship): Promise<SavedScholarship>;
  delete(id: string): Promise<boolean>;
}

export class JsonFileSavedRepository implements SavedRepository {
  private readonly store = new JsonFileStore<SavedScholarship>(
    "saved.runtime.json",
    env.DATA_DIR,
    [],
  );

  getByUserId(userId: string): Promise<SavedScholarship[]> {
    return this.store.findMany((s) => s.userId === userId);
  }

  async findOne(userId: string, scholarshipId: string): Promise<SavedScholarship | null> {
    const matches = await this.store.findMany(
      (s) => s.userId === userId && s.scholarshipId === scholarshipId,
    );
    return matches[0] ?? null;
  }

  create(saved: SavedScholarship): Promise<SavedScholarship> {
    return this.store.create(saved);
  }

  delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}

export const savedRepository: SavedRepository = new JsonFileSavedRepository();
