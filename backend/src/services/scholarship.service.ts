import type { Scholarship } from "../models";
import { scholarshipRepository } from "../data/repositories/scholarship.repository";
import { NotFoundError } from "../utils/app-error";

export async function listScholarships(): Promise<Scholarship[]> {
  return scholarshipRepository.getAll();
}

export async function getScholarshipById(id: string): Promise<Scholarship> {
  const scholarship = await scholarshipRepository.getById(id);
  if (!scholarship) throw new NotFoundError("Scholarship", id);
  return scholarship;
}
