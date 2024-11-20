import { useState, useEffect } from 'react';

const AnimatedCross = () => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="red" // Changed to red
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-red-500" // Optional: you can remove this if not needed
    >
      <path
        d="M18 6L6 18"
        className={`${
          animate ? 'animate-draw-line' : ''
        }`}
        style={{
          strokeDasharray: 20,
          strokeDashoffset: animate ? 0 : 20,
          transition: 'stroke-dashoffset 0.3s ease-in-out'
        }}
      />
      <path
        d="M6 6L18 18"
        className={`${
          animate ? 'animate-draw-line-delayed' : ''
        }`}
        style={{
          strokeDasharray: 20,
          strokeDashoffset: animate ? 0 : 20,
          transition: 'stroke-dashoffset 0.3s ease-in-out',
          transitionDelay: '0.2s'
        }}
      />
    </svg>
  );
};

export default AnimatedCross;
