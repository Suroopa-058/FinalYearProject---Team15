export interface SavedScholarship {
  id: string;
  userId: string;
  scholarshipId: string;
  savedAt: string;
}

export type CreateSavedScholarshipInput = Pick<SavedScholarship, "userId" | "scholarshipId">;
