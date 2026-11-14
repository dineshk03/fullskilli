import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PHPLoginHandler from '../components/core/PHPLoginHandler';

const { state, dispatch, initialize } = vi.hoisted(() => ({
  state: { auth: { token: 'lms-token' } }, dispatch: vi.fn(), initialize: vi.fn()
}));
vi.mock('react-redux', () => ({ useSelector: selector => selector(state), useDispatch: () => dispatch }));
vi.mock('../config/api', () => ({ PHP_BASE_URL: 'https://portal.example.com' }));
vi.mock('../services/phpIntegrationService', () => ({ default: { initializePHPSession: initialize } }));

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  dispatch.mockClear();
  state.auth.token = 'lms-token';
  initialize.mockReset().mockImplementation(() => new Promise(() => {}));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

it('renders the LMS immediately even while portal initialization hangs, and bounds the background work', async () => {
  const { rerender } = render(<PHPLoginHandler><h1>LMS ready</h1></PHPLoginHandler>);
  expect(screen.getByText('LMS ready')).toBeTruthy();
  expect(screen.queryByText('Initializing PHP integration...')).toBeNull();
  expect(initialize).toHaveBeenCalledTimes(1);
  rerender(<PHPLoginHandler><h1>LMS ready</h1></PHPLoginHandler>);
  expect(initialize).toHaveBeenCalledTimes(1);
  const signal = initialize.mock.calls[0][1].signal;
  await act(async () => vi.advanceTimersByTime(5000));
  expect(signal.aborted).toBe(true);
  expect(screen.getByText('LMS ready')).toBeTruthy();
});

it('cancels a slow portal session check and ignores its response after an LMS login', async () => {
  state.auth.token = null;
  localStorage.setItem('php_token', 'old-portal-token');
  let complete;
  const fetchMock = vi.fn(() => new Promise(resolve => { complete = resolve; }));
  vi.stubGlobal('fetch', fetchMock);
  const { rerender } = render(<PHPLoginHandler><h1>LMS ready</h1></PHPLoginHandler>);
  const signal = fetchMock.mock.calls[0][1].signal;
  state.auth.token = 'new-lms-token';
  rerender(<PHPLoginHandler><h1>LMS ready</h1></PHPLoginHandler>);
  expect(signal.aborted).toBe(true);
  await act(async () => complete({ ok: true, json: async () => ({ success: true, user: { id: 'old-user' } }) }));
  expect(dispatch).not.toHaveBeenCalled();
  expect(initialize).toHaveBeenCalledWith('new-lms-token', expect.any(Object));
});

it('does not contact the portal for a guest without a portal session', () => {
  state.auth.token = null;
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  render(<PHPLoginHandler><h1>LMS ready</h1></PHPLoginHandler>);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(initialize).not.toHaveBeenCalled();
  expect(screen.getByText('LMS ready')).toBeTruthy();
});
