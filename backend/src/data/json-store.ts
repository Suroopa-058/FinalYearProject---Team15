import fs from "node:fs";
import path from "node:path";
import { logger } from "../utils/logger";

/**
 * JsonFileStore<T>
 * ------------------------------------------------------------------------
 * A tiny file-backed "database" so the rest of the app doesn't need a real
 * database to run yet. Every repository (scholarships, profiles,
 * applications, saved scholarships) sits behind an interface — swapping
 * this out for Postgres/Mongo/etc. later means writing one new class per
 * repository interface, not touching controllers or services.
 *
 * Not built for concurrent-write safety or scale — it's a development
 * foundation, not a production data layer.
 */
export class JsonFileStore<T extends { id: string }> {
  private readonly filePath: string;
  private cache: T[] | null = null;

  constructor(fileName: string, dataDir: string, private readonly seed: T[] = []) {
    this.filePath = path.join(dataDir, fileName);
    this.ensureFile();
  }

  private ensureFile(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(this.seed, null, 2), "utf-8");
      logger.info("Seeded data file", { file: this.filePath, records: this.seed.length });
    }
  }

  private read(): T[] {
    if (this.cache) return this.cache;
    const raw = fs.readFileSync(this.filePath, "utf-8");
    try {
      this.cache = JSON.parse(raw) as T[];
    } catch (err) {
      logger.error("Failed to parse data file, falling back to empty list", {
        file: this.filePath,
        error: (err as Error).message,
      });
      this.cache = [];
    }
    return this.cache;
  }

  private write(records: T[]): void {
    this.cache = records;
    fs.writeFileSync(this.filePath, JSON.stringify(records, null, 2), "utf-8");
  }

  async getAll(): Promise<T[]> {
    return [...this.read()];
  }

  async getById(id: string): Promise<T | null> {
    return this.read().find((r) => r.id === id) ?? null;
  }

  async findMany(predicate: (record: T) => boolean): Promise<T[]> {
    return this.read().filter(predicate);
  }

  async create(record: T): Promise<T> {
    const all = this.read();
    all.push(record);
    this.write(all);
    return record;
  }

  async update(id: string, patch: Partial<T>): Promise<T | null> {
    const all = this.read();
    const index = all.findIndex((r) => r.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...patch };
    this.write(all);
    return all[index];
  }

  async delete(id: string): Promise<boolean> {
    const all = this.read();
    const next = all.filter((r) => r.id !== id);
    if (next.length === all.length) return false;
    this.write(next);
    return true;
  }
}
