import type { Account } from "../../models";
import { env } from "../../config/env";
import { JsonFileStore } from "../json-store";

class AccountRepository {
  private readonly store = new JsonFileStore<Account>("accounts.runtime.json", env.DATA_DIR, []);
  getById(id: string) { return this.store.getById(id); }
  async getByEmail(email: string) { return (await this.store.getAll()).find((account) => account.email.toLowerCase() === email.toLowerCase()) ?? null; }
  create(account: Account) { return this.store.create(account); }
  update(id: string, patch: Partial<Account>) { return this.store.update(id, patch); }
}
export const accountRepository = new AccountRepository();
