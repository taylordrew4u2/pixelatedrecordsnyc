import { randomBytes, scryptSync } from "node:crypto";

async function readPassword() {
  if (!process.stdin.isTTY) {
    let input = "";
    for await (const chunk of process.stdin) input += chunk;
    return input.replace(/\r?\n$/, "");
  }
  process.stderr.write("Admin password (hidden): ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  return new Promise((resolve, reject) => {
    let input = "";
    const finish = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", handler);
      process.stderr.write("\n");
    };
    const handler = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          finish();
          reject(new Error("Cancelled"));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          resolve(input);
          return;
        }
        if (character === "\u007f" || character === "\b")
          input = input.slice(0, -1);
        else if (character >= " ") input += character;
      }
    };
    process.stdin.on("data", handler);
  });
}

try {
  const password = await readPassword();
  if (!password || password.length > 1024)
    throw new Error("Enter a password of 1 to 1024 characters.");
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { maxmem: 64 * 1024 * 1024 });
  process.stdout.write(
    "scrypt:" + salt.toString("hex") + ":" + hash.toString("hex") + "\n",
  );
} catch (error) {
  process.stderr.write(
    (error instanceof Error
      ? error.message
      : "Unable to create password hash.") + "\n",
  );
  process.exitCode = 1;
}
