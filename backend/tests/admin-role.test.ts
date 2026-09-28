import assert from "node:assert/strict";
import test from "node:test";

import { login } from "../src/services/auth.service";
import { DEFAULT_PLATFORM_ADMIN, ensurePlatformAdmin } from "../src/services/admin.service";

test("platform admin account is automatically created and can log in", async () => {
  const admin = await ensurePlatformAdmin();

  assert.equal(admin.role, "platform_admin");
  assert.equal(admin.email, DEFAULT_PLATFORM_ADMIN.email);

  const session = await login({
    email: DEFAULT_PLATFORM_ADMIN.email,
    password: DEFAULT_PLATFORM_ADMIN.password,
  });

  assert.equal(session.account.role, "platform_admin");
  assert.equal(session.access, "granted");
});

test("seeded university demo accounts can log in with their expected passwords", async () => {
  const universityAccounts = [
    { email: "admin@uet.edu.in", password: "Uet@2026!" },
    { email: "admin@ias.edu.in", password: "Ias@2026!" },
  ];

  for (const account of universityAccounts) {
    const session = await login({
      email: account.email,
      password: account.password,
    });

    assert.equal(session.account.email, account.email.toLowerCase());
    assert.equal(session.account.role, "university_staff");
    assert.equal(session.access, "granted");
  }
});
