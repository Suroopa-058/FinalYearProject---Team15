export type UniversityVerificationStatus = "pending" | "verified" | "rejected";

export interface University {
  id: string;
  name: string;
  verifiedEmailDomain: string;
  address: string;
  contactPerson: string;
  verificationStatus: UniversityVerificationStatus;
  createdAt: string;
  updatedAt: string;
}
