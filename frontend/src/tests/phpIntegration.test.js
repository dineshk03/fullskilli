import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import service from '../services/phpIntegrationService';
import { apiConnector } from '../services/apiConnector';

vi.mock('../config/api', () => ({ PHP_BASE_URL: 'https://portal.example.com' }));
vi.mock('../services/apiConnector', () => ({ apiConnector: vi.fn() }));
beforeEach(() => { service.clearSession(); apiConnector.mockReset(); });
afterEach(() => service.clearSession());

it('uses the existing subscription method and bounds both initialization requests', async () => {
  apiConnector.mockResolvedValueOnce({ data: { success: true, user: { id: 'portal-user' } } })
    .mockResolvedValueOnce({ data: { success: true, data: [] } });
  const signal = new AbortController().signal;
  const result = await service.initializePHPSession('lms-token', { signal });
  expect(result.success).toBe(true);
  expect(apiConnector).toHaveBeenCalledTimes(2);
  expect(apiConnector.mock.calls[1][1]).toContain('/api/course-subscriptions/user');
  for (const call of apiConnector.mock.calls) {
    expect(call[5]).toEqual({ timeout: 5000, signal, skipAuthRedirect: true });
    expect(call[3].Authorization).toBe('Bearer lms-token');
  }
});

it('does not save a session from a cancelled initialization response', async () => {
  const controller = new AbortController();
  controller.abort();
  apiConnector.mockResolvedValue({ data: { success: true, user: { id: 'old-user' } } });
  const result = await service.initializePHPSession('old-token', { signal: controller.signal });
  expect(result.success).toBe(false);
  expect(service.getCurrentUser()).toBeNull();
  expect(apiConnector).toHaveBeenCalledTimes(1);
});
