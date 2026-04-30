/**
 * Auth: HttpOnly cookies on the API only. No localStorage/sessionStorage for tokens or hints.
 * clearAllTokens clears legacy JWT keys from older builds; server clears cookies on logout.
 */
export function clearAllTokens() {
  try {
    sessionStorage.removeItem('admin_access_token');
    sessionStorage.removeItem('admin_refresh_token');
    sessionStorage.removeItem('admin_user');
    localStorage.removeItem('admin_auth_hint');
  } catch {
    /* ignore */
  }
}
