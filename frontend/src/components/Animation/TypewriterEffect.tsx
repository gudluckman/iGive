import React from 'react';
import { styled, keyframes } from '@mui/material/styles';

const typewriter = keyframes`
  0% { width: 0; }
  99% { width: 100%; border-right-color: rgba(44, 60, 95, 0.75); }
  100% { width: 100%; border-right-color: transparent; }
`;

const TypewriterContainer = styled('div')(({ theme }) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: '14px', // Default font size for larger screens
  fontWeight: 400,
  textAlign: 'center',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  margin: '0 auto',
  borderRight: '2px solid rgba(44, 60, 95, 0.75)',
  padding: '4px 0',
  color: '#2c3c5f',
  animation: `${typewriter} 4s steps(44, end) 1s forwards`,
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    right: '0',
    top: '0',
    height: '100%',
    width: '2px',
    backgroundColor: 'transparent',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '12px',
  },
}));

interface TypewriterEffectProps {
  text: string;
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({ text }) => {
  return (
    <div style={{ 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'center',
      padding: '8px 0',
    }}>
      <TypewriterContainer>{text}</TypewriterContainer>
    </div>
  );
};

export default TypewriterEffect;