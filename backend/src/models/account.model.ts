export type AccountRole = "student" | "university_staff" | "platform_admin";

export interface Account {
  id: string;
  email: string;
  passwordHash: string;
  role: AccountRole;
  studentProfileId?: string;
  universityId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PublicAccount = Omit<Account, "passwordHash">;
