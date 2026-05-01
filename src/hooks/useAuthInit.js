import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchMe } from '../features/auth/authSlice';

/** Restore session if this browser has logged in before (hint + tokens / cookie refresh). */
export function useAuthInit() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);
}
