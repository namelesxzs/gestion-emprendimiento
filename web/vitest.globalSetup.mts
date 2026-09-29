import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const TEST_DB = path.resolve(import.meta.dirname, "test.db");

export default function setup() {
  for (const f of [TEST_DB, `${TEST_DB}-journal`]) {
    if (existsSync(f)) rmSync(f);
  }

  execSync("npx prisma migrate deploy", {
    cwd: import.meta.dirname,
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "inherit",
  });

  return () => {
    for (const f of [TEST_DB, `${TEST_DB}-journal`]) {
      if (existsSync(f)) rmSync(f);
    }
  };
}
