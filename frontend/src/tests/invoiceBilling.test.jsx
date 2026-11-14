import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import PurchaseHistory from '../components/core/Dashboard/PurchaseHistory/PurchaseHistory';

vi.mock('react-redux', () => ({ useSelector: selector => selector({ auth: { token: 'student-token' } }) }));
vi.mock('../services/apiConnector', () => ({ apiConnector: vi.fn(async () => ({ data: { success: true, data: [{
  _id: 'order-12345678', invoiceNumber: 'INV-TEST', transactionId: 'TXN-TEST',
  courseName: 'Data Analysis', price: 0, originalPrice: 699, discountAmount: 699,
  purchaseDate: '2026-10-30', status: 'Completed', paymentMethod: 'plan_activation',
  course: { courseName: 'Data Analysis', instructor: { firstName: 'Teacher' } },
  user: { firstName: 'Invoice', lastName: 'Student', email: 'invoice@example.com', additionalDetails: { contactNumber: '9876543210' } }
}] } })) }));
afterEach(cleanup);

it('shows populated student billing details when opening a purchase invoice', async () => {
  render(<PurchaseHistory />);
  const buttons = await screen.findAllByRole('button', { name: /Download Invoice/i });
  fireEvent.click(buttons[0]);
  expect(screen.getByText('Invoice Student')).toBeTruthy();
  expect(screen.getByText(/invoice@example.com/)).toBeTruthy();
  expect(screen.getByText(/9876543210/)).toBeTruthy();
});
