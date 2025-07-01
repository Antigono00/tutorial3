// src/utils/tutorialData.js - Complete Tutorial Data Generator with Fixed Images

export const generateTutorialCreatures = () => {
  const tutorialCreatures = [
    {
      id: 'tutorial-1',
      species_id: 'bullx',
      species_name: 'Bullx',
      rarity: 'Common',
      form: 1,
      image_url: 'https://cvxlab.net/assets/evolving_creatures/bullx_form1.png',
      key_image_url: 'https://cvxlab.net/assets/evolving_creatures/bullx_form1.png',
      stats: {
        energy: 10,
        strength: 15,
        magic: 5,
        stamina: 12,
        speed: 8
      },
      specialty_stats: ['strength', 'stamina'],
      health: 60,
      currentHealth: 60,
      activeEffects: [],
      isDefending: false,
      combination_level: 0,
      description: "A strong physical attacker, perfect for beginners."
    },
    {
      id: 'tutorial-2',
      species_id: 'flooper',
      species_name: 'Flooper',
      rarity: 'Common',
      form: 1,
      image_url: 'https://cvxlab.net/assets/evolving_creatures/flooper_form1.png',
      key_image_url: 'https://cvxlab.net/assets/evolving_creatures/flooper_form1.png',
      stats: {
        energy: 12,
        strength: 6,
        magic: 14,
        stamina: 8,
        speed: 10
      },
      specialty_stats: ['magic', 'energy'],
      health: 50,
      currentHealth: 50,
      activeEffects: [],
      isDefending: false,
      combination_level: 0,
      description: "A magical creature with powerful spell synergy."
    },
    {
      id: 'tutorial-3',
      species_id: 'cvxling',
      species_name: 'Cvxling',
      rarity: 'Common',
      form: 2,
      image_url: 'https://cvxlab.net/assets/evolving_creatures/cvxling_form2.png',
      key_image_url: 'https://cvxlab.net/assets/evolving_creatures/cvxling_form2.png',
      stats: {
        energy: 14,
        strength: 8,
        magic: 10,
        stamina: 10,
        speed: 13
      },
      specialty_stats: ['speed', 'energy'],
      health: 70,
      currentHealth: 70,
      activeEffects: [],
      isDefending: false,
      combination_level: 0,
      description: "Fast and efficient, great for combo strategies."
    },
    {
      id: 'tutorial-4',
      species_id: 'wowori',
      species_name: 'Wowori',
      rarity: 'Rare',
      form: 1,
      image_url: 'https://cvxlab.net/assets/evolving_creatures/wowori_form1.png',
      key_image_url: 'https://cvxlab.net/assets/evolving_creatures/wowori_form1.png',
      stats: {
        energy: 13,
        strength: 7,
        magic: 16,
        stamina: 9,
        speed: 11
      },
      specialty_stats: ['magic', 'energy'],
      health: 55,
      currentHealth: 55,
      activeEffects: [],
      isDefending: false,
      combination_level: 0,
      description: "A rare magical powerhouse."
    },
    {
      id: 'tutorial-5',
      species_id: 'hodlphant',
      species_name: 'Hodlphant',
      rarity: 'Rare',
      form: 2,
      image_url: 'https://cvxlab.net/assets/evolving_creatures/hodlphant_form2.png',
      key_image_url: 'https://cvxlab.net/assets/evolving_creatures/hodlphant_form2.png',
      stats: {
        energy: 8,
        strength: 20,
        magic: 6,
        stamina: 16,
        speed: 5
      },
      specialty_stats: ['strength', 'strength'],
      health: 90,
      currentHealth: 90,
      activeEffects: [],
      isDefending: false,
      combination_level: 0,
      description: "Slow but incredibly powerful tank."
    },
    {
      id: 'tutorial-6',
      species_id: 'etherion',
      species_name: 'Etherion',
      rarity: 'Epic',
      form: 1,
      image_url: 'https://cvxlab.net/assets/evolving_creatures/etherion_form1.png',
      key_image_url: 'https://cvxlab.net/assets/evolving_creatures/etherion_form1.png',
      stats: {
        energy: 15,
        strength: 9,
        magic: 18,
        stamina: 11,
        speed: 12
      },
      specialty_stats: ['magic', 'energy'],
      health: 65,
      currentHealth: 65,
      activeEffects: [],
      isDefending: false,
      combination_level: 0,
      description: "An epic creature with balanced magical abilities."
    }
  ];

  return tutorialCreatures;
};

export const generateTutorialTools = () => {
  return [
    {
      id: 'tutorial-tool-1',
      name: 'Babylon Keystone',
      tool_type: 'energy',
      tool_effect: 'echo',
      image_url: 'https://cvxlab.net/assets/tools/babylon_keystone.png',
      rarity: 'Common',
      description: "Echoing energy efficiency that decays over 4 turns"
    },
    {
      id: 'tutorial-tool-2',
      name: 'Hyperscale Capacitor',
      tool_type: 'strength',
      tool_effect: 'surge',
      image_url: 'https://cvxlab.net/assets/tools/hyperscale_capacitor.png',
      rarity: 'Common',
      description: "Fast strength boost for 2 turns"
    },
    {
      id: 'tutorial-tool-3',
      name: 'Ledger Lens',
      tool_type: 'magic',
      tool_effect: 'shield',
      image_url: 'https://cvxlab.net/assets/tools/ledger_lens.png',
      rarity: 'Common',
      description: "Magical defense shield with healing"
    }
  ];
};

export const generateTutorialSpells = () => {
  return [
    {
      id: 'tutorial-spell-1',
      name: 'Babylon Burst',
      spell_type: 'energy',
      spell_effect: 'surge',
      image_url: 'https://cvxlab.net/assets/spells/babylon_burst.png',
      rarity: 'Common',
      energy_cost: 4,
      description: "Instant massive damage with critical chance"
    },
    {
      id: 'tutorial-spell-2',
      name: 'Cerberus Chain',
      spell_type: 'stamina',
      spell_effect: 'shield',
      image_url: 'https://cvxlab.net/assets/spells/cerberus_chain.png',
      rarity: 'Common',
      energy_cost: 4,
      description: "Healing and defense buffs over time"
    },
    {
      id: 'tutorial-spell-3',
      name: 'Engine Overclock',
      spell_type: 'speed',
      spell_effect: 'echo',
      image_url: 'https://cvxlab.net/assets/spells/engine_overclock.png',
      rarity: 'Common',
      energy_cost: 4,
      description: "Speed boost with echoing effects"
    }
  ];
};

// Pre-selected team for tutorial with balanced composition
export const getTutorialTeam = () => {
  const allCreatures = generateTutorialCreatures();
  return {
    creatures: [
      allCreatures[0], // Bullx - Physical attacker
      allCreatures[1], // Flooper - Magic attacker
      allCreatures[3], // Wowori - Support/Magic
      allCreatures[2]  // Cvxling - Speed/Utility
    ],
    tools: generateTutorialTools(),
    spells: generateTutorialSpells()
  };
};

// Tutorial enemy creatures (weaker for learning) - FIXED WITH PROPER IMAGES AND VALID CREATURES
export const generateTutorialEnemies = () => {
  return [
    {
      id: 'tutorial-enemy-1',
      species_id: 'dan',
      species_name: 'Dan',
      rarity: 'Common',
      form: 0,
      image_url: 'https://cvxlab.net/assets/evolving_creatures/dan_egg.png', // Fixed: _egg.png for form 0
      key_image_url: 'https://cvxlab.net/assets/evolving_creatures/dan_egg.png',
      stats: {
        energy: 5,
        strength: 8,
        magic: 4,
        stamina: 10,
        speed: 6
      },
      specialty_stats: ['stamina'],
      health: 40,
      currentHealth: 40,
      owner: 'enemy',
      activeEffects: [],
      isDefending: false,
      battleStats: null // Will be calculated
    },
    {
      id: 'tutorial-enemy-2',
      species_id: 'delivera',
      species_name: 'Delivera',
      rarity: 'Common',
      form: 0,
      image_url: 'https://cvxlab.net/assets/evolving_creatures/delivera_egg.png', // Fixed: _egg.png for form 0
      key_image_url: 'https://cvxlab.net/assets/evolving_creatures/delivera_egg.png',
      stats: {
        energy: 6,
        strength: 10,
        magic: 3,
        stamina: 8,
        speed: 7
      },
      specialty_stats: ['strength'],
      health: 45,
      currentHealth: 45,
      owner: 'enemy',
      activeEffects: [],
      isDefending: false,
      battleStats: null // Will be calculated
    },
    {
      id: 'tutorial-enemy-3',
      species_id: 'moxer', // Changed from non-existent 'blaizer' to 'moxer'
      species_name: 'Moxer',
      rarity: 'Common',
      form: 1,
      image_url: 'https://cvxlab.net/assets/evolving_creatures/moxer_form1.png', // Fixed: valid creature with proper URL
      key_image_url: 'https://cvxlab.net/assets/evolving_creatures/moxer_form1.png',
      stats: {
        energy: 8,
        strength: 7,
        magic: 9,
        stamina: 7,
        speed: 8
      },
      specialty_stats: ['speed', 'magic'],
      health: 50,
      currentHealth: 50,
      owner: 'enemy',
      activeEffects: [],
      isDefending: false,
      battleStats: null // Will be calculated
    }
  ];
};
