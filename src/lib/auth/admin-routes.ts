export const ADMIN_HOME_PATH = "/admin";
export const ADMIN_LOGIN_PATH = "/admin/login";

function isUnder(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * Optimistic routing for the Proxy only: sends visitors without a session to the
 * login page. It never grants access — every admin page and action must still
 * call requireAdmin() on the server, which also checks private.admin_users.
 */
export function resolveAdminRedirect(pathname: string, hasSession: boolean): string | null {
  if (!isUnder(pathname, ADMIN_HOME_PATH) || isUnder(pathname, ADMIN_LOGIN_PATH)) return null;
  return hasSession ? null : ADMIN_LOGIN_PATH;
}
