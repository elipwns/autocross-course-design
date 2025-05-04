import React from 'react';

/**
 * CourseElementsPanel component - Displays available course elements
 */
function CourseElementsPanel({ onSelectElement, selectedElement }) {
  // Element types with their properties
  const elementTypes = [
    {
      id: 'cone',
      name: 'Single Cone',
      description: 'Place individual cones',
      icon: '🔶'
    },
    {
      id: 'slalom',
      name: 'Slalom',
      description: '3-5 cones in a straight line',
      icon: '🔶🔶🔶'
    },
    {
      id: 'chicane',
      name: 'Chicane',
      description: 'Offset gates to create S-turns',
      icon: '🔄'
    },
    {
      id: 'sweeper',
      name: 'Sweeper',
      description: 'Constant radius turn',
      icon: '↪️'
    },
    {
      id: 'chicago-box',
      name: 'Chicago Box',
      description: 'Box with entry and exit gates',
      icon: '⬛'
    },
    {
      id: 'gate',
      name: 'Gate',
      description: 'Two cones creating a gate',
      icon: '🔸 🔸'
    },
    {
      id: 'offset-slalom',
      name: 'Offset Slalom',
      description: 'Slalom with offset sections',
      icon: '↔️'
    },
    {
      id: 'pointer-cones',
      name: 'Pointer Cones',
      description: 'Knocked over cones for direction',
      icon: '🔻'
    },
    {
      id: 'crossover-box',
      name: 'Crossover Box',
      description: '4 cones in a square for perpendicular paths',
      icon: '⬛'
    }
  ];
  
  return (
    <div className="course-elements-panel">
      <h3>Course Elements</h3>
      <p className="panel-description">Select an element type, then click on the course to place it.</p>
      
      <div className="elements-grid">
        {elementTypes.map(element => (
          <div 
            key={element.id}
            className={`element-item ${selectedElement === element.id ? 'selected' : ''}`}
            onClick={() => onSelectElement(element.id)}
          >
            <div className="element-icon">{element.icon}</div>
            <div className="element-info">
              <h4>{element.name}</h4>
              <p>{element.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="element-instructions">
        <h4>Element Placement Tips:</h4>
        <ul>
          <li>Click to place individual elements</li>
          <li>For multi-cone elements, click to place the first cone, then drag to set direction</li>
          <li>Use the rotation handle to adjust orientation</li>
          <li>Right-click to delete elements</li>
        </ul>
      </div>
    </div>
  );
}

export default CourseElementsPanel;