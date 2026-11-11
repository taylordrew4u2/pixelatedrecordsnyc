import { mkdir, open, readFile, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getDataDirectory } from "./config";
import { ApiError } from "./errors";

export async function ensureDataDirectory() {
  const directory = getDataDirectory();
  await mkdir(directory, { recursive: true, mode: 0o700 });
  return directory;
}

export async function readLocalJson<T>(name: string): Promise<T | null> {
  try {
    return JSON.parse(
      await readFile(path.join(getDataDirectory(), name), "utf8"),
    ) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function writeLocalJson(name: string, value: unknown) {
  const directory = await ensureDataDirectory();
  const temporary = path.join(
    directory,
    "." + name + "." + randomUUID() + ".tmp",
  );
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(JSON.stringify(value));
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename(temporary, path.join(directory, name));
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

// One cross-process lock protects compare-and-swap operations on the local store.
// Writes use fsync + atomic rename, so process restarts cannot leave partial JSON.
export async function withLocalLock<T>(task: () => Promise<T>): Promise<T> {
  const directory = await ensureDataDirectory();
  const lockPath = path.join(directory, ".write-lock");
  const deadline = Date.now() + 5_000;
  let acquired = false;
  while (!acquired) {
    try {
      const lock = await open(lockPath, "wx", 0o600);
      await lock.writeFile(String(process.pid));
      await lock.close();
      acquired = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      // Recover a lock left by a terminated process, but never steal a live lock.
      try {
        const age = Date.now() - (await stat(lockPath)).mtimeMs;
        const pid = Number(await readFile(lockPath, "utf8"));
        if (age > 30_000 && Number.isInteger(pid) && pid > 0) {
          let alive = true;
          try {
            process.kill(pid, 0);
          } catch (failure) {
            alive = (failure as NodeJS.ErrnoException).code !== "ESRCH";
          }
          if (!alive) {
            await rm(lockPath, { force: true });
            continue;
          }
        }
      } catch (failure) {
        if ((failure as NodeJS.ErrnoException).code === "ENOENT") continue;
      }
      if (Date.now() >= deadline)
        throw new ApiError(
          503,
          "Another save is finishing. Please try again.",
          "STORAGE_BUSY",
        );
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  try {
    return await task();
  } finally {
    await rm(lockPath, { force: true });
  }
}
