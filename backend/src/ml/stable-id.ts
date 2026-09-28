/**
 * The FastAPI service's StudentProfile schema requires an integer
 * `student_id` (see fastapi_integration/schemas.py). Our profiles use
 * string IDs (e.g. "profile_<uuid>"). `student_id` is NOT one of the 11
 * trained feature columns (see config/feature_columns.json) — it is
 * only echoed back in the response for identification — so deriving a
 * stable integer from the string ID here has no effect whatsoever on
 * any prediction. This is an ID-format adapter, not a modeling decision.
 *
 * Callers who already track a numeric student id (e.g. imported from a
 * student information system) should set StudentProfile.externalStudentId
 * directly instead of relying on this derivation.
 */
export function stableIntIdFromString(value: string): number {
  // FNV-1a 32-bit hash — simple, deterministic, dependency-free.
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // Force unsigned, keep well within a safe JS/JSON integer range.
  return hash >>> 0;
}