/**
 * Element Definitions - Defines the properties and appearance of course elements
 */

// Chicago Box Element
export const ChicagoBoxDefinition = {
  name: 'Chicago Box',
  description: 'A box with entry and exit gates',
  icon: '⬛',
  properties: {
    entryWidth: {
      name: 'Entry Width',
      description: 'Width of the entry gate in feet',
      type: 'number',
      min: 10,
      max: 30,
      default: 15,
      unit: 'ft'
    },
    exitWidth: {
      name: 'Exit Width',
      description: 'Width of the exit gate in feet',
      type: 'number',
      min: 10,
      max: 30,
      default: 15,
      unit: 'ft'
    },
    boxLength: {
      name: 'Box Length',
      description: 'Length of the box in feet',
      type: 'number',
      min: 20,
      max: 100,
      default: 50,
      unit: 'ft'
    },
    boxWidth: {
      name: 'Box Width',
      description: 'Width of the box in feet',
      type: 'number',
      min: 20,
      max: 100,
      default: 50,
      unit: 'ft'
    }
  },
  render: (ctx, properties, position, rotation, scale) => {
    // Rendering logic for Chicago Box
    // This would use the properties to draw the box with the specified dimensions
  }
};

// Slalom Element
export const SlalomDefinition = {
  name: 'Slalom',
  description: '3-5 cones in a straight line',
  icon: '🔶🔶🔶',
  properties: {
    coneCount: {
      name: 'Number of Cones',
      description: 'Number of cones in the slalom',
      type: 'number',
      min: 3,
      max: 7,
      default: 5,
      unit: 'cones'
    },
    spacing: {
      name: 'Cone Spacing',
      description: 'Distance between cones in feet',
      type: 'number',
      min: 10,
      max: 50,
      default: 25,
      unit: 'ft'
    },
    variableSpacing: {
      name: 'Variable Spacing',
      description: 'Whether cones get closer or further apart',
      type: 'select',
      options: ['Constant', 'Decreasing', 'Increasing'],
      default: 'Constant'
    },
    offset: {
      name: 'Offset Direction',
      description: 'Whether cones are straight or offset to one side',
      type: 'select',
      options: ['Straight', 'Left Offset', 'Right Offset'],
      default: 'Straight'
    }
  },
  render: (ctx, properties, position, rotation, scale) => {
    // Rendering logic for Slalom
    // This would use the properties to draw the slalom with the specified dimensions
  }
};

// Crossover Box Element
export const CrossoverBoxDefinition = {
  name: 'Crossover Box',
  description: '4 cones in a square for perpendicular crossover',
  icon: '⬛',
  properties: {
    size: {
      name: 'Box Size',
      description: 'Size of the box in feet (width and height)',
      type: 'number',
      min: 20,
      max: 100,
      default: 40,
      unit: 'ft'
    }
  },
  render: (ctx, properties, position, rotation, scale) => {
    // Rendering logic for Crossover Box
    // This would use the properties to draw the box with the specified dimensions
  }
};

// Pointer Cones Element
export const PointerConesDefinition = {
  name: 'Pointer Cones',
  description: 'Knocked over cones for driver information',
  icon: '🔻',
  properties: {
    count: {
      name: 'Number of Cones',
      description: 'Number of pointer cones',
      type: 'number',
      min: 1,
      max: 5,
      default: 1,
      unit: 'cones'
    },
    direction: {
      name: 'Direction',
      description: 'Direction the cones point to',
      type: 'angle',
      min: 0,
      max: 359,
      default: 0,
      unit: 'degrees'
    },
    nextToCone: {
      name: 'Next to Cone',
      description: 'Whether the pointer is next to a standing cone',
      type: 'boolean',
      default: false
    }
  },
  render: (ctx, properties, position, rotation, scale) => {
    // Rendering logic for Pointer Cones
    // This would use the properties to draw the pointer cones with the specified configuration
  }
};

// Gate Element
export const GateDefinition = {
  name: 'Gate',
  description: 'Two cones creating a gate',
  icon: '🔸 🔸',
  properties: {
    width: {
      name: 'Gate Width',
      description: 'Width of the gate in feet',
      type: 'number',
      min: 10,
      max: 30,
      default: 15,
      unit: 'ft'
    }
  },
  render: (ctx, properties, position, rotation, scale) => {
    // Rendering logic for Gate
    // This would use the properties to draw the gate with the specified width
  }
};

// Chicane Element
export const ChicaneDefinition = {
  name: 'Chicane',
  description: 'Offset gates to create S-turns',
  icon: '🔄',
  properties: {
    gateCount: {
      name: 'Number of Gates',
      description: 'Number of gates in the chicane',
      type: 'number',
      min: 2,
      max: 4,
      default: 3,
      unit: 'gates'
    },
    gateWidth: {
      name: 'Gate Width',
      description: 'Width of each gate in feet',
      type: 'number',
      min: 10,
      max: 30,
      default: 15,
      unit: 'ft'
    },
    gateSpacing: {
      name: 'Gate Spacing',
      description: 'Distance between gates in feet',
      type: 'number',
      min: 20,
      max: 100,
      default: 40,
      unit: 'ft'
    },
    offsetDistance: {
      name: 'Offset Distance',
      description: 'How far each gate is offset from the previous one',
      type: 'number',
      min: 10,
      max: 50,
      default: 20,
      unit: 'ft'
    }
  },
  render: (ctx, properties, position, rotation, scale) => {
    // Rendering logic for Chicane
    // This would use the properties to draw the chicane with the specified configuration
  }
};

// Sweeper Element
export const SweeperDefinition = {
  name: 'Sweeper',
  description: 'Constant radius turn',
  icon: '↪️',
  properties: {
    radius: {
      name: 'Radius',
      description: 'Radius of the turn in feet',
      type: 'number',
      min: 20,
      max: 200,
      default: 90,
      unit: 'ft'
    },
    angle: {
      name: 'Angle',
      description: 'Angle of the turn in degrees',
      type: 'select',
      options: ['45°', '60°', '90°', '180°'],
      default: '90°'
    },
    coneSpacing: {
      name: 'Cone Spacing',
      description: 'Distance between cones along the arc',
      type: 'number',
      min: 5,
      max: 30,
      default: 15,
      unit: 'ft'
    }
  },
  render: (ctx, properties, position, rotation, scale) => {
    // Rendering logic for Sweeper
    // This would use the properties to draw the sweeper with the specified radius and angle
  }
};

// Offset Slalom Element
export const OffsetSlalomDefinition = {
  name: 'Offset Slalom',
  description: 'Slalom with offset sections',
  icon: '↔️',
  properties: {
    sections: {
      name: 'Number of Sections',
      description: 'Number of sections in the offset slalom',
      type: 'number',
      min: 2,
      max: 4,
      default: 2,
      unit: 'sections'
    },
    conesPerSection: {
      name: 'Cones Per Section',
      description: 'Number of cones in each section',
      type: 'number',
      min: 3,
      max: 5,
      default: 3,
      unit: 'cones'
    },
    spacing: {
      name: 'Cone Spacing',
      description: 'Distance between cones in feet',
      type: 'number',
      min: 10,
      max: 50,
      default: 25,
      unit: 'ft'
    },
    offsetDistance: {
      name: 'Offset Distance',
      description: 'Distance between sections in feet',
      type: 'number',
      min: 10,
      max: 50,
      default: 20,
      unit: 'ft'
    }
  },
  render: (ctx, properties, position, rotation, scale) => {
    // Rendering logic for Offset Slalom
    // This would use the properties to draw the offset slalom with the specified configuration
  }
};

// Lane Change Element
export const LaneChangeDefinition = {
  name: 'Lane Change',
  description: 'Quick transition between lanes',
  icon: '↔️',
  properties: {
    width: {
      name: 'Lane Width',
      description: 'Width of each lane in feet',
      type: 'number',
      min: 10,
      max: 30,
      default: 15,
      unit: 'ft'
    },
    length: {
      name: 'Transition Length',
      description: 'Length of the transition in feet',
      type: 'number',
      min: 20,
      max: 100,
      default: 40,
      unit: 'ft'
    },
    laneCount: {
      name: 'Number of Lanes',
      description: 'Number of lanes to change between',
      type: 'number',
      min: 2,
      max: 3,
      default: 2,
      unit: 'lanes'
    }
  },
  render: (ctx, properties, position, rotation, scale) => {
    // Rendering logic for Lane Change
    // This would use the properties to draw the lane change with the specified configuration
  }
};

// Export all element definitions
export const ElementDefinitions = {
  'chicago-box': ChicagoBoxDefinition,
  'slalom': SlalomDefinition,
  'crossover-box': CrossoverBoxDefinition,
  'pointer-cones': PointerConesDefinition,
  'gate': GateDefinition,
  'chicane': ChicaneDefinition,
  'sweeper': SweeperDefinition,
  'offset-slalom': OffsetSlalomDefinition,
  'lane-change': LaneChangeDefinition
};