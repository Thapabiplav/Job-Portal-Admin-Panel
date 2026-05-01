/**
 * Admin SPA: access + refresh in sessionStorage (Bearer for /auth/me); HttpOnly refresh cookie also used.
 * Session hint avoids calling /auth/me on first visit when no prior login on this browser.
 */
const ACCESS_KEY = 'admin_access_token';
const REFRESH_KEY = 'admin_refresh_token';
const SESSION_HINT_KEY = 'admin_session_hint';

export function getAccessToken() {
  try {
    const v = sessionStorage.getItem(ACCESS_KEY);
    return v && String(v).trim() ? String(v).trim() : null;
  } catch {
    return null;
  }
}

export function setAccessToken(token) {
  try {
    const v = typeof token === 'string' && token.trim() ? token.trim() : null;
    if (v) sessionStorage.setItem(ACCESS_KEY, v);
    else sessionStorage.removeItem(ACCESS_KEY);
  } catch {
    /* private mode */
  }
}

export function getRefreshToken() {
  try {
    const v = sessionStorage.getItem(REFRESH_KEY);
    return v && String(v).trim() ? String(v).trim() : null;
  } catch {
    return null;
  }
}

export function setRefreshToken(token) {
  try {
    const v = typeof token === 'string' && token.trim() ? token.trim() : null;
    if (v) sessionStorage.setItem(REFRESH_KEY, v);
    else sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    /* private mode */
  }
}

export function setAdminSessionHint() {
  try {
    sessionStorage.setItem(SESSION_HINT_KEY, '1');
    localStorage.setItem('admin_auth_hint', '1');
  } catch {
    /* ignore */
  }
}

export function hasAdminSessionHint() {
  try {
    if (sessionStorage.getItem(SESSION_HINT_KEY) === '1') return true;
    if (localStorage.getItem('admin_auth_hint') === '1') return true;
    return false;
  } catch {
    return false;
  }
}

export function clearAllTokens() {
  try {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(SESSION_HINT_KEY);
    sessionStorage.removeItem('admin_user');
    localStorage.removeItem('admin_auth_hint');
  } catch {
    /* ignore */
  }
}
