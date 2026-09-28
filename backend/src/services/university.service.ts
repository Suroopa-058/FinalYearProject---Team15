import type { Scholarship, University } from "../models";
import { universityRepository } from "../data/repositories/university.repository";
import { scholarshipRepository } from "../data/repositories/scholarship.repository";
import { profileRepository } from "../data/repositories/profile.repository";
import { applicationRepository } from "../data/repositories/application.repository";
import { generateId } from "../utils/id-generator";
import { AppError, NotFoundError } from "../utils/app-error";
import type { CreateUniversityScholarshipDto } from "../validators/auth.schema";

export async function getVerifiedUniversity(universityId: string): Promise<University> {
  const university = await universityRepository.getById(universityId);
  if (!university) throw new NotFoundError("University", universityId);
  if (university.verificationStatus !== "verified") throw new AppError("University access is pending approval", 403, "UNIVERSITY_PENDING");
  return university;
}

export async function requestVerification(universityId: string) {
  const university = await universityRepository.getById(universityId);
  if (!university) throw new NotFoundError("University", universityId);
  if (university.verificationStatus === "rejected") throw new AppError("This university verification request was rejected", 403, "UNIVERSITY_REJECTED");
  return universityRepository.update(universityId, { verificationStatus: "pending", updatedAt: new Date().toISOString() });
}

export async function createScholarship(universityId: string, input: CreateUniversityScholarshipDto): Promise<Scholarship> {
  const university = await getVerifiedUniversity(universityId);
  const now = new Date().toISOString();
  const scholarship: Scholarship = { ...input, id: generateId("sch"), provider: input.provider || university.name, postedByUniversityId: universityId, createdAt: now, updatedAt: now };
  return scholarshipRepository.create(scholarship);
}

export async function listScholarships(universityId: string) {
  await getVerifiedUniversity(universityId);
  return (await scholarshipRepository.getAll()).filter((scholarship) => scholarship.postedByUniversityId === universityId);
}

export async function updateScholarship(universityId: string, scholarshipId: string, patch: Partial<CreateUniversityScholarshipDto>) {
  await getVerifiedUniversity(universityId);
  const scholarship = await scholarshipRepository.getById(scholarshipId);
  if (!scholarship || scholarship.postedByUniversityId !== universityId) throw new NotFoundError("University scholarship", scholarshipId);
  return scholarshipRepository.update(scholarshipId, { ...patch, updatedAt: new Date().toISOString() });
}

export async function roster(universityId: string) {
  await getVerifiedUniversity(universityId);
  return (await profileRepository.getAll()).filter((profile) => profile.institutionId === universityId);
}

export async function applications(universityId: string) {
  await getVerifiedUniversity(universityId);
  const scholarshipIds = new Set((await scholarshipRepository.getAll()).filter((s) => s.postedByUniversityId === universityId).map((s) => s.id));
  return (await applicationRepository.getAll()).filter((application) => scholarshipIds.has(application.scholarshipId));
}
