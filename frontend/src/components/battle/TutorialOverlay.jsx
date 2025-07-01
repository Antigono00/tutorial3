// src/components/battle/TutorialOverlay.jsx
import React, { useState, useEffect } from 'react';
import { tutorialManager } from '../../utils/tutorialManager';
import './TutorialOverlay.css';

const TutorialOverlay = ({ message, progress, onDismiss, onSkipTutorial }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  // Calculate progress percentage
  const progressPercentage = progress ? progress.percentage : 0;

  const handleDismiss = () => {
    // Mark this message as dismissed
    tutorialManager.dismissCurrentMessage();
    
    // Call the parent's onDismiss handler
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className={`tutorial-overlay ${isAnimating ? 'animating' : ''}`}>
      {/* Render highlight FIRST so it appears behind everything else */}
      {message.highlight && (
        <div className={`tutorial-highlight ${message.highlight}`} />
      )}
      
      {/* Backdrop comes after highlight but before message */}
      <div className="tutorial-backdrop" onClick={handleDismiss} />
      
      {/* Message comes last so it appears on top */}
      <div className={`tutorial-message ${message.arrow || ''}`}>
        <div className="tutorial-header">
          <div className="tutorial-icon">💡</div>
          <h3>{message.title}</h3>
          <button className="tutorial-close" onClick={handleDismiss} title="Continue">
            →
          </button>
        </div>
        
        {progress && (
          <div className="tutorial-step-indicator">
            Step {progress.stepIndex + 1} of {progress.totalSteps}
          </div>
        )}
        
        <div className="tutorial-content">
          <p>{message.message}</p>
          {message.subtext && (
            <p className="tutorial-subtext">{message.subtext}</p>
          )}
        </div>
        
        <div className="tutorial-footer">
          <button className="tutorial-skip" onClick={onSkipTutorial}>
            Skip Tutorial
          </button>
          <button className="tutorial-continue" onClick={handleDismiss}>
            {message.requiresAction ? 'I understand' : 'Got it! Continue'}
          </button>
        </div>
        
        {/* Progress indicator */}
        <div className="tutorial-progress">
          <div 
            className="tutorial-progress-bar" 
            style={{ width: `${progressPercentage}%` }} 
          />
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
