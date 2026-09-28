export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under-review"
  | "accepted"
  | "rejected"
  | "withdrawn";

export interface Application {
  id: string;
  userId: string;
  scholarshipId: string;
  status: ApplicationStatus;
  submittedDocuments: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateApplicationInput = Pick<Application, "userId" | "scholarshipId"> &
  Partial<Pick<Application, "submittedDocuments" | "notes">>;
