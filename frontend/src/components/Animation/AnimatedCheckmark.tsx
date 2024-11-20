import React from 'react';
import { Box, styled } from '@mui/material';

const StyledSvg = styled('svg')(({ theme }) => ({
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  display: 'block',
  strokeWidth: 2,
  stroke: 'white',
  strokeMiterlimit: 10,
  margin: '10% auto',
  boxShadow: 'inset 0px 0px 0px #7ac142',
  animation: 'fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both'
}));

const StyledCircle = styled('circle')({
  strokeDasharray: '166',
  strokeDashoffset: '166',
  strokeWidth: 2,
  strokeMiterlimit: 10,
  stroke: '#7ac142',
  fill: 'none',
  animation: 'stroke 0.4s cubic-bezier(0.65, 0, 0.45, 1) forwards'
});

const StyledPath = styled('path')({
  transformOrigin: '50% 50%',
  strokeDasharray: '48',
  strokeDashoffset: '48',
  animation: 'stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.4s forwards'
});

const AnimatedCheckmark: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
        opacity: 1,
        '@keyframes stroke': {
          '100%': {
            strokeDashoffset: 0
          }
        },
        '@keyframes scale': {
          '0%, 100%': {
            transform: 'none'
          },
          '50%': {
            transform: 'scale(1.1)'
          }
        },
        '@keyframes fill': {
          '100%': {
            boxShadow: 'inset 0px 0px 0px 30px #7ac142'
          }
        }
      }}
    >
      <StyledSvg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 52 52"
      >
        <StyledCircle
          cx="26"
          cy="26"
          r="25"
        />
        <StyledPath
          fill="none"
          d="M14.1 27.2l7.1 7.2 16.7-16.8"
        />
      </StyledSvg>
    </Box>
  );
};

export default AnimatedCheckmark;