import { existsSync, readFileSync } from "node:fs";

// The Next.js Netlify adapter copies these files into the server function.
// Local admin credentials must never travel with a deploy artifact.
const files = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
];
const unsafe = files.filter(
  (file) =>
    existsSync(file) &&
    /^\s*(?:export\s+)?(?:ADMIN_PASSWORD_HASH|SESSION_SECRET)\s*=/m.test(
      readFileSync(file, "utf8"),
    ),
);
if (unsafe.length) {
  console.error(
    `Deploy stopped: move local admin credentials from ${unsafe.join(", ")} to .env.development.local. Hosted credentials must use Functions-only runtime secrets.`,
  );
  process.exit(1);
}
