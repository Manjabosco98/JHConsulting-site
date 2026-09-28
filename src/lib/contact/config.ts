import "server-only";

/** Reads an optional server variable without ever returning it to the client. */
export const readTrimmedEnv = (name: string) => (process.env[name] ?? "").trim();

/**
 * Whether Resend can be used at all. Kept apart from notify.ts so the admin
 * pages can show the pending-configuration notice without importing the SDK.
 */
export function hasEmailConfig() {
  return Boolean(
    readTrimmedEnv("RESEND_API_KEY") &&
      readTrimmedEnv("CONTACT_TO_EMAIL") &&
      readTrimmedEnv("CONTACT_FROM_EMAIL")
  );
}
