// src/utils/battleCore.js - COMPLETE REDESIGNED VERSION WITH UNIFIED EFFECT SYSTEM
import { 
  getToolEffect, 
  getSpellEffect, 
  calculateEffectPower
} from './itemEffects';
import { 
  calculateDamage, 
  calculateDerivedStats, 
  getRarityMultiplier, 
  applySynergyModifiers,
  calculateComboBonus,
  checkFieldSynergies
} from './battleCalculations';

// ============================================
// EFFECT REGISTRY SYSTEM
// ============================================

// Global effect registry to store effect definitions
const EFFECT_REGISTRY = new Map();
const ACTIVE_EFFECTS = new Map(); // Track all active effects by ID

// Register an effect definition
const registerEffect = (effectId, definition) => {
  EFFECT_REGISTRY.set(effectId, definition);
};

// Get effect definition
const getEffectDefinition = (effectId) => {
  return EFFECT_REGISTRY.get(effectId);
};

// Initialize effect registry with spell and tool definitions
export const initializeEffectRegistry = () => {
  // This will be called once at app startup
  console.log('Initializing effect registry...');
  
  // Effects will be registered by itemEffects.js
  EFFECT_REGISTRY.clear();
  ACTIVE_EFFECTS.clear();
};

// ============================================
// ACTIVE EFFECT MANAGEMENT
// ============================================

// Create a unique effect instance
const createEffectInstance = (effectType, source, target, spell, tool, currentTurn) => {
  const instanceId = `${effectType}_${Date.now()}_${Math.random()}`;
  
  let effectDefinition;
  let effectName;
  let duration;
  
  if (effectType === 'spell') {
    const spellEffect = getSpellEffect(spell, source.stats?.magic || 5);
    if (!spellEffect) return null;
    
    effectDefinition = spellEffect;
    effectName = spell.name;
    duration = spellEffect.duration;
  } else if (effectType === 'tool') {
    const toolEffect = getToolEffect(tool);
    if (!toolEffect) return null;
    
    effectDefinition = toolEffect;
    effectName = tool.name;
    duration = toolEffect.duration;
  }
  
  const effectInstance = {
    instanceId,
    type: effectType,
    name: effectName,
    sourceId: source.id,
    targetId: target.id,
    startTurn: currentTurn,
    duration: duration,
    currentTurn: 1,
    definition: effectDefinition,
    spellData: spell,
    toolData: tool,
    isActive: true,
    appliedModifications: new Map(), // Track what we've applied to each creature
    crossCreature: effectDefinition.crossCreature || false
  };
  
  // Store in active effects
  ACTIVE_EFFECTS.set(instanceId, effectInstance);
  
  return effectInstance;
};

// ============================================
// CORE SYSTEM FUNCTIONS
// ============================================

// Safe deep clone that preserves our effect system
const safeDeepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => safeDeepClone(item));
  if (typeof obj === 'function') return obj; // Preserve functions
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = safeDeepClone(obj[key]);
    }
  }
  return clonedObj;
};

// BALANCED: Get maximum energy with reasonable scaling
const getMaxEnergy = (creatures, difficulty = 'medium') => {
  let baseEnergy = 15;
  
  switch (difficulty) {
    case 'easy': baseEnergy = 10; break;
    case 'medium': baseEnergy = 12; break;
    case 'hard': baseEnergy = 15; break;
    case 'expert': baseEnergy = 18; break;
  }
  
  const creatureBonus = Math.floor(creatures.length * 0.25);
  return baseEnergy + creatureBonus;
};

// Helper function to recalculate stats after modifications
const recalculateDerivedStats = (creature) => {
  if (!creature || !creature.stats) {
    console.error("Cannot recalculate stats for invalid creature:", creature);
    return creature.battleStats || {};
  }

  const freshDerivedStats = calculateDerivedStats(creature, [], false, true);
  const modifiedStats = { ...freshDerivedStats };
  
  // Apply active effect modifications
  if (creature.activeEffectInstances) {
    creature.activeEffectInstances.forEach(instanceId => {
      const effectInstance = ACTIVE_EFFECTS.get(instanceId);
      if (!effectInstance || !effectInstance.isActive) return;
      
      const modifications = effectInstance.appliedModifications.get(creature.id);
      if (modifications && modifications.statChanges) {
        Object.entries(modifications.statChanges).forEach(([stat, value]) => {
          if (modifiedStats[stat] !== undefined && typeof modifiedStats[stat] === 'number' && typeof value === 'number') {
            // FIXED: Ensure both values are numbers before adding
            modifiedStats[stat] = modifiedStats[stat] + value;
            
            // FIXED: Check for NaN after addition
            if (isNaN(modifiedStats[stat])) {
              console.error(`NaN detected when applying ${stat} modification! Base: ${freshDerivedStats[stat]}, Modification: ${value}`);
              modifiedStats[stat] = freshDerivedStats[stat] || 0;
            }
            
            if (stat.includes('Attack') || stat.includes('Defense')) {
              modifiedStats[stat] = Math.max(1, modifiedStats[stat]);
            } else if (stat === 'maxHealth') {
              modifiedStats[stat] = Math.max(10, modifiedStats[stat]);
            } else if (stat === 'initiative' || stat.includes('Chance')) {
              modifiedStats[stat] = Math.max(0, modifiedStats[stat]);
            }
          }
        });
      }
    });
  }
  
  if (creature.permanentModifications) {
    Object.entries(creature.permanentModifications).forEach(([stat, value]) => {
      if (modifiedStats[stat] !== undefined) {
        modifiedStats[stat] += value;
      }
    });
  }
  
  if (creature.combination_level && creature.combination_level > 0) {
    const combinationMultiplier = 1 + (creature.combination_level * 0.08);
    Object.keys(modifiedStats).forEach(stat => {
      if (typeof modifiedStats[stat] === 'number' && !stat.includes('Chance') && stat !== 'energyCost') {
        modifiedStats[stat] = Math.round(modifiedStats[stat] * combinationMultiplier);
      }
    });
  }
  
  if (creature.currentHealth && creature.currentHealth > modifiedStats.maxHealth) {
    creature.currentHealth = modifiedStats.maxHealth;
  }
  
  console.log(`recalculateDerivedStats complete for ${creature.species_name}:`, modifiedStats);
  
  return modifiedStats;
};

// Get description for effect types
const getEffectDescription = (effectType, powerLevel = 'normal') => {
  const descriptions = {
    'Surge': {
      'weak': 'Minor surge of power',
      'normal': 'Surge of enhanced abilities',
      'strong': 'Powerful surge of overwhelming might',
      'maximum': 'Ultimate surge of devastating power'
    },
    'Shield': {
      'weak': 'Basic protective barrier',
      'normal': 'Solid defensive enhancement',
      'strong': 'Powerful defensive fortress',
      'maximum': 'Impenetrable defensive barrier'
    },
    'Echo': {
      'weak': 'Faint repeating effect',
      'normal': 'Resonating enhancement',
      'strong': 'Powerful echoing phenomenon',
      'maximum': 'Overwhelming echo cascade'
    },
    'Drain': {
      'weak': 'Minor energy drain',
      'normal': 'Life force absorption',
      'strong': 'Powerful vampiric drain',
      'maximum': 'Devastating soul drain'
    },
    'Charge': {
      'weak': 'Slow power buildup',
      'normal': 'Steady power accumulation',
      'strong': 'Rapid power concentration',
      'maximum': 'Explosive power convergence'
    }
  };
  
  return descriptions[effectType]?.[powerLevel] || `${effectType.toLowerCase()} effect`;
};

// ============================================
// TURN PROCESSING
// ============================================

export const processTurn = (gameState, difficulty = 'medium') => {
  const newState = {...gameState};
  
  console.log('=== PROCESSING TURN START - APPLYING ONGOING EFFECTS ===');
  
  const allCreatures = [...newState.playerField, ...newState.enemyField];
  const processedCreatures = applyOngoingEffects(allCreatures, difficulty, newState.turn);
  
  newState.playerField = processedCreatures.filter(c => 
    newState.playerField.some(pc => pc.id === c.id)
  );
  newState.enemyField = processedCreatures.filter(c => 
    newState.enemyField.some(ec => ec.id === c.id)
  );
  
  newState.playerField = newState.playerField.map(c => processStatusEffects(c, newState.turn));
  newState.enemyField = newState.enemyField.map(c => processStatusEffects(c, newState.turn));
  
  const maxPlayerEnergy = getMaxEnergy(newState.playerField, difficulty);
  const maxEnemyEnergy = getMaxEnergy(newState.enemyField, difficulty);
  
  newState.playerEnergy = Math.min(
    newState.playerEnergy + calculateEnergyRegen(newState.playerField, difficulty),
    maxPlayerEnergy
  );
  
  newState.enemyEnergy = Math.min(
    newState.enemyEnergy + calculateEnergyRegen(newState.enemyField, difficulty),
    maxEnemyEnergy
  );
  
  newState.playerField = processDefeatedCreatures(newState.playerField, newState.enemyField);
  newState.enemyField = processDefeatedCreatures(newState.enemyField, newState.playerField);
  
  const maxHandSize = getMaxHandSize(difficulty);
  
  if (newState.playerHand.length < maxHandSize && newState.playerDeck.length > 0) {
    const drawnCard = newState.playerDeck[0];
    newState.playerHand.push(drawnCard);
    newState.playerDeck = newState.playerDeck.slice(1);
  }
  
  if (newState.enemyHand.length < maxHandSize && newState.enemyDeck.length > 0) {
    const drawnCard = newState.enemyDeck[0];
    newState.enemyHand.push(drawnCard);
    newState.enemyDeck = newState.enemyDeck.slice(1);
  }
  
  return newState;
};

// BALANCED: Calculate energy regeneration
export const calculateEnergyRegen = (creatures, difficulty = 'medium') => {
  let baseRegen = 3;
  
  switch (difficulty) {
    case 'easy': baseRegen = 2; break;
    case 'medium': baseRegen = 3; break;
    case 'hard': baseRegen = 4; break;
    case 'expert': baseRegen = 5; break;
  }
  
  const energyContribution = creatures.reduce((total, creature) => {
    if (!creature.stats || !creature.stats.energy) return total;
    
    let contribution = creature.stats.energy * 0.1;
    
    switch (creature.rarity) {
      case 'Legendary': contribution *= 1.3; break;
      case 'Epic': contribution *= 1.2; break;
      case 'Rare': contribution *= 1.1; break;
    }
    
    contribution *= (1 + (creature.form || 0) * 0.05);
    
    return total + contribution;
  }, 0);
  
  const specialtyBonus = creatures.reduce((total, creature) => {
    if (creature.specialty_stats && creature.specialty_stats.includes('energy')) {
      return total + 0.5;
    }
    return total;
  }, 0);
  
  return Math.round(baseRegen + energyContribution + specialtyBonus);
};

// Get max hand size based on difficulty
export const getMaxHandSize = (difficulty) => {
  switch (difficulty) {
    case 'easy': return 5;
    case 'medium': return 4;
    case 'hard': return 3;
    case 'expert': return 3;
    default: return 4;
  }
};

// ============================================
// UNIFIED EFFECT APPLICATION SYSTEM
// ============================================

export const applyOngoingEffects = (creatures, difficulty = 'medium', currentTurn = 0) => {
  if (!creatures || !Array.isArray(creatures)) return [];

  console.log(`\n=== APPLYING ONGOING EFFECTS - Turn ${currentTurn} ===`);

  // Create creature map for lookups
  const creatureMap = new Map();
  creatures.forEach(c => creatureMap.set(c.id, c));

  // Clone all creatures
  const updatedCreatures = creatures.map(c => safeDeepClone(c));
  const updatedCreatureMap = new Map();
  updatedCreatures.forEach(c => updatedCreatureMap.set(c.id, c));

  // Track changes
  const healthChanges = new Map();
  const statChanges = new Map();
  const effectsToRemove = [];
  const animationEvents = [];
  const stunApplications = new Map();
  const areaEffectDamage = new Map();

  // Process all active effects
  ACTIVE_EFFECTS.forEach((effectInstance, instanceId) => {
    if (!effectInstance.isActive) return;

    const source = updatedCreatureMap.get(effectInstance.sourceId);
    const target = updatedCreatureMap.get(effectInstance.targetId);

    if (!target) {
      console.log(`Effect ${effectInstance.name} target not found, removing`);
      effectInstance.isActive = false;
      effectsToRemove.push(instanceId);
      return;
    }

    // Skip defense effects in ongoing processing
    if (effectInstance.type === 'defense') return;

    console.log(`Processing ${effectInstance.name} (Turn ${effectInstance.currentTurn}/${effectInstance.duration})`);

    // Apply the effect
    let result = {};
    if (effectInstance.definition && effectInstance.definition.applyFunction) {
      result = effectInstance.definition.applyFunction(
        source || target,
        target,
        effectInstance.currentTurn
      );
    }

    // Process damage
    if (result.damage && result.damage > 0) {
      const currentDamage = healthChanges.get(target.id) || 0;
      const actualDamage = result.armorPiercing ? result.damage :
        Math.round(result.damage * (1 - Math.min(target.battleStats.magicalDefense / 200, 0.5)));
      healthChanges.set(target.id, currentDamage - actualDamage);
      
      animationEvents.push({
        type: 'damage',
        targetId: target.id,
        amount: actualDamage,
        effectName: effectInstance.name,
        delay: 300
      });
    }

    // Process healing
    if (result.healthOverTime && result.healthOverTime > 0) {
      const currentChange = healthChanges.get(target.id) || 0;
      healthChanges.set(target.id, currentChange + result.healthOverTime);
      
      animationEvents.push({
        type: 'healing',
        targetId: target.id,
        amount: result.healthOverTime,
        effectName: effectInstance.name,
        delay: 300
      });
    }

    // Process self healing (for drain effects)
    if (result.selfHeal && result.selfHeal > 0 && source && effectInstance.crossCreature) {
      const currentChange = healthChanges.get(source.id) || 0;
      healthChanges.set(source.id, currentChange + result.selfHeal);
      
      animationEvents.push({
        type: 'healing',
        targetId: source.id,
        amount: result.selfHeal,
        effectName: effectInstance.name,
        delay: 500
      });
    }

    // Process stat changes
    if (result.statChanges && Object.keys(result.statChanges).length > 0) {
      const currentStats = statChanges.get(target.id) || {};
      Object.entries(result.statChanges).forEach(([stat, value]) => {
        currentStats[stat] = (currentStats[stat] || 0) + value;
      });
      statChanges.set(target.id, currentStats);
      
      // Track what we applied this turn
      if (!effectInstance.appliedModifications.has(target.id)) {
        effectInstance.appliedModifications.set(target.id, { statChanges: {} });
      }
      effectInstance.appliedModifications.get(target.id).statChanges = result.statChanges;
    }

    // Process self stat changes (for cross-creature effects)
    if (result.selfStatChanges && source && effectInstance.crossCreature) {
      const currentStats = statChanges.get(source.id) || {};
      Object.entries(result.selfStatChanges).forEach(([stat, value]) => {
        currentStats[stat] = (currentStats[stat] || 0) + value;
      });
      statChanges.set(source.id, currentStats);
      
      if (!effectInstance.appliedModifications.has(source.id)) {
        effectInstance.appliedModifications.set(source.id, { statChanges: {} });
      }
      effectInstance.appliedModifications.get(source.id).statChanges = result.selfStatChanges;
    }

    // Handle area effect damage
    if (result.areaEffect && effectInstance.currentTurn === 2 && effectInstance.name === 'Shardstorm') {
      areaEffectDamage.set(effectInstance.instanceId, {
        damage: result.damage,
        caster: source,
        primaryTarget: target.id,
        stunChance: result.applyStun
      });
    }

    // Handle stun
    if (result.applyStun) {
      stunApplications.set(target.id, 1); // 1 turn stun
    }

    // Handle charging prevention
    if (result.charging && effectInstance.currentTurn === 1) {
      const chargingCaster = updatedCreatureMap.get(effectInstance.sourceId);
      if (chargingCaster) {
        chargingCaster.isCharging = true;
        chargingCaster.chargingSpell = effectInstance.name;
      }
    }

    // Handle barrier
    if (result.barrier && result.barrier > 0) {
      target.barrier = (target.barrier || 0) + result.barrier;
    }

    // Handle damage reduction
    if (result.damageReduction) {
      target.damageReduction = result.damageReduction;
    }

    // Log messages
    if (result.logMessage) {
      console.log(result.logMessage);
    }

    // Increment turn and check expiration
    effectInstance.currentTurn++;
    if (effectInstance.currentTurn > effectInstance.duration) {
      console.log(`${effectInstance.name} expired`);
      effectInstance.isActive = false;
      effectsToRemove.push(instanceId);
    }
  });

  // Second pass: Apply area effect damage
  areaEffectDamage.forEach((areaData, effectId) => {
    updatedCreatures.forEach(creature => {
      // Skip the primary target (already hit) and the caster
      if (creature.id === areaData.primaryTarget || creature.id === areaData.caster.id) return;
      
      // Check if this is an enemy of the caster
      const casterIsPlayer = updatedCreatures.find(c => c.id === areaData.caster.id && c.owner === 'player');
      const targetIsEnemy = creature.owner === 'enemy';
      
      if ((casterIsPlayer && targetIsEnemy) || (!casterIsPlayer && !targetIsEnemy)) {
        const actualDamage = areaData.damage ? 
          Math.round(areaData.damage * (1 - Math.min(creature.battleStats.magicalDefense / 200, 0.5))) : 0;
        
        const current = healthChanges.get(creature.id) || 0;
        healthChanges.set(creature.id, current - actualDamage);
        
        // Check for stun on area targets
        if (areaData.stunChance && Math.random() < 0.20) {
          stunApplications.set(creature.id, 1);
        }
        
        animationEvents.push({
          type: 'damage',
          targetId: creature.id,
          amount: actualDamage,
          effectName: 'Shardstorm',
          delay: 800
        });
      }
    });
  });

  // Apply all changes to creatures
  updatedCreatures.forEach(creature => {
    // Apply health changes
    const healthChange = healthChanges.get(creature.id) || 0;
    if (healthChange !== 0) {
      const oldHealth = creature.currentHealth;
      creature.currentHealth = Math.max(0, 
        Math.min(creature.battleStats.maxHealth, creature.currentHealth + healthChange)
      );
      console.log(`${creature.species_name}: ${oldHealth} → ${creature.currentHealth} HP (${healthChange > 0 ? '+' : ''}${healthChange})`);
    }

    // Apply stat changes
    const statMods = statChanges.get(creature.id);
    if (statMods) {
      Object.entries(statMods).forEach(([stat, value]) => {
        if (creature.battleStats[stat] !== undefined) {
          creature.battleStats[stat] += value;
        }
      });
      
      // Handle max health changes specially
      if (statMods.maxHealth) {
        const oldMaxHealth = creature.battleStats.maxHealth - (statMods.maxHealth || 0);
        const healthPercentage = creature.currentHealth / oldMaxHealth;
        creature.currentHealth = Math.round(creature.battleStats.maxHealth * healthPercentage);
      }
    }

    // Apply stun
    const stunDuration = stunApplications.get(creature.id);
    if (stunDuration) {
      creature.statusEffects = creature.statusEffects || {};
      creature.statusEffects.stunned = stunDuration;
      console.log(`${creature.species_name} is STUNNED!`);
    }

    // Clear charging status if Shardstorm just fired
    if (creature.isCharging && creature.chargingSpell === 'Shardstorm') {
      const shardstormEffect = ACTIVE_EFFECTS.get(
        Array.from(ACTIVE_EFFECTS.keys()).find(id => 
          ACTIVE_EFFECTS.get(id).name === 'Shardstorm' && 
          ACTIVE_EFFECTS.get(id).sourceId === creature.id
        )
      );
      if (!shardstormEffect || shardstormEffect.currentTurn > 2) {
        creature.isCharging = false;
        creature.chargingSpell = null;
      }
    }

    // Clear defending status
    if (creature.isDefending) {
      let hasDefenseEffect = false;
      creature.activeEffectInstances?.forEach(instanceId => {
        const effect = ACTIVE_EFFECTS.get(instanceId);
        if (effect && effect.type === 'defense' && effect.isActive) {
          hasDefenseEffect = true;
        }
      });
      
      if (!hasDefenseEffect) {
        creature.isDefending = false;
      }
    }

    // Update active effect references
    creature.activeEffectInstances = creature.activeEffectInstances || [];
    creature.activeEffectInstances = creature.activeEffectInstances.filter(id => {
      const effect = ACTIVE_EFFECTS.get(id);
      return effect && effect.isActive;
    });
  });

  // Clean up expired effects - FIXED: Check if appliedModifications exists
  effectsToRemove.forEach(instanceId => {
    const effect = ACTIVE_EFFECTS.get(instanceId);
    if (effect) {
      // Remove stat modifications when effect expires
      if (effect.appliedModifications) {
        effect.appliedModifications.forEach((mods, creatureId) => {
          const creature = updatedCreatureMap.get(creatureId);
          if (creature && mods.statChanges) {
            creature.battleStats = recalculateDerivedStats(creature);
          }
        });
      }
    }
    ACTIVE_EFFECTS.delete(instanceId);
  });

  // Store animation events for processing
  updatedCreatures._animationEvents = animationEvents;

  console.log(`=== END ONGOING EFFECTS ===\n`);
  return updatedCreatures;
};

// Process defeated creatures and apply death effects
const processDefeatedCreatures = (creatures, opposingCreatures = []) => {
  const survivingCreatures = [];
  
  creatures.forEach(creature => {
    if (creature.currentHealth > 0) {
      survivingCreatures.push(creature);
    } else {
      // Apply balanced death effects based on creature properties
      if (creature.rarity === 'Legendary') {
        console.log(`${creature.species_name} (Legendary) was defeated! Their sacrifice empowers allies!`);
        // Death rattle effect - empower remaining creatures (reduced)
        survivingCreatures.forEach(ally => {
          ally.battleStats.physicalAttack += 2; // Reduced from 3
          ally.battleStats.magicalAttack += 2;  // Reduced from 3
          
          // Add a temporary effect to track this bonus
          if (!ally.activeEffects) ally.activeEffects = [];
          ally.activeEffects.push({
            id: Date.now() + Math.random(),
            name: `${creature.species_name}'s Final Gift`,
            icon: '👑',
            type: 'legendary_blessing',
            description: 'Empowered by a fallen legendary creature',
            duration: 5, // Reduced from 999 - now temporary
            statModifications: {
              physicalAttack: 2,
              magicalAttack: 2
            },
            startTurn: ally.currentTurn || 0
          });
        });
      } else if (creature.specialty_stats && creature.specialty_stats.includes('energy')) {
        console.log(`Energy specialist ${creature.species_name} was defeated! Releasing stored energy!`);
        // Energy burst - restore energy to allies
        survivingCreatures.forEach(ally => {
          if (!ally.activeEffects) ally.activeEffects = [];
          ally.activeEffects.push({
            id: Date.now() + Math.random(),
            name: 'Energy Release',
            icon: '⚡',
            type: 'energy_burst',
            description: 'Energized by released power',
            duration: 2, // Reduced from 3
            statModifications: {
              energyCost: -1
            },
            startTurn: ally.currentTurn || 0
          });
        });
      } else if (creature.rarity === 'Epic') {
        console.log(`Epic creature ${creature.species_name} was defeated! Their essence lingers!`);
        // Epic death effect - minor stat boost to allies
        survivingCreatures.forEach(ally => {
          if (!ally.activeEffects) ally.activeEffects = [];
          ally.activeEffects.push({
            id: Date.now() + Math.random(),
            name: 'Epic Essence',
            icon: '💜',
            type: 'epic_blessing',
            description: 'Blessed by epic essence',
            duration: 3, // Reduced from 5
            statModifications: {
              physicalAttack: 1,
              magicalAttack: 1
            },
            startTurn: ally.currentTurn || 0
          });
        });
      }
      
      // NEW: Revenge mechanic - opposing creatures get minor penalty when defeating strong creatures
      if (creature.rarity === 'Legendary' || creature.rarity === 'Epic') {
        opposingCreatures.forEach(enemy => {
          if (!enemy.activeEffects) enemy.activeEffects = [];
          enemy.activeEffects.push({
            id: Date.now() + Math.random(),
            name: 'Guilty Conscience',
            icon: '😰',
            type: 'debuff',
            description: 'Shaken by defeating a powerful foe',
            duration: 2,
            statModifications: {
              initiative: -2,
              dodgeChance: -1
            },
            startTurn: enemy.currentTurn || 0
          });
        });
      }
    }
  });
  
  return survivingCreatures;
};

// ============================================
// ACTION HANDLERS
// ============================================

// ENHANCED: Process attack action with combo bonus and proper health tracking
export const processAttack = (attacker, defender, attackType = 'auto', comboLevel = 0) => {
  // Validate input
  if (!attacker || !defender || !attacker.battleStats || !defender.battleStats) {
    console.error('processAttack: Invalid input', { attacker, defender });
    return {
      updatedAttacker: attacker,
      updatedDefender: defender,
      battleLog: "Invalid attack - missing stats",
      damage: 0,
      finalDamage: 0,
      totalDamage: 0,
      damageDealt: 0,
      actualDamage: 0,
      damageResult: { damage: 0, isDodged: false, isCritical: false, effectiveness: 'normal' }
    };
  }
  
  // CRITICAL FIX: Create proper copies without losing health values
  const attackerClone = safeDeepClone(attacker);
  const defenderClone = safeDeepClone(defender);
  
  // CRITICAL LOGGING: Log health values at start
  console.log(`processAttack: ${attackerClone.species_name} (${attackerClone.currentHealth} HP) attacking ${defenderClone.species_name} (${defenderClone.currentHealth} HP)`);
  console.log(`  Defender battleStats:`, defenderClone.battleStats);
  
  // Determine attack type if set to auto
  if (attackType === 'auto') {
    attackType = attackerClone.battleStats.physicalAttack >= attackerClone.battleStats.magicalAttack 
      ? 'physical' 
      : 'magical';
  }
  
  // Apply charge bonuses if available
  if (attackerClone.nextAttackBonus) {
    if (attackType === 'physical') {
      attackerClone.battleStats.physicalAttack += attackerClone.nextAttackBonus;
    } else {
      attackerClone.battleStats.magicalAttack += attackerClone.nextAttackBonus;
    }
    // Consume the bonus
    delete attackerClone.nextAttackBonus;
    console.log(`${attackerClone.species_name} unleashes charged attack!`);
  }
  
  // Calculate combo multiplier
  const comboMultiplier = calculateComboBonus(comboLevel);
  
  // Pass combo multiplier to damage calculation
  const damageResult = calculateDamage(attackerClone, defenderClone, attackType, comboMultiplier);
  
  // Apply damage with additional effects
  let actualDamage = 0;
  if (!damageResult.isDodged) {
    // Store defender's health before damage
    const previousHealth = defenderClone.currentHealth;
    
    // Base damage
    defenderClone.currentHealth = Math.max(0, defenderClone.currentHealth - damageResult.damage);
    
    // Calculate actual damage dealt
    actualDamage = previousHealth - defenderClone.currentHealth;
    
    console.log(`processAttack result: ${actualDamage} damage dealt. ${defenderClone.species_name} health: ${previousHealth} → ${defenderClone.currentHealth}`);
    
    // Critical hit effects (reduced impact)
    if (damageResult.isCritical) {
      // Critical hits may apply additional effects
      if (Math.random() < 0.2) { // Reduced from 0.3
        const bonusEffect = {
          id: Date.now(),
          name: 'Critical Strike Trauma',
          icon: '💥',
          type: 'debuff',
          description: 'Suffering from critical strike',
          duration: 1, // Reduced from 2
          statModifications: {
            physicalDefense: -2, // Reduced from -3
            magicalDefense: -2   // Reduced from -3
          },
          startTurn: defenderClone.currentTurn || 0
        };
        
        defenderClone.activeEffects = [...(defenderClone.activeEffects || []), bonusEffect];
      }
    }
    
    // Effectiveness bonuses (reduced)
    if (damageResult.effectiveness === 'very effective' || damageResult.effectiveness === 'effective') {
      // Effective attacks may cause additional effects
      if (Math.random() < 0.25) { // Reduced from 0.4
        const statusEffect = {
          id: Date.now() + 1,
          name: 'Elemental Weakness',
          icon: '⚡',
          type: 'debuff',
          description: 'Vulnerable to attacks',
          duration: 2, // Reduced from 3
          statModifications: {
            physicalDefense: -1, // Reduced from -2
            magicalDefense: -1   // Reduced from -2
          },
          startTurn: defenderClone.currentTurn || 0
        };
        
        defenderClone.activeEffects = [...(defenderClone.activeEffects || []), statusEffect];
      }
    }
    
    // Update damage result with actual damage
    damageResult.damage = actualDamage;
    damageResult.actualDamage = actualDamage;
  }
  
  // Create detailed battle log entry
  let logMessage = '';
  
  if (damageResult.isDodged) {
    logMessage = `${attackerClone.species_name}'s ${attackType} attack was dodged by ${defenderClone.species_name}!`;
  } else {
    logMessage = `${attackerClone.species_name} used ${attackType} attack on ${defenderClone.species_name}`;
    
    if (damageResult.isCritical) {
      logMessage += ' (Critical Hit!)';
    }
    
    if (comboLevel > 1) {
      logMessage += ` [Combo x${comboLevel}!]`;
    }
    
    if (damageResult.effectiveness !== 'normal') {
      logMessage += ` - ${damageResult.effectiveness}!`;
    }
    
    if (damageResult.damageType && damageResult.damageType !== 'normal') {
      logMessage += ` [${damageResult.damageType}]`;
    }
    
    logMessage += ` dealing ${actualDamage} damage.`;
    
    // Death message
    if (defenderClone.currentHealth <= 0) {
      if (defenderClone.rarity === 'Legendary') {
        logMessage += ` ${defenderClone.species_name} falls in battle!`;
      } else if (defenderClone.rarity === 'Epic') {
        logMessage += ` ${defenderClone.species_name} has been defeated!`;
      } else {
        logMessage += ` ${defenderClone.species_name} was defeated!`;
      }
    } else if (defenderClone.currentHealth < defenderClone.battleStats.maxHealth * 0.2) {
      logMessage += ` ${defenderClone.species_name} is critically wounded!`;
    } else if (defenderClone.currentHealth < defenderClone.battleStats.maxHealth * 0.5) {
      logMessage += ` ${defenderClone.species_name} is wounded!`;
    }
  }
  
  // CRITICAL: Log final health values
  console.log(`processAttack complete: ${defenderClone.species_name} final health = ${defenderClone.currentHealth}`);
  
  // Return the complete attack result with all damage properties
  return {
    updatedAttacker: attackerClone,
    updatedDefender: defenderClone,
    battleLog: logMessage,
    damage: actualDamage,                    // Primary damage property
    finalDamage: actualDamage,                // Alternate damage property
    totalDamage: actualDamage,                // Another alternate
    damageDealt: actualDamage,                // Yet another alternate
    actualDamage: actualDamage,               // And another
    isCritical: damageResult.isCritical || false,
    attackType: attackType,
    isBlocked: damageResult.isDodged || false,
    damageResult: {
      ...damageResult,
      comboMultiplier: comboMultiplier,
      damage: actualDamage
    }
  };
};

// ENHANCED: Apply tool effect with per-turn effects
export const applyTool = (creature, tool, difficulty = 'medium', currentTurn = 0) => {
  // Validate input
  if (!creature || !tool) {
    console.error("Tool application failed - missing creature or tool");
    return { updatedCreature: creature, toolEffect: null };
  }
  
  if (!creature.battleStats) {
    console.error("Tool application failed - creature missing battleStats");
    return { updatedCreature: creature, toolEffect: null };
  }
  
  const creatureClone = safeDeepClone(creature);
  const toolEffect = getToolEffect(tool);
  
  if (!toolEffect) {
    console.error("Tool application failed - invalid tool effect");
    return { updatedCreature: creature, toolEffect: null };
  }
  
  // Create effect instance
  const effectInstance = createEffectInstance('tool', creatureClone, creatureClone, null, tool, currentTurn);
  if (!effectInstance) {
    console.error("Failed to create tool effect instance");
    return { updatedCreature: creature, toolEffect: null };
  }
  
  // Add to creature's active effects
  creatureClone.activeEffectInstances = creatureClone.activeEffectInstances || [];
  creatureClone.activeEffectInstances.push(effectInstance.instanceId);
  
  // Apply immediate effects (turn 1)
  if (toolEffect.applyFunction) {
    const immediateResult = toolEffect.applyFunction(creatureClone, 1);
    
    // Apply immediate stat changes
    if (immediateResult.statChanges) {
      // FIXED: Track modifications in the effect instance BEFORE applying them
      if (!effectInstance.appliedModifications.has(creatureClone.id)) {
        effectInstance.appliedModifications.set(creatureClone.id, { statChanges: {} });
      }
      effectInstance.appliedModifications.get(creatureClone.id).statChanges = immediateResult.statChanges;
      
      Object.entries(immediateResult.statChanges).forEach(([stat, value]) => {
        if (creatureClone.battleStats[stat] !== undefined) {
          creatureClone.battleStats[stat] += value;
          console.log(`Tool ${tool.name} applied ${stat} ${value > 0 ? '+' : ''}${value}`);
        }
      });
    }
    
    // Apply immediate healing
    if (immediateResult.healthOverTime && immediateResult.healthOverTime > 0) {
      const oldHealth = creatureClone.currentHealth;
      creatureClone.currentHealth = Math.min(
        creatureClone.currentHealth + immediateResult.healthOverTime,
        creatureClone.battleStats.maxHealth
      );
      console.log(`${tool.name} healed ${creatureClone.species_name} for ${creatureClone.currentHealth - oldHealth} HP`);
    }
    
    // Apply barrier
    if (immediateResult.barrier && immediateResult.barrier > 0) {
      creatureClone.barrier = (creatureClone.barrier || 0) + immediateResult.barrier;
      console.log(`${tool.name} granted ${immediateResult.barrier} barrier to ${creatureClone.species_name}`);
    }
    
    // Apply energy gain (note for UI)
    if (immediateResult.energyGain && immediateResult.energyGain > 0) {
      console.log(`${tool.name} grants ${immediateResult.energyGain} energy (handle in calling function)`);
    }
  }
  
  // Recalculate stats
  creatureClone.battleStats = recalculateDerivedStats(creatureClone);
  
  return {
    updatedCreature: creatureClone,
    toolEffect: toolEffect
  };
};

// NEW ENHANCED UNIFIED applySpell function with proper state tracking
export const applySpell = (caster, target, spell, difficulty = 'medium', currentTurn = 0) => {
  console.log(`\n=== APPLYING SPELL: ${spell.name} ===`);
  
  if (!caster || !target || !spell) {
    console.error("Spell application failed - missing parameters");
    return null;
  }
  
  const casterClone = safeDeepClone(caster);
  const targetClone = safeDeepClone(target);
  
  const spellEffect = getSpellEffect(spell, caster.stats?.magic || 5);
  if (!spellEffect || !spellEffect.applyFunction) {
    console.error("Invalid spell effect");
    return null;
  }
  
  // For instant spells (duration 1), apply immediately
  if (spellEffect.duration === 1) {
    const result = spellEffect.applyFunction(casterClone, targetClone, 1);
    
    let totalDamage = 0;
    let totalHealing = 0;
    
    // Apply damage
    if (result.damage > 0) {
      const healthBefore = targetClone.currentHealth;
      const finalDamage = result.armorPiercing ? result.damage : 
        Math.round(result.damage * (1 - Math.min(targetClone.battleStats.magicalDefense / 200, 0.5)));
      targetClone.currentHealth = Math.max(0, targetClone.currentHealth - finalDamage);
      totalDamage = healthBefore - targetClone.currentHealth;
    }
    
    // Apply healing
    if (result.healthOverTime > 0) {
      const healthBefore = targetClone.currentHealth;
      targetClone.currentHealth = Math.min(
        targetClone.currentHealth + result.healthOverTime,
        targetClone.battleStats.maxHealth
      );
      totalHealing = targetClone.currentHealth - healthBefore;
    }
    
    // Apply stat changes
    if (result.statChanges) {
      Object.entries(result.statChanges).forEach(([stat, value]) => {
        if (targetClone.battleStats[stat] !== undefined) {
          targetClone.battleStats[stat] += value;
        }
      });
    }
    
    return {
      updatedCaster: casterClone,
      updatedTarget: targetClone,
      spellEffect: {
        damage: totalDamage,
        healing: totalHealing,
        actualDamage: totalDamage,
        actualHealing: totalHealing,
        wasCritical: result.isCritical || false,
        duration: spellEffect.duration,
        applyStun: result.applyStun || false,
        areaEffect: result.areaEffect || false,
        charging: result.charging || false
      }
    };
  } else {
    // Multi-turn spell - create effect instance
    const effectInstance = createEffectInstance('spell', casterClone, targetClone, spell, null, currentTurn);
    if (!effectInstance) {
      console.error("Failed to create spell effect instance");
      return null;
    }
    
    // Add to both creatures if cross-creature
    targetClone.activeEffectInstances = targetClone.activeEffectInstances || [];
    targetClone.activeEffectInstances.push(effectInstance.instanceId);
    
    if (spellEffect.crossCreature) {
      casterClone.activeEffectInstances = casterClone.activeEffectInstances || [];
      casterClone.activeEffectInstances.push(effectInstance.instanceId);
    }
    
    // For charging spells, mark caster as charging
    if (spellEffect.chargeEffect) {
      casterClone.isCharging = true;
      casterClone.chargingSpell = spell.name;
    }
    
    // Process immediate effects by running applyOngoingEffects
    const tempCreatures = [casterClone, targetClone];
    const processedCreatures = applyOngoingEffects(tempCreatures, difficulty, currentTurn);
    
    const processedCaster = processedCreatures.find(c => c.id === casterClone.id) || casterClone;
    const processedTarget = processedCreatures.find(c => c.id === targetClone.id) || targetClone;
    
    // Get animation events
    const animationEvents = processedCreatures._animationEvents || [];
    
    return {
      updatedCaster: processedCaster,
      updatedTarget: processedTarget,
      spellEffect: {
        damage: 0,
        healing: 0,
        duration: spellEffect.duration,
        charging: spellEffect.chargeEffect || false,
        animationEvents: animationEvents
      }
    };
  }
};

// FIXED: Put creature in defensive stance that lasts through opponent's turn
export const defendCreature = (creature, difficulty = 'medium') => {
  if (!creature || !creature.battleStats) {
    console.error("Cannot defend with invalid creature");
    return creature;
  }
  
  console.log(`${creature.species_name} is defending!`);
  
  const creatureClone = safeDeepClone(creature);
  creatureClone.isDefending = true;
  
  const basePhysicalDefense = creatureClone.battleStats.physicalDefense || 50;
  const baseMagicalDefense = creatureClone.battleStats.magicalDefense || 50;
  
  const physicalDefenseBoost = Math.round(basePhysicalDefense * 0.5);
  const magicalDefenseBoost = Math.round(baseMagicalDefense * 0.5);
  
  const rarityBonus = getRarityMultiplier(creatureClone.rarity) - 1;
  
  // Create defense effect instance - FIXED: Initialize appliedModifications
  const defenseEffect = {
    instanceId: `defense_${Date.now()}`,
    type: 'defense',
    name: 'Defensive Stance',
    duration: 2,
    currentTurn: 1,
    statModifications: {
      physicalDefense: physicalDefenseBoost + Math.round(physicalDefenseBoost * rarityBonus),
      magicalDefense: magicalDefenseBoost + Math.round(magicalDefenseBoost * rarityBonus)
    },
    damageReduction: difficulty === 'hard' || difficulty === 'expert' ? 0.4 : 0.2,
    isActive: true,
    appliedModifications: new Map() // FIXED: Add this line to prevent crashes when effect expires
  };
  
  ACTIVE_EFFECTS.set(defenseEffect.instanceId, defenseEffect);
  
  creatureClone.activeEffectInstances = creatureClone.activeEffectInstances || [];
  creatureClone.activeEffectInstances.push(defenseEffect.instanceId);
  
  // Apply the defense boost immediately
  creatureClone.battleStats.physicalDefense += defenseEffect.statModifications.physicalDefense;
  creatureClone.battleStats.magicalDefense += defenseEffect.statModifications.magicalDefense;
  
  console.log(`Defense applied to ${creature.species_name}:`, {
    physicalBoost: defenseEffect.statModifications.physicalDefense,
    magicalBoost: defenseEffect.statModifications.magicalDefense,
    activeEffects: creatureClone.activeEffectInstances.length
  });
  
  return creatureClone;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Unified helper function to get appropriate icon for effects
const getEffectIcon = (effectType) => {
  const icons = {
    'Surge': '⚡', 'surge': '⚡',
    'Shield': '🛡️', 'shield': '🛡️',
    'Echo': '🔊', 'echo': '🔊',
    'Drain': '🩸', 'drain': '🩸',
    'Charge': '🔋', 'charge': '🔋'
  };
  return icons[effectType] || '✨';
};

// ENHANCED: Process energy momentum and return bonus regen
export const processEnergyMomentum = (momentum) => {
  const bonusRegen = Math.floor(momentum / 10);
  return {
    currentMomentum: momentum,
    bonusRegen: bonusRegen,
    nextThreshold: 10 - (momentum % 10),
    totalBonusEarned: bonusRegen
  };
};

// ENHANCED: Apply field synergies and return modified creatures
export const applyFieldSynergies = (creatures) => {
  if (!creatures || creatures.length === 0) return creatures;
  
  const synergies = checkFieldSynergies(creatures);
  
  if (synergies.length === 0) return creatures;
  
  console.log(`Applying ${synergies.length} synergies to field:`, synergies);
  
  return applySynergyModifiers(creatures, synergies);
};

// FIXED: Create visual effect data for synergies with default colors
export const createSynergyEffectData = (synergies) => {
  const defaultColors = {
    'species': '#4CAF50',
    'legendary_presence': '#FFD700',
    'stat_synergy': '#2196F3',
    'form_protection': '#9C27B0',
    'balanced_team': '#00BCD4',
    'full_field': '#FF5722'
  };
  
  return synergies.map(synergy => {
    let data = {};
    
    if (synergy.type === 'species') {
      data = {
        type: 'species-synergy',
        species: synergy.species,
        count: synergy.count,
        bonus: synergy.bonus,
        message: `${synergy.species} Synergy x${synergy.count}! (+${Math.round(synergy.bonus * 100)}% stats)`,
        color: synergy.color || defaultColors['species'] || '#4CAF50'
      };
    } else if (synergy.type === 'stats' || synergy.type === 'stat_synergy') {
      data = {
        type: 'stat-synergy',
        stats: synergy.stats || [],
        bonus: synergy.bonus,
        message: synergy.name || `Stat Synergy! (+${Math.round(synergy.bonus * 100)}% stats)`,
        color: synergy.color || defaultColors['stat_synergy'] || '#2196F3'
      };
    } else if (synergy.type === 'legendary_presence') {
      data = {
        type: 'legendary-presence',
        bonus: synergy.bonus,
        message: synergy.name || `Legendary Presence! (+${Math.round(synergy.bonus * 100)}% stats)`,
        color: synergy.color || defaultColors['legendary_presence'] || '#FFD700'
      };
    } else if (synergy.type === 'form_protection') {
      data = {
        type: 'form-protection',
        bonus: synergy.bonus,
        message: synergy.name || `Guardian Presence! (+${Math.round(synergy.bonus * 100)}% defense)`,
        color: synergy.color || defaultColors['form_protection'] || '#9C27B0'
      };
    } else if (synergy.type === 'balanced_team') {
      data = {
        type: 'balanced-team',
        bonus: synergy.bonus,
        message: synergy.name || `Balanced Formation! (+${Math.round(synergy.bonus * 100)}% all stats)`,
        color: synergy.color || defaultColors['balanced_team'] || '#00BCD4'
      };
    } else if (synergy.type === 'full_field') {
      data = {
        type: 'full-field',
        bonus: synergy.bonus,
        message: synergy.name || `Full Force! (+${Math.round(synergy.bonus * 100)}% all stats)`,
        color: synergy.color || defaultColors['full_field'] || '#FF5722'
      };
    } else {
      // Default case for unknown synergy types
      data = {
        type: synergy.type || 'unknown',
        bonus: synergy.bonus || 0,
        message: synergy.name || `${synergy.type} Synergy!`,
        color: synergy.color || '#2196F3'
      };
    }
    
    return data;
  });
};

// NEW: Calculate and display energy efficiency for actions
export const calculateEnergyEfficiency = (action, creature, energyCost) => {
  if (!action || !creature || !energyCost) return 0;
  
  let potentialValue = 0;
  
  switch (action) {
    case 'attack':
      const attackPower = Math.max(
        creature.battleStats?.physicalAttack || 0,
        creature.battleStats?.magicalAttack || 0
      );
      potentialValue = attackPower;
      break;
      
    case 'defend':
      const defensePower = Math.max(
        creature.battleStats?.physicalDefense || 0,
        creature.battleStats?.magicalDefense || 0
      );
      potentialValue = defensePower * 2; // Defense is valuable
      break;
      
    case 'deploy':
      potentialValue = calculateCreaturePower(creature) / 10;
      break;
      
    default:
      potentialValue = 10;
  }
  
  return energyCost > 0 ? Math.round((potentialValue / energyCost) * 10) / 10 : 0;
};

// NEW: Process charge effect progression
export const updateChargeEffects = (creature, currentTurn) => {
  if (!creature.activeEffectInstances) return creature;
  
  const updatedCreature = { ...creature };
  
  creature.activeEffectInstances.forEach(instanceId => {
    const effect = ACTIVE_EFFECTS.get(instanceId);
    if (effect && effect.definition && effect.definition.chargeEffect) {
      const turnsActive = currentTurn - (effect.startTurn || 0);
      const maxTurns = effect.definition.duration || 3;
      const chargeProgress = Math.min(turnsActive / maxTurns, 1.0) * 100;
      
      effect.chargeProgress = chargeProgress;
      effect.turnsRemaining = Math.max(0, maxTurns - turnsActive);
      effect.isReady = chargeProgress >= 100;
    }
  });
  
  return updatedCreature;
};

// NEW STATUS EFFECT FUNCTIONS
export const canCreatureAct = (creature) => {
  if (!creature) return { canAct: false, reason: "Invalid creature" };
  
  // Check stun
  if (creature.statusEffects?.stunned > 0) {
    return { canAct: false, reason: `${creature.species_name} is stunned!` };
  }
  
  // Check if charging
  if (creature.isCharging) {
    return { canAct: false, reason: `${creature.species_name} is charging ${creature.chargingSpell}!` };
  }
  
  return { canAct: true, reason: null };
};

export const processStatusEffects = (creature, currentTurn) => {
  if (!creature.statusEffects) return creature;
  
  const updated = { ...creature };
  
  // Reduce stun duration
  if (updated.statusEffects.stunned > 0) {
    updated.statusEffects.stunned--;
    if (updated.statusEffects.stunned === 0) {
      console.log(`${creature.species_name} is no longer stunned`);
    }
  }
  
  return updated;
};

export const applyStun = (creature, duration) => {
  const updated = { ...creature };
  updated.statusEffects = updated.statusEffects || {};
  updated.statusEffects.stunned = duration;
  return updated;
};

export const isCreatureStunned = (creature) => {
  return creature?.statusEffects?.stunned > 0;
};

// Export the missing function for creature power calculation
export const calculateCreaturePower = (creature) => {
  if (!creature || !creature.battleStats) return 0;
  
  const stats = creature.battleStats;
  const attackPower = Math.max(stats.physicalAttack || 0, stats.magicalAttack || 0);
  const defensePower = Math.max(stats.physicalDefense || 0, stats.magicalDefense || 0);
  const utilityPower = (stats.initiative || 0) + (stats.criticalChance || 0) + (stats.dodgeChance || 0);
  
  const formLevel = parseInt(creature.form) || 0;
  
  return Math.round(
    (attackPower * 2) + 
    defensePower + 
    (stats.maxHealth || 0) * 0.1 + 
    utilityPower * 0.5 +
    formLevel * 5 +
    getRarityValue(creature.rarity) * 10
  );
};

// Helper function for rarity values
const getRarityValue = (rarity) => {
  switch (rarity) {
    case 'Legendary': return 4;
    case 'Epic': return 3;
    case 'Rare': return 2;
    default: return 1;
  }
};

// NEW: Get effect events for animation (healing/damage from ongoing effects)
export const getEffectEvents = (creatures) => {
  if (!creatures || !creatures._animationEvents) return [];
  return creatures._animationEvents;
};

// Initialize the effect registry on module load
initializeEffectRegistry();

// Export helper functions for use in other components
export { checkFieldSynergies, recalculateDerivedStats };

/* 
UNIFIED EFFECTS SYSTEM WITH ENHANCED SPELL TRACKING:

ALL effects (tools and spells) now use the same applyFunction pattern:
- First turn applies immediate effects
- Subsequent turns apply per-turn effects  
- Cross-creature effects (drains) are handled properly
- All effects can have healing, damage, stat changes, etc.
- Spell effects properly track their state between turns
- Area effects and charging spells work correctly
- Status effects (stun, charging) prevent actions

The system is simpler and more consistent, with no special cases for spells vs tools.
*/
