import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

const passwordMap = {
  "admin@uet.edu.in": "Uet@2026!",
  "admin@ias.edu.in": "Ias@2026!",
};

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, key) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(`${salt}:${key.toString("hex")}`);
    });
  });
}

const filePath = path.join(process.cwd(), "src", "data", "db", "accounts.runtime.json");
const accounts = JSON.parse(fs.readFileSync(filePath, "utf8"));

for (const account of accounts) {
  const password = passwordMap[account.email];
  if (password) {
    account.passwordHash = await hashPassword(password);
    console.log(`Updated ${account.email}`);
  }
}

fs.writeFileSync(filePath, JSON.stringify(accounts, null, 2));
console.log(`Saved ${filePath}`);
