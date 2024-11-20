import React from 'react';

const PageTransition: React.FC = () => {
  return (
    <div className="transition-container">
      <div className="arrow-container">
        <div className="igive-container">
          <span className="letter">i</span>
          <span className="letter">G</span>
          <span className="letter">i</span>
          <span className="letter">v</span>
          <span className="letter">e</span>
        </div>
        <div className="arrow">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div className="longfazers">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

        .transition-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to left, #1e2a45, #2c3c5f);
          background-size: 400% 400%;
          animation: shiftBackground 8s ease infinite; /* Adding the shifting effect */
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          z-index: 9999;
        }

        @keyframes shiftBackground {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .arrow-container {
          display: flex;
          flex-direction: column-reverse; /* Place "IGIVE" above the arrows */
          align-items: center;
          margin-bottom: 50px; /* Pushes the arrows down to move the text up */
          animation: speeder 0.4s linear infinite; /* Adding the shake effect */
        }

        @keyframes speeder {
          0% {
            transform: translate(2px, 1px);
          }
          10% {
            transform: translate(-1px, -3px);
          }
          20% {
            transform: translate(-2px, 0px);
          }
          30% {
            transform: translate(1px, 2px);
          }
          40% {
            transform: translate(1px, -1px);
          }
          50% {
            transform: translate(-1px, 3px);
          }
          60% {
            transform: translate(-1px, 1px);
          }
          70% {
            transform: translate(3px, 1px);
          }
          80% {
            transform: translate(-2px, -1px);
          }
          90% {
            transform: translate(2px, 1px);
          }
          100% {
            transform: translate(1px, -2px);
          }
        }

        .arrow {
          position: relative;
          top: 110px;
          left: 70px;
          transform: rotate(270deg);
        }
        
        .arrow span {
          display: block;
          width: 1vw;
          height: 1vw;
          border-bottom: 7px solid;
          border-right: 7px solid;
          transform: rotate(45deg);
          margin: -15px;
          animation: animate 1s infinite linear;
        }
        
        .arrow span:nth-child(2) {
          animation-delay: -0.1s;
        }
        
        .arrow span:nth-child(3) {
          animation-delay: -0.2s;
        }
        
        .igive-container {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 72px;
          letter-spacing: 12px;
          display: flex;
          justify-content: center;
          color: #000; /* Changed to black */
        }

        .letter {
          position: relative;
          opacity: 0;
          transform: translateY(50px);
          animation: fly-in .5s forwards;
        }
        
        .letter:nth-child(1) { animation-delay: 0.1s; }
        .letter:nth-child(2) { animation-delay: 0.2s; }
        .letter:nth-child(3) { animation-delay: 0.3s; }
        .letter:nth-child(4) { animation-delay: 0.4s; }
        .letter:nth-child(5) { animation-delay: 0.5s; }
        
        .longfazers {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        
        .longfazers span {
          position: absolute;
          height: 2px;
          width: 20%;
          background: #000;
        }
        
        .longfazers span:nth-child(1) {
          top: 20%;
          animation: lf .6s linear infinite;
          animation-delay: -5s;
        }
        
        .longfazers span:nth-child(2) {
          top: 40%;
          animation: lf2 .8s linear infinite;
          animation-delay: -1s;
        }
        
        .longfazers span:nth-child(3) {
          top: 60%;
          animation: lf3 .6s linear infinite;
        }
        
        .longfazers span:nth-child(4) {
          top: 80%;
          animation: lf4 .5s linear infinite;
          animation-delay: -3s;
        }
        
        @keyframes fly-in {
          0% {
            opacity: 0;
            transform: translateY(50px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes lf { 0% { left: 200%; } 100% { left: -200%; opacity: 0; } }
        @keyframes lf2 { 0% { left: 200%; } 100% { left: -200%; opacity: 0; } }
        @keyframes lf3 { 0% { left: 200%; } 100% { left: -100%; opacity: 0; } }
        @keyframes lf4 { 0% { left: 200%; } 100% { left: -100%; opacity: 0; } }
        
        @keyframes animate {
          0% {
            opacity: 0;
            transform: rotate(45deg) translate(-20px, -20px);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: rotate(45deg) translate(20px, 20px);
          }
        }
      `}</style>
    </div>
  );
};

export default PageTransition;
