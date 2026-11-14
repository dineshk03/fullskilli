import { showPaymentAnimation } from '../../utils/paymentAnimationHelper';

/**
 * Test component for payment animations
 * Add this to any page to test the animations
 */
const PaymentAnimationTest = () => {
  const testSuccessAnimation = () => {
    showPaymentAnimation('success', () => {
      console.log('Success animation completed!');
    });
  };
  const testFailureAnimation = () => {
    showPaymentAnimation('failure', () => {
      console.log('Failure animation completed!');
    });
  };
  return <div style={{
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9998,
    display: 'flex',
    gap: '10px',
    flexDirection: 'column'
  }}>
      <button onClick={testSuccessAnimation} style={{
      padding: '12px 24px',
      background: '#22C55E',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
    }}>
        Test Success Animation
      </button>
      <button onClick={testFailureAnimation} style={{
      padding: '12px 24px',
      background: '#EF4444',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
    }}>
        Test Failure Animation
      </button>
    </div>;
};
export default PaymentAnimationTest;
