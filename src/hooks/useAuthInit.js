import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchMe } from '../features/auth/authSlice';

/** Restore session from HttpOnly cookies only (GET /auth/me). */
export function useAuthInit() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);
}
