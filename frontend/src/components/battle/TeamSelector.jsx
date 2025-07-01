// src/components/battle/TeamSelector.jsx - FIXED INFINITE RENDERING AND TUTORIAL MODE
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { GameContext } from '../../context/GameContext';
import { checkFieldSynergies, calculateTeamRating, calculateCombatRating } from '../../utils/battleCalculations';
import { calculateDifficultyRating } from '../../utils/difficultySettings';
import { getTutorialTeam } from '../../utils/tutorialData';
import './TeamSelector.css';

const TeamSelector = ({ 
  availableCreatures, 
  availableTools, 
  availableSpells, 
  difficulty,
  onConfirmTeam,
  onBack 
}) => {
  // Get GameContext for creature minter
  const { setShowCreatureMinter } = useContext(GameContext);
  
  // State for selected team
  const [selectedCreatures, setSelectedCreatures] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);
  const [selectedSpells, setSelectedSpells] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [showSynergyDetails, setShowSynergyDetails] = useState(false);
  
  // Constants
  const MAX_CREATURES = 12; // Maximum creatures in battle deck
  const MIN_CREATURES = 1;  // Changed from 3 to 1
  const MAX_TOOLS = 5;      // Maximum tools
  const MAX_SPELLS = 5;     // Maximum spells
  
  // Pre-select team for tutorial mode but don't auto-proceed
  useEffect(() => {
    if (difficulty === 'tutorial' && selectedCreatures.length === 0) {
      // Pre-select the tutorial team but let user confirm
      const tutorialTeam = getTutorialTeam();
      setSelectedCreatures(tutorialTeam.creatures);
      setSelectedTools(tutorialTeam.tools);
      setSelectedSpells(tutorialTeam.spells);
    }
  }, [difficulty, selectedCreatures.length]);
  
  // Check if user has any creatures
  const hasAnyCreatures = availableCreatures && availableCreatures.length > 0;
  
  // If user has no creatures, show a special message
  if (!hasAnyCreatures) {
    return (
      <div className="team-selector">
        <div className="team-selector-header">
          <button onClick={onBack} className="back-button">
            ← Back
          </button>
          <h2>Prepare Your Battle Team</h2>
          <div className="difficulty-badge" data-difficulty={difficulty}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Difficulty
          </div>
        </div>
        
        <div className="no-creatures-container">
          <div className="no-creatures-message">
            <h3>No Creatures Found</h3>
            <p>You need at least one creature to enter the Battle Arena!</p>
            <p>Mint your first creature to start your battle journey.</p>
            
            <div className="no-creatures-actions">
              <button 
                className="mint-creature-button"
                onClick={() => {
                  // Open the creature minter
                  if (setShowCreatureMinter) {
                    setShowCreatureMinter(true);
                  }
                  onBack(); // Close the team selector
                }}
              >
                <span>🥚</span> Mint a Creature
              </button>
              
              <button 
                className="back-button-secondary"
                onClick={onBack}
              >
                Back to Game
              </button>
            </div>
            
            <div className="creature-info-tips">
              <h4>Tips for New Players:</h4>
              <ul>
                <li>Use the Incubator machine in the game to mint creatures</li>
                <li>Each creature has unique stats and abilities</li>
                <li>Build a team of up to 12 creatures for battles</li>
                <li>Equip tools and spells to enhance your team's power</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Calculate active synergies for selected creatures
  const activeSynergies = useMemo(() => {
    if (selectedCreatures.length < 2) return [];
    return checkFieldSynergies(selectedCreatures);
  }, [selectedCreatures]);
  
  // Calculate team rating and difficulty match
  const teamAnalysis = useMemo(() => {
    if (selectedCreatures.length === 0) {
      return {
        teamRating: 0,
        difficultyRating: { 
          playerRating: 0, 
          enemyRating: 0, 
          meetsRequirements: false,
          recommendation: "Select creatures to see team analysis"
        }
      };
    }
    
    const teamRating = calculateTeamRating(selectedCreatures);
    const difficultyRating = calculateDifficultyRating(selectedCreatures, difficulty);
    
    return {
      teamRating,
      difficultyRating
    };
  }, [selectedCreatures, difficulty]);
  
  // CRITICAL FIX: Memoize creature ratings to prevent recalculation
  const creatureRatings = useMemo(() => {
    const ratings = new Map();
    availableCreatures.forEach(creature => {
      ratings.set(creature.id, calculateCombatRating(creature));
    });
    return ratings;
  }, [availableCreatures]);
  
  // Sort creatures by various criteria
  const sortedCreatures = useMemo(() => {
    return [...availableCreatures].sort((a, b) => {
      // Sort by form (highest first)
      const formDiff = (b.form || 0) - (a.form || 0);
      if (formDiff !== 0) return formDiff;
      
      // Then by rarity
      const rarityOrder = { 'Legendary': 4, 'Epic': 3, 'Rare': 2, 'Common': 1 };
      const rarityDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
      if (rarityDiff !== 0) return rarityDiff;
      
      // Then by combat rating (use pre-calculated ratings)
      const ratingA = creatureRatings.get(a.id) || 0;
      const ratingB = creatureRatings.get(b.id) || 0;
      return ratingB - ratingA;
    });
  }, [availableCreatures, creatureRatings]);
  
  // Handle creature selection
  const handleCreatureSelect = (creature) => {
    const isSelected = selectedCreatures.some(c => c.id === creature.id);
    
    if (isSelected) {
      setSelectedCreatures(selectedCreatures.filter(c => c.id !== creature.id));
    } else if (selectedCreatures.length < MAX_CREATURES) {
      setSelectedCreatures([...selectedCreatures, creature]);
    }
  };
  
  // Handle creature reordering
  const handleCreatureReorder = (fromIndex, toIndex) => {
    const newOrder = [...selectedCreatures];
    const [movedCreature] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedCreature);
    setSelectedCreatures(newOrder);
  };
  
  // Handle tool selection
  const handleToolSelect = (tool) => {
    const isSelected = selectedTools.some(t => t.id === tool.id);
    
    if (isSelected) {
      setSelectedTools(selectedTools.filter(t => t.id !== tool.id));
    } else if (selectedTools.length < MAX_TOOLS) {
      setSelectedTools([...selectedTools, tool]);
    }
  };
  
  // Handle spell selection
  const handleSpellSelect = (spell) => {
    const isSelected = selectedSpells.some(s => s.id === spell.id);
    
    if (isSelected) {
      setSelectedSpells(selectedSpells.filter(s => s.id !== spell.id));
    } else if (selectedSpells.length < MAX_SPELLS) {
      setSelectedSpells([...selectedSpells, spell]);
    }
  };
  
  // Confirm team and start battle
  const handleConfirmTeam = () => {
    if (selectedCreatures.length >= MIN_CREATURES) {
      onConfirmTeam({
        creatures: selectedCreatures,
        tools: selectedTools,
        spells: selectedSpells
      });
    }
  };
  
  // Get rarity color class
  const getRarityClass = (rarity) => {
    return rarity ? rarity.toLowerCase() : 'common';
  };
  
  // Get stat specialty icon
  const getStatIcon = (stat) => {
    const icons = {
      energy: '⚡',
      strength: '💪',
      magic: '✨',
      stamina: '❤️',
      speed: '💨'
    };
    return icons[stat] || '⭐';
  };
  
  // Get synergy type icon
  const getSynergyIcon = (synergy) => {
    return synergy.icon || '🔗';
  };
  
  // Check if can start battle
  const canStartBattle = selectedCreatures.length >= MIN_CREATURES;
  
  // Add special notice for tutorial mode
  const tutorialNotice = difficulty === 'tutorial' && (
    <div className="tutorial-notice" style={{
      background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.1), rgba(0, 172, 193, 0.1))',
      border: '1px solid #00BCD4',
      borderRadius: '10px',
      padding: '15px',
      margin: '0 20px 20px 20px',
      textAlign: 'center'
    }}>
      <p style={{ color: '#00BCD4', margin: 0 }}>
        🎮 Tutorial Mode: We've pre-selected a balanced team for you, but feel free to customize it!
      </p>
    </div>
  );
  
  return (
    <div className="team-selector">
      <div className="team-selector-header">
        <button onClick={onBack} className="back-button">
          ← Back
        </button>
        <h2>Prepare Your Battle Team</h2>
        <div className="difficulty-badge" data-difficulty={difficulty}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Difficulty
        </div>
      </div>
      
      {tutorialNotice}
      
      <div className="team-selector-content">
        {/* Left Panel - Available Creatures */}
        <div className="available-panel">
          <h3>Available Creatures ({availableCreatures.length})</h3>
          <div className="creature-grid">
            {sortedCreatures.map(creature => {
              const isSelected = selectedCreatures.some(c => c.id === creature.id);
              // Use pre-calculated rating
              const rating = creatureRatings.get(creature.id) || 0;
              
              return (
                <div
                  key={creature.id}
                  className={`creature-card ${getRarityClass(creature.rarity)} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleCreatureSelect(creature)}
                >
                  <div className="creature-image">
                    <img src={creature.image_url || creature.key_image_url} alt={creature.species_name} />
                    <div className="form-badge">F{creature.form || 0}</div>
                    {creature.combination_level > 0 && (
                      <div className="combo-badge">C{creature.combination_level}</div>
                    )}
                  </div>
                  
                  <div className="creature-info">
                    <div className="creature-name">{creature.species_name}</div>
                    <div className="creature-rarity">{creature.rarity}</div>
                    <div className="creature-rating">⚔️ {rating}</div>
                    
                    {creature.specialty_stats && creature.specialty_stats.length > 0 && (
                      <div className="creature-specialties">
                        {creature.specialty_stats.map(stat => (
                          <span key={stat} className="specialty-icon" title={stat}>
                            {getStatIcon(stat)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {isSelected && (
                    <div className="selected-overlay">
                      <div className="selected-check">✓</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Center Panel - Team Composition */}
        <div className="team-panel">
          <div className="team-header">
            <h3>Battle Team ({selectedCreatures.length}/{MAX_CREATURES})</h3>
            <button 
              className="synergy-toggle"
              onClick={() => setShowSynergyDetails(!showSynergyDetails)}
              disabled={activeSynergies.length === 0}
            >
              {getSynergyIcon({ icon: '🔗' })} Synergies ({activeSynergies.length})
            </button>
          </div>
          
          {/* Team Rating and Analysis */}
          <div className="team-analysis">
            <div className="team-rating">
              <span className="rating-label">Team Power:</span>
              <span className="rating-value">{teamAnalysis.teamRating}</span>
            </div>
            
            <div className={`difficulty-match ${teamAnalysis.difficultyRating.meetsRequirements ? 'good' : 'warning'}`}>
              <div className="match-ratings">
                <span>Your Team: {teamAnalysis.difficultyRating.playerRating}</span>
                <span className="vs">VS</span>
                <span>Enemy: {teamAnalysis.difficultyRating.enemyRating}</span>
              </div>
              <div className="match-recommendation">
                {teamAnalysis.difficultyRating.recommendation}
              </div>
            </div>
          </div>
          
          {/* Synergy Details */}
          {showSynergyDetails && activeSynergies.length > 0 && (
            <div className="synergy-details">
              <h4>Active Synergies</h4>
              <div className="synergy-list">
                {activeSynergies.map((synergy, index) => (
                  <div key={index} className="synergy-item">
                    <span className="synergy-icon">{getSynergyIcon(synergy)}</span>
                    <div className="synergy-info">
                      <div className="synergy-name">{synergy.name}</div>
                      <div className="synergy-description">{synergy.description}</div>
                      <div className="synergy-bonus">+{Math.round(synergy.bonus * 100)}% bonus</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Selected Creatures Order */}
          <div className="selected-creatures-list">
            <div className="list-header">
              <h4>Battle Order (drag to reorder)</h4>
              <span className="order-hint">Creatures will be drawn in this order</span>
            </div>
            
            {selectedCreatures.length === 0 ? (
              <div className="empty-team">Select creatures to build your team</div>
            ) : (
              <div className="creature-order-list">
                {selectedCreatures.map((creature, index) => (
                  <div
                    key={creature.id}
                    className="creature-order-item"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', index.toString());
                      setDraggedItem({ type: 'creature', index });
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                      if (!isNaN(draggedIndex) && draggedIndex !== index) {
                        handleCreatureReorder(draggedIndex, index);
                      }
                      setDraggedItem(null);
                    }}
                    onDragEnd={() => {
                      setDraggedItem(null);
                    }}
                  >
                    <div className="order-number">{index + 1}</div>
                    <img src={creature.image_url || creature.key_image_url} alt={creature.species_name} />
                    <div className="order-creature-info">
                      <div className="order-creature-name">{creature.species_name}</div>
                      <div className="order-creature-stats">
                        F{creature.form || 0} • {creature.rarity}
                      </div>
                    </div>
                    <div className="drag-handle">⋮⋮</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Items Selection */}
          <div className="items-selection">
            <div className="tools-section">
              <h4>Tools ({selectedTools.length}/{MAX_TOOLS})</h4>
              <div className="items-list">
                {availableTools.map(tool => {
                  const isSelected = selectedTools.some(t => t.id === tool.id);
                  
                  return (
                    <div
                      key={tool.id}
                      className={`item-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleToolSelect(tool)}
                      data-rarity={tool.rarity?.toLowerCase() || 'common'}
                    >
                      <div className="item-image">
                        <img src={tool.image_url || `/assets/tool_default.png`} alt={tool.name} />
                        {isSelected && <div className="item-check">✓</div>}
                      </div>
                      <div className="item-info">
                        <div className="item-name">{tool.name}</div>
                        {tool.energy_cost && (
                          <div className="item-cost">⚡ {tool.energy_cost}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="spells-section">
              <h4>Spells ({selectedSpells.length}/{MAX_SPELLS})</h4>
              <div className="items-list">
                {availableSpells.map(spell => {
                  const isSelected = selectedSpells.some(s => s.id === spell.id);
                  
                  return (
                    <div
                      key={spell.id}
                      className={`item-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSpellSelect(spell)}
                      data-rarity={spell.rarity?.toLowerCase() || 'common'}
                    >
                      <div className="item-image">
                        <img src={spell.image_url || `/assets/spell_default.png`} alt={spell.name} />
                        {isSelected && <div className="item-check">✓</div>}
                      </div>
                      <div className="item-info">
                        <div className="item-name">{spell.name}</div>
                        {spell.energy_cost && (
                          <div className="item-cost">⚡ {spell.energy_cost}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Start Battle Button */}
          <button 
            className={`start-battle-button ${canStartBattle ? 'ready' : 'disabled'}`}
            onClick={handleConfirmTeam}
            disabled={!canStartBattle}
          >
            {difficulty === 'tutorial' 
              ? '🎮 Start Tutorial Battle' 
              : canStartBattle 
                ? `Start Battle with ${selectedCreatures.length} Creature${selectedCreatures.length > 1 ? 's' : ''}` 
                : `Select at least ${MIN_CREATURES} creature${MIN_CREATURES > 1 ? 's' : ''}`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamSelector;
