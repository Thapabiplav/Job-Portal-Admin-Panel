import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchMe } from '../features/auth/authSlice';
import { getAccessToken } from '../utils/authStore';

export function useAuthInit() {
  const dispatch = useDispatch();
  useEffect(() => {
    if (getAccessToken()) {
      dispatch(fetchMe());
    }
  }, [dispatch]);
}
