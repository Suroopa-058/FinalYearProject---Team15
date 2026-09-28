import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { Account, AccountRole } from "../models";
import { accountRepository } from "../data/repositories/account.repository";
import { AppError } from "../utils/app-error";
import { env } from "../config/env";

declare global { namespace Express { interface Request { auth?: Account; } } }

const secret = env.AUTH_TOKEN_SECRET;
const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
const sign = (value: string) => crypto.createHmac("sha256", secret).update(value).digest("base64url");

export function issueToken(account: Account): string {
  const payload = encode({ sub: account.id, role: account.role, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
  return `${payload}.${sign(payload)}`;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) throw new AppError("Authentication is required", 401, "UNAUTHENTICATED");
    const [payload, signature] = token.split(".");
    const expected = payload ? sign(payload) : "";
    if (!payload || !signature || Buffer.byteLength(signature) !== Buffer.byteLength(expected) || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) throw new AppError("Invalid authentication token", 401, "INVALID_TOKEN");
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub: string; exp: number };
    if (claims.exp < Date.now()) throw new AppError("Authentication token has expired", 401, "TOKEN_EXPIRED");
    const account = await accountRepository.getById(claims.sub);
    if (!account || !account.active) throw new AppError("This account is unavailable", 403, "ACCOUNT_UNAVAILABLE");
    req.auth = account;
    next();
  } catch (error) { next(error); }
}

export function requireRoles(...roles: AccountRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) return next(new AppError("You do not have permission to access this resource", 403, "FORBIDDEN"));
    next();
  };
}

export function assertOwnProfile(req: Request, profileId: string): void {
  if (req.auth?.role === "student" && req.auth.studentProfileId !== profileId) throw new AppError("You may only access your own profile", 403, "PROFILE_FORBIDDEN");
}
