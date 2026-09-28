import type { Application } from "../../models";
import { env } from "../../config/env";
import { JsonFileStore } from "../json-store";

export interface ApplicationRepository {
  getById(id: string): Promise<Application | null>;
  getByUserId(userId: string): Promise<Application[]>;
  getAll(): Promise<Application[]>;
  create(application: Application): Promise<Application>;
  update(id: string, patch: Partial<Application>): Promise<Application | null>;
}

export class JsonFileApplicationRepository implements ApplicationRepository {
  private readonly store = new JsonFileStore<Application>(
    "applications.runtime.json",
    env.DATA_DIR,
    [],
  );

  getById(id: string): Promise<Application | null> {
    return this.store.getById(id);
  }

  getByUserId(userId: string): Promise<Application[]> {
    return this.store.findMany((a) => a.userId === userId);
  }
  getAll(): Promise<Application[]> { return this.store.getAll(); }

  create(application: Application): Promise<Application> {
    return this.store.create(application);
  }

  update(id: string, patch: Partial<Application>): Promise<Application | null> {
    return this.store.update(id, patch);
  }
}

export const applicationRepository: ApplicationRepository = new JsonFileApplicationRepository();
