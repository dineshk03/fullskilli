import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import CourseCheckout from '../pages/CourseCheckout';

const { request, buy, dispatch } = vi.hoisted(() => ({ request: vi.fn(), buy: vi.fn(), dispatch: vi.fn() }));
vi.mock('react-redux', () => ({
  useSelector: selector => selector({ auth: { token: 'student-token' }, profile: { user: { pid: '123' } } }),
  useDispatch: () => dispatch
}));
vi.mock('../services/apiConnector', () => ({ apiConnector: request }));
vi.mock('../services/operations/studentFeaturesAPI', () => ({ buyCourse: buy }));
vi.mock('../components/core/Dashboard/Cart/CouponInput', () => ({ default: () => <div>Coupons</div> }));
vi.mock('../components/common/RatingStars', () => ({ default: () => null }));
afterEach(() => { cleanup(); request.mockReset(); buy.mockReset(); });

function renderCheckout() {
  return render(<MemoryRouter initialEntries={[{ pathname: '/checkout', state: { course: {
    _id: 'course-1', courseName: 'AI & Prompt Engineering', courseType: 'Premium', price: 699
  } } }]}><CourseCheckout /></MemoryRouter>);
}

it('uses an eligible purchased plan instead of starting another payment', async () => {
  request.mockResolvedValue({ data: { plans: [{ plan_name: 'CLASSIC', status: 'ACTIVE', activation_code: 'plan-code', courses: { remaining: 1 } }] } });
  renderCheckout();
  fireEvent.click(await screen.findByRole('button', { name: 'Enroll Using Plan' }));
  expect(buy).toHaveBeenCalledWith('student-token', ['course-1'], expect.any(Object), expect.any(Function), dispatch, null, 'plan-code');
  expect(screen.queryByText('Coupons')).toBeNull();
});

it('blocks payment when plan lookup fails and allows retry', async () => {
  request.mockRejectedValue(new Error('Unavailable'));
  renderCheckout();
  await screen.findByRole('alert');
  expect(screen.getByRole('button', { name: 'Complete Purchase' }).disabled).toBe(true);
  request.mockResolvedValue({ data: { plans: [] } });
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Complete Purchase' }).disabled).toBe(false));
});

it('uses the chosen plan and restores paid checkout when no plan is selected', async () => {
  request.mockResolvedValue({ data: { plans: [
    { plan_name: 'CLASSIC', status: 'ACTIVE', activation_code: 'classic-code', courses: { used: 1, remaining: 2, total: 3 } },
    { plan_name: 'PREMIUM', status: 'ACTIVE', activation_code: 'premium-code', courses: { used: 0, remaining: 5, total: 5 } },
    { plan_name: 'EXPIRED', status: 'EXPIRED', activation_code: 'expired-code', courses: { remaining: 3 } },
    { plan_name: 'EXHAUSTED', status: 'ACTIVE', activation_code: 'empty-code', courses: { remaining: 0 } }
  ] } });
  renderCheckout();
  await screen.findByRole('radio', { name: 'CLASSIC plan' });
  expect(screen.queryByRole('radio', { name: /EXPIRED|EXHAUSTED/ })).toBeNull();
  fireEvent.click(screen.getByRole('radio', { name: 'PREMIUM plan' }));
  expect(screen.getByText('PREMIUM plan benefit:')).toBeTruthy();
  expect(screen.getByText('4 after enrollment')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Enroll Using Plan' }));
  expect(buy).toHaveBeenLastCalledWith('student-token', ['course-1'], expect.any(Object), expect.any(Function), dispatch, null, 'premium-code');
  fireEvent.click(screen.getByRole('radio', { name: 'Pay without using a plan' }));
  expect(screen.getByText('Coupons')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Complete Purchase' }));
  expect(buy).toHaveBeenLastCalledWith('student-token', ['course-1'], expect.any(Object), expect.any(Function), dispatch, null, undefined);
});
