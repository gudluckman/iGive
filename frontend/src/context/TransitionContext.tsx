import React, { createContext, useState, useContext, useEffect } from 'react';

interface TransitionContextType {
  showTransition: boolean;
  setShowTransition: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthTransition: boolean;
  setIsAuthTransition: React.Dispatch<React.SetStateAction<boolean>>;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const TransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showTransition, setShowTransition] = useState(false);
  const [isAuthTransition, setIsAuthTransition] = useState(false);

  useEffect(() => {
    if (showTransition && isAuthTransition) {
      const timer = setTimeout(() => {
        setShowTransition(false);
        setIsAuthTransition(false);
      }, 2500); // Adjust this time as needed
      return () => clearTimeout(timer);
    }
  }, [showTransition, isAuthTransition]);

  return (
    <TransitionContext.Provider value={{ showTransition, setShowTransition, isAuthTransition, setIsAuthTransition }}>
      {children}
    </TransitionContext.Provider>
  );
};

export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (context === undefined) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  return context;
};