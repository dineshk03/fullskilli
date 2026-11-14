import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import EnhancedZoomMeetingViewer from '../components/core/ViewCourse/EnhancedZoomMeetingViewer';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('../services/apiConnector', () => ({ apiConnector: request }));
vi.mock('react-redux', () => ({ useSelector: selector => selector({ auth: { token: 'student-token' }, profile: { user: { accountType: 'Student' } } }) }));
afterEach(() => { cleanup(); request.mockReset(); });

it('renders while meeting details are pending instead of crashing the course viewer', () => {
  request.mockImplementation(() => new Promise(() => {}));
  const { container } = render(<EnhancedZoomMeetingViewer subSectionId="lecture-1" />);
  expect(container.innerHTML).not.toBe('');
  expect(request).toHaveBeenCalledTimes(1);
});

it('handles a lecture with no scheduled meeting without crashing', async () => {
  request.mockRejectedValue({ response: { status: 404 } });
  render(<EnhancedZoomMeetingViewer subSectionId="lecture-1" />);
  await waitFor(() => expect(screen.queryByText(/Loading/i)).toBeNull());
  expect(request).toHaveBeenCalledTimes(1);
});
