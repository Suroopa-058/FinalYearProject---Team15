import type { CreateSavedScholarshipInput, SavedScholarship } from "../models";
import { savedRepository } from "../data/repositories/saved.repository";
import { getScholarshipById } from "./scholarship.service";
import { generateId } from "../utils/id-generator";
import { AppError } from "../utils/app-error";

export async function saveScholarship(
  input: CreateSavedScholarshipInput,
): Promise<SavedScholarship> {
  await getScholarshipById(input.scholarshipId); // 404s if missing

  const existing = await savedRepository.findOne(input.userId, input.scholarshipId);
  if (existing) {
    throw new AppError("This scholarship is already saved", 409, "ALREADY_SAVED");
  }

  const saved: SavedScholarship = {
    id: generateId("saved"),
    userId: input.userId,
    scholarshipId: input.scholarshipId,
    savedAt: new Date().toISOString(),
  };

  return savedRepository.create(saved);
}

export async function listSavedByUser(userId: string): Promise<SavedScholarship[]> {
  return savedRepository.getByUserId(userId);
}
