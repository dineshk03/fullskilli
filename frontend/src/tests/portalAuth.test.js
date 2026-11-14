import { expect, it } from 'vitest';
import { axiosInstance } from '../services/apiConnector';

it('an optional portal authentication failure does not erase the LMS session', async () => {
  localStorage.setItem('token', 'current-lms-token');
  const error = { config: { skipAuthRedirect: true }, response: { status: 401, data: { reason: 'TOKEN_EXPIRED' } } };
  await expect(axiosInstance.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error);
  expect(localStorage.getItem('token')).toBe('current-lms-token');
  localStorage.removeItem('token');
});
