import crypto from "node:crypto";
import type { Account, PublicAccount } from "../models";
import { accountRepository } from "../data/repositories/account.repository";
import { universityRepository } from "../data/repositories/university.repository";
import { generateId } from "../utils/id-generator";
import { AppError } from "../utils/app-error";
import { issueToken } from "../middleware/auth.middleware";
import type { LoginDto, RegisterStudentDto, RegisterUniversityDto } from "../validators/auth.schema";
import { createProfile } from "./profile.service";
import { ensurePlatformAdmin } from "./admin.service";

const SCRYPT_OPTIONS = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;
const hash = (password: string, salt = crypto.randomBytes(16).toString("hex")) => new Promise<string>((resolve, reject) => crypto.scrypt(password, salt, 64, SCRYPT_OPTIONS, (err, key) => err ? reject(err) : resolve(`${salt}:${key.toString("hex")}`)));
async function verify(password: string, stored: string) { const [salt] = stored.split(":"); return crypto.timingSafeEqual(Buffer.from(await hash(password, salt)), Buffer.from(stored)); }
const publicAccount = ({ passwordHash: _passwordHash, ...account }: Account): PublicAccount => account;
const session = (account: Account) => ({ token: issueToken(account), account: publicAccount(account) });

export async function login(input: LoginDto) {
  const admin = await ensurePlatformAdmin();
  const account = await accountRepository.getByEmail(input.email);

  if (!account) {
    if (input.email.toLowerCase() !== admin.email.toLowerCase()) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }
    if (!(await verify(input.password, admin.passwordHash))) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }
  } else if (!(await verify(input.password, account.passwordHash))) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const activeAccount = account ?? admin;
  if (!activeAccount.active) throw new AppError("This account is unavailable", 403, "ACCOUNT_UNAVAILABLE");
  if (activeAccount.role === "university_staff") {
    const university = activeAccount.universityId ? await universityRepository.getById(activeAccount.universityId) : null;
    if (!university || university.verificationStatus !== "verified") return { ...session(activeAccount), university, access: "pending" as const };
  }
  return { ...session(activeAccount), access: "granted" as const };
}

export async function registerUniversity(input: RegisterUniversityDto) {
  if (await accountRepository.getByEmail(input.email)) throw new AppError("An account already exists for this email", 409, "EMAIL_IN_USE");
  const now = new Date().toISOString();
  const emailDomain = input.email.split("@")[1]?.toLowerCase();
  const university = { id: generateId("uni"), name: input.name, verifiedEmailDomain: input.verifiedEmailDomain, address: input.address, contactPerson: input.contactPerson, verificationStatus: emailDomain === input.verifiedEmailDomain ? "verified" as const : "pending" as const, createdAt: now, updatedAt: now };
  await universityRepository.create(university);
  const account: Account = { id: generateId("acct"), email: input.email.toLowerCase(), passwordHash: await hash(input.password), role: "university_staff", universityId: university.id, active: true, createdAt: now, updatedAt: now };
  await accountRepository.create(account);
  return { ...session(account), university, access: university.verificationStatus === "verified" ? "granted" as const : "pending" as const };
}

export async function registerStudent(input: RegisterStudentDto) {
  if (await accountRepository.getByEmail(input.email)) throw new AppError("An account already exists for this email", 409, "EMAIL_IN_USE");
  const { password, ...profileInput } = input;
  const now = new Date().toISOString();
  const profile = await createProfile({ ...profileInput, email: input.email.toLowerCase() });
  const account: Account = { id: generateId("acct"), email: input.email.toLowerCase(), passwordHash: await hash(password), role: "student", studentProfileId: profile.id, active: true, createdAt: now, updatedAt: now };
  await accountRepository.create(account);
  return { ...session(account), profile, access: "granted" as const };
}
