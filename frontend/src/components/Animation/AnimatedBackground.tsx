import React from 'react';
import { Box, keyframes, styled } from '@mui/material';

const animate = keyframes`
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
    border-radius: 0;
  }
  100% {
    transform: translateY(-1000px) rotate(720deg);
    opacity: 0;
    border-radius: 50%;
  }
`;

const AreaBox = styled(Box)({
  background: 'linear-gradient(to left, #1e2a45, #2c3c5f)',  // Gradient using your existing blue
  width: '100%',
  height: '100vh',
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: -1,
});

const CirclesList = styled('ul')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  margin: 0,
  padding: 0,
});

const CircleItem = styled('li')<{ index: number }>(({ index }) => ({
  position: 'absolute',
  display: 'block',
  listStyle: 'none',
  width: '20px',
  height: '20px',
  background: 'rgba(255, 255, 255, 0.1)',  // Lighter, more subtle circles
  animation: `${animate} 25s linear infinite`,
  bottom: '-150px',
  ...(index === 0 && { left: '25%', width: '80px', height: '80px', animationDelay: '0s' }),
  ...(index === 1 && { left: '10%', width: '20px', height: '20px', animationDelay: '2s', animationDuration: '12s' }),
  ...(index === 2 && { left: '70%', width: '20px', height: '20px', animationDelay: '4s' }),
  ...(index === 3 && { left: '40%', width: '60px', height: '60px', animationDelay: '0s', animationDuration: '18s' }),
  ...(index === 4 && { left: '65%', width: '20px', height: '20px', animationDelay: '0s' }),
  ...(index === 5 && { left: '75%', width: '110px', height: '110px', animationDelay: '3s' }),
  ...(index === 6 && { left: '35%', width: '150px', height: '150px', animationDelay: '7s' }),
  ...(index === 7 && { left: '50%', width: '25px', height: '25px', animationDelay: '15s', animationDuration: '45s' }),
  ...(index === 8 && { left: '20%', width: '15px', height: '15px', animationDelay: '2s', animationDuration: '35s' }),
  ...(index === 9 && { left: '85%', width: '150px', height: '150px', animationDelay: '0s', animationDuration: '11s' }),
}));

const AnimatedBackground: React.FC = () => {
  return (
    <AreaBox>
      <CirclesList>
        {[...Array(10)].map((_, index) => (
          <CircleItem key={index} index={index} />
        ))}
      </CirclesList>
    </AreaBox>
  );
};

export default AnimatedBackground;