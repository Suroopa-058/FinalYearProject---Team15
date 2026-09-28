import crypto from "node:crypto";

import { accountRepository } from "../data/repositories/account.repository";
import { applicationRepository } from "../data/repositories/application.repository";
import { profileRepository } from "../data/repositories/profile.repository";
import { scholarshipRepository } from "../data/repositories/scholarship.repository";
import { universityRepository } from "../data/repositories/university.repository";
import type { Account } from "../models";
import { generateId } from "../utils/id-generator";

export const DEFAULT_PLATFORM_ADMIN = {
  email: "admin@scholarmatch.com",
  password: "Admin@1234",
} as const;

const SCRYPT_OPTIONS = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;

async function hash(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  return new Promise<string>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, SCRYPT_OPTIONS, (err, key) => {
      if (err) reject(err);
      else resolve(`${salt}:${key.toString("hex")}`);
    });
  });
}

export async function ensurePlatformAdmin(): Promise<Account> {
  const existing = await accountRepository.getByEmail(DEFAULT_PLATFORM_ADMIN.email);
  if (existing) return existing;

  const now = new Date().toISOString();
  const admin: Account = {
    id: generateId("acct"),
    email: DEFAULT_PLATFORM_ADMIN.email.toLowerCase(),
    passwordHash: await hash(DEFAULT_PLATFORM_ADMIN.password),
    role: "platform_admin",
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  await accountRepository.create(admin);
  return admin;
}

export async function getPlatformAdminOverview() {
  const [profiles, universities, scholarships, applications] = await Promise.all([
    profileRepository.getAll(),
    universityRepository.getAll(),
    scholarshipRepository.getAll(),
    applicationRepository.getAll(),
  ]);

  return {
    totals: {
      students: profiles.length,
      universities: universities.length,
      scholarships: scholarships.length,
      applications: applications.length,
    },
    pendingUniversities: universities.filter((university) => university.verificationStatus === "pending"),
  };
}
