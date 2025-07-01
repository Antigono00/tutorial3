// src/utils/tutorialManager.js - Enhanced Tutorial Management System with Fixed Transitions

export class TutorialManager {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.completedSteps = new Set();
    this.dismissedMessages = new Set(); // Track dismissed messages
    this.waitingForAction = false; // Track if we're waiting for an action
    this.actionCount = {
      deploy: 0,
      attack: 0,
      defend: 0,
      useTool: 0,
      useSpell: 0,
      endTurn: 0
    };
    this.tutorialSteps = [
      'intro',
      'firstDeploy',
      'energyExplanation',
      'firstEndTurn',
      'aiTurnExplanation',
      'firstAttack',
      'defendExplanation',
      'secondEndTurn',
      'saveEnergyTurn',
      'deployWithSynergy',
      'synergyExplanation',
      'spellIntroduction',
      'useSpell',
      'toolIntroduction',
      'useTool',
      'finalAttack',
      'victory'
    ];
    this.currentStepIndex = 0;
    this.lastShownMessage = null;
    this.messageJustAdvanced = false; // Track if we just advanced
  }

  startTutorial() {
    this.isActive = true;
    this.currentStepIndex = 0;
    this.completedSteps.clear();
    this.dismissedMessages.clear();
    this.waitingForAction = false;
    this.lastShownMessage = null;
    this.messageJustAdvanced = false;
    this.actionCount = {
      deploy: 0,
      attack: 0,
      defend: 0,
      useTool: 0,
      useSpell: 0,
      endTurn: 0
    };
  }

  endTutorial() {
    this.isActive = false;
  }

  recordAction(actionType) {
    if (this.actionCount[actionType] !== undefined) {
      this.actionCount[actionType]++;
      console.log(`Tutorial: Recorded action ${actionType}, count: ${this.actionCount[actionType]}`);
    }
  }

  advanceStep() {
    if (this.currentStepIndex < this.tutorialSteps.length - 1) {
      const oldStep = this.getCurrentStep();
      this.currentStepIndex++;
      this.waitingForAction = false;
      this.dismissedMessages.clear(); // Clear dismissed messages when advancing
      this.lastShownMessage = null; // Clear last shown message
      this.messageJustAdvanced = true; // Mark that we just advanced
      console.log(`Tutorial: Advanced from ${oldStep} to ${this.getCurrentStep()}`);
      return true;
    }
    return false;
  }

  getCurrentStep() {
    return this.tutorialSteps[this.currentStepIndex];
  }

  dismissCurrentMessage() {
    const currentStep = this.getCurrentStep();
    this.dismissedMessages.add(currentStep);
    
    // If this message doesn't require an action, we're now waiting for the condition to advance
    const messages = this.getMessagesConfig();
    const currentMessage = messages[currentStep];
    
    if (currentMessage && !currentMessage.requiresAction) {
      this.waitingForAction = true;
    }
    
    console.log(`Tutorial: Dismissed message for step ${currentStep}`);
  }

  hasMessageBeenDismissed(step) {
    return this.dismissedMessages.has(step);
  }

  getMessagesConfig() {
    return {
      intro: {
        title: "Welcome to CryptoCreatures Battle!",
        message: "This is a turn-based strategy game where you deploy creatures and use their abilities to defeat enemies.",
        subtext: "Let's start by deploying your first creature. Click a creature in your hand at the bottom of the screen.",
        highlight: "hand",
        arrow: "bottom",
        priority: 10,
        action: null,
        requiresAction: false
      },
      firstDeploy: {
        title: "Deploy Your First Creature",
        message: "Great! You've selected a creature. Now click the 'Deploy' button to place it on the battlefield.",
        subtext: "Each creature costs energy to deploy based on its form level.",
        highlight: "action-panel",
        arrow: "right",
        priority: 9,
        action: 'deploy',
        requiresAction: true
      },
      energyExplanation: {
        title: "Understanding Energy",
        message: "Excellent! Your creature is deployed. Notice your energy decreased? You gain 3-5 energy each turn.",
        subtext: "You can deploy another creature or end your turn to save energy. Try ending your turn.",
        highlight: "energy",
        arrow: "top",
        priority: 8,
        action: null,
        requiresAction: false
      },
      firstEndTurn: {
        title: "End Your Turn",
        message: "Click 'End Turn' to finish your turn and let the enemy act.",
        subtext: "You'll gain more energy at the start of your next turn.",
        highlight: "action-panel",
        arrow: "right",
        priority: 8,
        action: 'endTurn',
        requiresAction: true
      },
      aiTurnExplanation: {
        title: "Enemy's Turn",
        message: "The enemy is now taking their turn. Watch what they do!",
        subtext: "After their turn, it will be your turn again with fresh energy.",
        highlight: null,
        arrow: null,
        priority: 7,
        action: null,
        requiresAction: false,
        autoAdvance: true,
        autoAdvanceDelay: 3000
      },
      firstAttack: {
        title: "Time to Attack!",
        message: "Now that you have a creature on the field, let's attack! Select your creature, then click an enemy creature to target it.",
        subtext: "Attacks cost 2 energy. Different creatures have different attack types.",
        highlight: "enemy-field",
        arrow: "top",
        priority: 7,
        action: 'attack',
        requiresAction: true
      },
      defendExplanation: {
        title: "Defensive Strategy",
        message: "Good attack! Sometimes it's better to defend. Select your creature and click 'Defend' to reduce incoming damage.",
        subtext: "Defending costs 1 energy and greatly reduces damage for one turn.",
        highlight: "action-panel",
        arrow: "right",
        priority: 6,
        action: 'defend',
        requiresAction: true
      },
      secondEndTurn: {
        title: "End Your Turn",
        message: "Nice defensive play! Now end your turn.",
        subtext: "The enemy will attack, but your defense will reduce the damage.",
        highlight: "action-panel",
        arrow: "right",
        priority: 6,
        action: 'endTurn',
        requiresAction: true
      },
      saveEnergyTurn: {
        title: "Save Your Energy",
        message: "Sometimes it's strategic to pass your turn to save energy. Just click 'End Turn' without taking actions.",
        subtext: "This will give you more energy next turn to deploy another creature!",
        highlight: "action-panel",
        arrow: "right",
        priority: 5,
        action: 'endTurn',
        requiresAction: true
      },
      deployWithSynergy: {
        title: "Deploy Another Creature",
        message: "Great! You saved energy. Now deploy another creature from your hand.",
        subtext: "Having multiple creatures can activate powerful synergies!",
        highlight: "hand",
        arrow: "bottom",
        priority: 5,
        action: 'deploy',
        requiresAction: true
      },
      synergyExplanation: {
        title: "Synergy Activated!",
        message: "Excellent! When you have multiple creatures with matching traits, they get bonus power!",
        subtext: "Look for the synergy indicators. Now attack with your powered-up creature!",
        highlight: "battlefield-player",
        arrow: null,
        priority: 4,
        action: 'attack',
        requiresAction: true
      },
      spellIntroduction: {
        title: "Powerful Spells",
        message: "You've unlocked spell casting! Spells are more powerful than regular attacks but cost 4 energy.",
        subtext: "Select a creature and click 'Use Spell' to see your available spells.",
        highlight: "action-panel",
        arrow: "right",
        priority: 3,
        action: null,
        requiresAction: false
      },
      useSpell: {
        title: "Cast Your First Spell",
        message: "Choose a spell and a target. Spells can deal massive damage or provide powerful effects!",
        subtext: "Your creature's Magic stat affects spell power.",
        highlight: "action-panel",
        arrow: "right",
        priority: 3,
        action: 'useSpell',
        requiresAction: true
      },
      toolIntroduction: {
        title: "Don't Forget Your Tools!",
        message: "Tools provide temporary buffs and don't cost energy! Perfect for enhancing your creatures.",
        subtext: "Select a creature and click 'Use Tool' to apply one.",
        highlight: "action-panel",
        arrow: "right",
        priority: 2,
        action: null,
        requiresAction: false
      },
      useTool: {
        title: "Use a Tool",
        message: "Apply a tool to boost your creature's stats. Each tool has different effects!",
        subtext: "Tools are free to use - no energy cost!",
        highlight: "action-panel",
        arrow: "right",
        priority: 2,
        action: 'useTool',
        requiresAction: true
      },
      finalAttack: {
        title: "Finish Them Off!",
        message: "Your creature is powered up! Attack to defeat the remaining enemies!",
        subtext: "Use everything you've learned to achieve victory!",
        highlight: "enemy-field",
        arrow: "top",
        priority: 1,
        action: 'attack',
        requiresAction: true
      },
      victory: {
        title: "Path to Victory",
        message: "You've learned all the basics! Defeat all enemy creatures to win!",
        subtext: "Remember: deploy efficiently, attack wisely, and use your items strategically!",
        highlight: null,
        arrow: null,
        priority: 0,
        action: null,
        requiresAction: false
      }
    };
  }

  getTutorialMessage(context, state) {
    if (!this.isActive) return null;

    const currentStep = this.getCurrentStep();
    const { turn, playerField, enemyField, selectedCreature, playerEnergy, activePlayer } = state;

    console.log(`Tutorial: Getting message for step ${currentStep}, dismissed: ${this.hasMessageBeenDismissed(currentStep)}, waiting: ${this.waitingForAction}, justAdvanced: ${this.messageJustAdvanced}`);

    // If we just advanced, always show the new message
    if (this.messageJustAdvanced) {
      this.messageJustAdvanced = false;
      const messages = this.getMessagesConfig();
      const currentMessage = messages[currentStep];
      if (currentMessage) {
        this.lastShownMessage = currentMessage;
        console.log(`Tutorial: Showing message after advancement: ${currentMessage.title}`);
        return currentMessage;
      }
    }

    // Special handling for certain steps
    switch (currentStep) {
      case 'intro':
        // If we're waiting for action (message was dismissed) and creature is selected
        if (this.waitingForAction && selectedCreature && !playerField.some(c => c.id === selectedCreature.id)) {
          this.dismissedMessages.clear(); // Clear dismissed messages
          this.advanceStep();
          this.waitingForAction = false;
          return this.getTutorialMessage(context, state);
        }
        break;
        
      case 'energyExplanation':
        // Show this message immediately after first deployment
        if (this.actionCount.deploy >= 1 && !this.hasMessageBeenDismissed(currentStep)) {
          const currentMessage = this.getMessagesConfig()[currentStep];
          this.lastShownMessage = currentMessage;
          return currentMessage;
        }
        break;
        
      case 'aiTurnExplanation':
        // Show during enemy turn
        if (activePlayer === 'enemy' && !this.hasMessageBeenDismissed(currentStep)) {
          // Auto-advance after delay
          if (!this.completedSteps.has(currentStep)) {
            this.completedSteps.add(currentStep);
            setTimeout(() => {
              this.dismissedMessages.clear();
              this.advanceStep();
            }, this.getMessagesConfig()[currentStep].autoAdvanceDelay || 3000);
          }
          const currentMessage = this.getMessagesConfig()[currentStep];
          this.lastShownMessage = currentMessage;
          return currentMessage;
        } else if (activePlayer === 'player' && this.hasMessageBeenDismissed(currentStep)) {
          // Enemy turn is over, advance
          this.dismissedMessages.clear();
          this.advanceStep();
          return this.getTutorialMessage(context, state);
        }
        break;
        
      case 'spellIntroduction':
        // Check if player has enough energy for spells
        if (playerEnergy >= 4 && !this.hasMessageBeenDismissed(currentStep)) {
          const currentMessage = this.getMessagesConfig()[currentStep];
          this.lastShownMessage = currentMessage;
          return currentMessage;
        } else if (playerEnergy < 4 && !this.hasMessageBeenDismissed(currentStep)) {
          // Skip to tool introduction if not enough energy
          this.currentStepIndex = this.tutorialSteps.indexOf('toolIntroduction');
          this.dismissedMessages.clear();
          return this.getTutorialMessage(context, state);
        }
        break;
    }

    // Check if we need to show the current step's message
    const messages = this.getMessagesConfig();
    const currentMessage = messages[currentStep];
    
    if (!currentMessage) return null;

    // Don't show message if it's been dismissed (unless waiting for action)
    if (this.hasMessageBeenDismissed(currentStep) && !currentMessage.requiresAction) {
      return null;
    }

    // Check if action requirement is met
    if (currentMessage.requiresAction && currentMessage.action) {
      const requiredCount = this.getRequiredActionCount(currentStep);
      if (this.actionCount[currentMessage.action] >= requiredCount) {
        // Action completed, advance to next step
        console.log(`Tutorial: Action requirement met for ${currentStep}`);
        this.dismissedMessages.clear();
        this.advanceStep();
        // Recursively call to get the next message
        return this.getTutorialMessage(context, state);
      }
    }

    // Show the message if it hasn't been shown yet or if we're showing the same message
    if (!this.lastShownMessage || this.lastShownMessage.title !== currentMessage.title || !this.hasMessageBeenDismissed(currentStep)) {
      this.lastShownMessage = currentMessage;
      return currentMessage;
    }

    return null;
  }

  getRequiredActionCount(step) {
    const requirements = {
      firstDeploy: 1,
      firstEndTurn: 1,
      firstAttack: 1,
      defendExplanation: 1,
      secondEndTurn: 2,
      saveEnergyTurn: 3,
      deployWithSynergy: 2,
      synergyExplanation: 2,
      useSpell: 1,
      useTool: 1,
      finalAttack: 3
    };
    
    return requirements[step] || 1;
  }

  handleActionCompleted(action) {
    if (!this.isActive) return;
    
    const currentStep = this.getCurrentStep();
    const messages = this.getMessagesConfig();
    const currentMessage = messages[currentStep];
    
    console.log(`Tutorial: handleActionCompleted called for action: ${action}, current step: ${currentStep}`);
    
    if (currentMessage && currentMessage.action === action) {
      this.recordAction(action);
      
      // Check if we've met the requirement
      const requiredCount = this.getRequiredActionCount(currentStep);
      if (this.actionCount[action] >= requiredCount) {
        console.log(`Tutorial: Action requirement met, advancing from ${currentStep}`);
        this.dismissedMessages.clear();
        this.advanceStep();
        // The message will be shown on the next getTutorialMessage call
      }
    }
    
    // Special case: if we're waiting for any action after dismissing a non-action message
    if (this.waitingForAction && !currentMessage.requiresAction) {
      // Check if this action should trigger advancement
      const nextStepIndex = this.currentStepIndex + 1;
      if (nextStepIndex < this.tutorialSteps.length) {
        const nextStep = this.tutorialSteps[nextStepIndex];
        const nextMessage = messages[nextStep];
        
        if (nextMessage && nextMessage.action === action) {
          console.log(`Tutorial: Advancing due to action matching next step requirement`);
          this.dismissedMessages.clear();
          this.advanceStep();
          this.waitingForAction = false;
        }
      }
    }
  }

  shouldHighlight(element, state) {
    if (!this.isActive) return false;

    const currentStep = this.getCurrentStep();
    
    // Don't highlight if message has been dismissed
    if (this.hasMessageBeenDismissed(currentStep)) {
      return false;
    }
    
    switch (currentStep) {
      case 'intro':
        return element === 'hand';
      case 'firstDeploy':
      case 'firstEndTurn':
      case 'defendExplanation':
      case 'secondEndTurn':
      case 'saveEnergyTurn':
      case 'spellIntroduction':
      case 'useSpell':
      case 'toolIntroduction':
      case 'useTool':
        return element === 'action-panel';
      case 'energyExplanation':
        return element === 'energy';
      case 'firstAttack':
      case 'finalAttack':
        return element === 'enemy-field';
      case 'deployWithSynergy':
        return element === 'hand';
      case 'synergyExplanation':
        return element === 'battlefield-player';
    }

    return false;
  }

  getContextualHint(action, state) {
    const currentStep = this.getCurrentStep();
    
    // Provide hints based on current step
    const hints = {
      intro: "Click a creature card in your hand to select it!",
      firstDeploy: "Click the Deploy button to place your creature on the battlefield!",
      energyExplanation: "You can deploy another creature or end your turn.",
      firstEndTurn: "Click End Turn to proceed.",
      firstAttack: "Select your creature first, then click an enemy to attack!",
      defendExplanation: "Click Defend to take a defensive stance.",
      saveEnergyTurn: "Just click End Turn without taking any actions.",
      deployWithSynergy: "Select and deploy another creature from your hand!",
      synergyExplanation: "Attack with your synergy-boosted creature!",
      useSpell: "Select a spell and choose a target!",
      useTool: "Select a tool to apply it to your creature!",
      finalAttack: "Attack to finish the battle!"
    };
    
    return hints[currentStep] || null;
  }

  isComplete() {
    return this.currentStepIndex >= this.tutorialSteps.length - 1;
  }

  getProgress() {
    return {
      currentStep: this.getCurrentStep(),
      stepIndex: this.currentStepIndex,
      totalSteps: this.tutorialSteps.length,
      percentage: Math.round((this.currentStepIndex / (this.tutorialSteps.length - 1)) * 100)
    };
  }

  getCompletionStats() {
    return {
      deployments: this.actionCount.deploy,
      attacks: this.actionCount.attack,
      defends: this.actionCount.defend,
      toolsUsed: this.actionCount.useTool,
      spellsCast: this.actionCount.useSpell,
      turnsEnded: this.actionCount.endTurn,
      currentStep: this.getCurrentStep(),
      progress: this.getProgress()
    };
  }
}

export const tutorialManager = new TutorialManager();
