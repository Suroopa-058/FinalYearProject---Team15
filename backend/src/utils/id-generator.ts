import { randomUUID } from "node:crypto";

/** Generates a unique ID, optionally prefixed (e.g. "schol_", "app_"). */
export function generateId(prefix?: string): string {
  const id = randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}
