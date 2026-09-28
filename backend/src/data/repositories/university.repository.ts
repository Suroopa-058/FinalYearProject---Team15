import type { University } from "../../models";
import { env } from "../../config/env";
import { JsonFileStore } from "../json-store";

class UniversityRepository {
  private readonly store = new JsonFileStore<University>("universities.runtime.json", env.DATA_DIR, []);
  getById(id: string) { return this.store.getById(id); }
  getAll() { return this.store.getAll(); }
  create(university: University) { return this.store.create(university); }
  update(id: string, patch: Partial<University>) { return this.store.update(id, patch); }
}
export const universityRepository = new UniversityRepository();
