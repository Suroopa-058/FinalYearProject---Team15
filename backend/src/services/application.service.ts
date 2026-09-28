import type { Application, CreateApplicationInput } from "../models";
import { applicationRepository } from "../data/repositories/application.repository";
import { getScholarshipById } from "./scholarship.service";
import { generateId } from "../utils/id-generator";

export async function createApplication(input: CreateApplicationInput): Promise<Application> {
  // Throws NotFoundError if the scholarship doesn't exist.
  await getScholarshipById(input.scholarshipId);

  const now = new Date().toISOString();
  const application: Application = {
    id: generateId("app"),
    userId: input.userId,
    scholarshipId: input.scholarshipId,
    status: "submitted",
    submittedDocuments: input.submittedDocuments ?? [],
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };

  return applicationRepository.create(application);
}

export async function listApplicationsByUser(userId: string): Promise<Application[]> {
  return applicationRepository.getByUserId(userId);
}
