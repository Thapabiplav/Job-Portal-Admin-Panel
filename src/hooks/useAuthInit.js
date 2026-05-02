import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { bootstrapAuth } from '../features/auth/authSlice';

let adminAuthBootStarted = false;

/** Restore session: legacy storage cleanup, HttpOnly refresh cookie → access in memory, then /auth/me. */
export function useAuthInit() {
  const dispatch = useDispatch();
  useEffect(() => {
    if (adminAuthBootStarted) return;
    adminAuthBootStarted = true;
    dispatch(bootstrapAuth());
  }, [dispatch]);
}
