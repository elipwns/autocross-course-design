import React, { useState } from 'react';
import { ElementDefinitions } from './ElementDefinitions';

/**
 * ElementPropertiesPanel component - Displays and allows editing of element properties
 */
function ElementPropertiesPanel({ selectedElement, elementProperties, onPropertyChange }) {
  const [properties, setProperties] = useState(elementProperties || {});
  
  // Get the definition for the selected element
  const elementDefinition = selectedElement ? ElementDefinitions[selectedElement] : null;
  
  // Handle property change
  const handlePropertyChange = (propertyName, value) => {
    const newProperties = {
      ...properties,
      [propertyName]: value
    };
    
    setProperties(newProperties);
    
    if (onPropertyChange) {
      onPropertyChange(newProperties);
    }
  };
  
  // Render a property input based on its type
  const renderPropertyInput = (propertyName, propertyDef) => {
    const value = properties[propertyName] !== undefined ? 
      properties[propertyName] : 
      propertyDef.default;
    
    switch (propertyDef.type) {
      case 'number':
        return (
          <div className="property-input number-input">
            <input
              type="range"
              min={propertyDef.min}
              max={propertyDef.max}
              value={value}
              onChange={(e) => handlePropertyChange(propertyName, Number(e.target.value))}
            />
            <div className="value-display">
              <span>{value} {propertyDef.unit}</span>
            </div>
          </div>
        );
        
      case 'select':
        return (
          <div className="property-input select-input">
            <select
              value={value}
              onChange={(e) => handlePropertyChange(propertyName, e.target.value)}
            >
              {propertyDef.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
        
      case 'boolean':
        return (
          <div className="property-input boolean-input">
            <label>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handlePropertyChange(propertyName, e.target.checked)}
              />
              {value ? 'Yes' : 'No'}
            </label>
          </div>
        );
        
      case 'angle':
        return (
          <div className="property-input angle-input">
            <input
              type="range"
              min={propertyDef.min}
              max={propertyDef.max}
              value={value}
              onChange={(e) => handlePropertyChange(propertyName, Number(e.target.value))}
            />
            <div className="value-display">
              <span>{value}°</span>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="property-input text-input">
            <input
              type="text"
              value={value}
              onChange={(e) => handlePropertyChange(propertyName, e.target.value)}
            />
          </div>
        );
    }
  };
  
  // If no element is selected, show a message
  if (!elementDefinition) {
    return (
      <div className="element-properties-panel">
        <h3>Element Properties</h3>
        <p className="no-element-message">Select an element to view and edit its properties.</p>
      </div>
    );
  }
  
  return (
    <div className="element-properties-panel">
      <h3>{elementDefinition.name} Properties</h3>
      <p className="element-description">{elementDefinition.description}</p>
      
      <div className="properties-list">
        {Object.entries(elementDefinition.properties).map(([propName, propDef]) => (
          <div key={propName} className="property-item">
            <div className="property-header">
              <h4>{propDef.name}</h4>
              <span className="property-hint">{propDef.description}</span>
            </div>
            {renderPropertyInput(propName, propDef)}
          </div>
        ))}
      </div>
      
      <div className="element-actions">
        <button className="button-secondary">Reset to Defaults</button>
        <button className="button-primary">Apply Changes</button>
      </div>
    </div>
  );
}

export default ElementPropertiesPanel;