import PropTypes from "prop-types";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PaymentAnimation.css';
const PaymentAnimation = ({
  type,
  onComplete
}) => {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onComplete) onComplete();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);
  return <AnimatePresence>
      {show && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} className="payment-animation-overlay">
          <motion.div initial={{
        scale: 0,
        rotateY: -180
      }} animate={{
        scale: 1,
        rotateY: 0
      }} exit={{
        scale: 0,
        rotateY: 180
      }} transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        duration: 0.8
      }} className="payment-animation-container">
            {type === 'success' ? <SuccessAnimation /> : <FailureAnimation />}
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};
const SuccessAnimation = () => {
  return <div className="animation-content success-animation">
      {/* 3D Coin Stack Animation */}
      <div className="coin-stack">
        <motion.div className="coin coin-1" initial={{
        y: -100,
        opacity: 0,
        rotateY: 0
      }} animate={{
        y: 0,
        opacity: 1,
        rotateY: 360
      }} transition={{
        delay: 0.2,
        duration: 0.8,
        rotateY: {
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }
      }} />
        <motion.div className="coin coin-2" initial={{
        y: -100,
        opacity: 0,
        rotateY: 0
      }} animate={{
        y: 0,
        opacity: 1,
        rotateY: 360
      }} transition={{
        delay: 0.3,
        duration: 0.8,
        rotateY: {
          duration: 1.2,
          repeat: Infinity,
          ease: "linear"
        }
      }} />
        <motion.div className="coin coin-3" initial={{
        y: -100,
        opacity: 0,
        rotateY: 0
      }} animate={{
        y: 0,
        opacity: 1,
        rotateY: 360
      }} transition={{
        delay: 0.4,
        duration: 0.8,
        rotateY: {
          duration: 1.4,
          repeat: Infinity,
          ease: "linear"
        }
      }} />
      </div>

      {/* Success Checkmark with 3D effect */}
      <motion.div className="success-checkmark-container" initial={{
      scale: 0,
      rotateZ: -180
    }} animate={{
      scale: 1,
      rotateZ: 0
    }} transition={{
      delay: 0.6,
      type: "spring",
      stiffness: 200
    }}>
        <svg className="checkmark" viewBox="0 0 52 52">
          <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
          <motion.path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" initial={{
          pathLength: 0
        }} animate={{
          pathLength: 1
        }} transition={{
          delay: 0.8,
          duration: 0.5
        }} />
        </svg>
      </motion.div>

      {/* Floating particles */}
      <div className="particles-container">
        {[...Array(12)].map((_, i) => <motion.div key={i} className="particle" initial={{
        scale: 0,
        x: 0,
        y: 0,
        opacity: 1
      }} animate={{
        scale: [0, 1, 0],
        x: Math.cos(i * 30 * Math.PI / 180) * 100,
        y: Math.sin(i * 30 * Math.PI / 180) * 100,
        opacity: [0, 1, 0]
      }} transition={{
        delay: 0.8 + i * 0.05,
        duration: 1.2,
        ease: "easeOut"
      }} />)}
      </div>

      {/* Text */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 1,
      duration: 0.5
    }} className="animation-text">
        <h2 className="success-title">Payment Successful!</h2>
        <p className="success-subtitle">Your enrollment is confirmed</p>
      </motion.div>
    </div>;
};
const FailureAnimation = () => {
  return <div className="animation-content failure-animation">
      {/* 3D Broken Card Animation */}
      <div className="card-container">
        <motion.div className="card-half card-left" initial={{
        x: 0,
        rotateY: 0
      }} animate={{
        x: -50,
        rotateY: -30,
        rotateZ: -15
      }} transition={{
        delay: 0.3,
        duration: 0.6,
        type: "spring"
      }}>
          <div className="card-content">
            <div className="card-chip" />
            <div className="card-stripe" />
          </div>
        </motion.div>
        
        <motion.div className="card-half card-right" initial={{
        x: 0,
        rotateY: 0
      }} animate={{
        x: 50,
        rotateY: 30,
        rotateZ: 15
      }} transition={{
        delay: 0.3,
        duration: 0.6,
        type: "spring"
      }}>
          <div className="card-content">
            <div className="card-numbers">****</div>
          </div>
        </motion.div>
      </div>

      {/* Error X mark with 3D effect */}
      <motion.div className="error-x-container" initial={{
      scale: 0,
      rotateZ: -180
    }} animate={{
      scale: 1,
      rotateZ: 0
    }} transition={{
      delay: 0.6,
      type: "spring",
      stiffness: 200
    }}>
        <svg className="error-x" viewBox="0 0 52 52">
          <circle className="error-circle" cx="26" cy="26" r="25" fill="none" />
          <motion.path className="error-line error-line-1" fill="none" d="M16 16 L36 36" initial={{
          pathLength: 0
        }} animate={{
          pathLength: 1
        }} transition={{
          delay: 0.8,
          duration: 0.3
        }} />
          <motion.path className="error-line error-line-2" fill="none" d="M36 16 L16 36" initial={{
          pathLength: 0
        }} animate={{
          pathLength: 1
        }} transition={{
          delay: 1,
          duration: 0.3
        }} />
        </svg>
      </motion.div>

      {/* Shaking effect particles */}
      <div className="error-particles-container">
        {[...Array(8)].map((_, i) => <motion.div key={i} className="error-particle" initial={{
        scale: 1,
        x: 0,
        y: 0,
        opacity: 1
      }} animate={{
        scale: [1, 0],
        x: Math.cos(i * 45 * Math.PI / 180) * 80,
        y: Math.sin(i * 45 * Math.PI / 180) * 80,
        opacity: [1, 0]
      }} transition={{
        delay: 0.8 + i * 0.05,
        duration: 1,
        ease: "easeOut"
      }} />)}
      </div>

      {/* Text */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 1.2,
      duration: 0.5
    }} className="animation-text">
        <h2 className="failure-title">Payment Failed</h2>
        <p className="failure-subtitle">Please try again or use a different payment method</p>
      </motion.div>
    </div>;
};
export default PaymentAnimation;
PaymentAnimation.propTypes = {
  "type": PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  "onComplete": PropTypes.func
};
