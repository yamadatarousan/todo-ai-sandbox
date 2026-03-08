import { mkdir, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const e2eDatabaseFilePath = fileURLToPath(
  new URL("../../data/e2e/app.sqlite", import.meta.url),
);

export default async function globalSetup() {
  await mkdir(dirname(e2eDatabaseFilePath), { recursive: true });
  await Promise.all([
    rm(e2eDatabaseFilePath, { force: true }),
    rm(`${e2eDatabaseFilePath}-shm`, { force: true }),
    rm(`${e2eDatabaseFilePath}-wal`, { force: true }),
  ]);
}
