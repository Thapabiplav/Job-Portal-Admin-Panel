/**
 * Admin auth client storage:
 * - Access JWT: in-memory only (never sessionStorage/localStorage).
 * - Refresh: HttpOnly cookie set by the API on login (path /api/auth/refresh); not readable from JS.
 * - Session probe: first-party cookie (no secret) so we know to try /auth/refresh after a full page load.
 */

const PROBE_COOKIE = 'admin_session_probe';

/** @type {{ accessToken: string | null }} */
const session = { accessToken: null };

function isSecureCookieContext() {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:' || Boolean(import.meta.env.PROD);
}

/** Remove legacy token keys from sessionStorage / localStorage (one-time migration). */
export function clearLegacyAuthStorage() {
  try {
    sessionStorage.removeItem('admin_access_token');
    sessionStorage.removeItem('admin_refresh_token');
    sessionStorage.removeItem('admin_session_hint');
    sessionStorage.removeItem('admin_user');
    localStorage.removeItem('admin_auth_hint');
  } catch {
    /* ignore */
  }
}

export function getAccessToken() {
  const v = session.accessToken;
  return v && String(v).trim() ? String(v).trim() : null;
}

export function setAccessToken(token) {
  const v = typeof token === 'string' && token.trim() ? token.trim() : null;
  session.accessToken = v;
}

export function setSessionProbe() {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 7;
  const parts = [`${PROBE_COOKIE}=1`, 'Path=/', `Max-Age=${maxAge}`, 'SameSite=Lax'];
  if (isSecureCookieContext()) parts.push('Secure');
  document.cookie = parts.join('; ');
}

export function hasSessionProbe() {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${PROBE_COOKIE}=`));
}

export function clearSessionProbe() {
  if (typeof document === 'undefined') return;
  const parts = [`${PROBE_COOKIE}=`, 'Path=/', 'Max-Age=0', 'SameSite=Lax'];
  if (isSecureCookieContext()) parts.push('Secure');
  document.cookie = parts.join('; ');
}

export function clearAllTokens() {
  session.accessToken = null;
  clearSessionProbe();
  clearLegacyAuthStorage();
}
