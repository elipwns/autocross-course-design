import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import BoundaryEditor from './BoundaryEditor';

/**
 * VenueSelector component for handling venue image selection and boundary editing
 */
function VenueSelector({ onVenueSelected }) {
  const [image, setImage] = useState(null);
  const [boundaries, setBoundaries] = useState([]);
  const [venueName, setVenueName] = useState('');
  const [venueDescription, setVenueDescription] = useState('');
  
  // Handle image upload from the ImageUpload component
  const handleImageUpload = (acceptedFiles) => {
    const selectedImage = acceptedFiles[0];
    setImage(URL.createObjectURL(selectedImage));
  };
  
  // Handle boundary updates from the BoundaryEditor
  const handleBoundaryUpdate = (newBoundaries) => {
    setBoundaries(newBoundaries);
  };
  
  // Save venue information and pass it up to parent component
  const handleSaveVenue = () => {
    if (!image || boundaries.length === 0 || !venueName) {
      alert('Please upload an image, draw boundaries, and provide a venue name');
      return;
    }
    
    const venue = {
      image,
      boundaries,
      name: venueName,
      description: venueDescription
    };
    
    onVenueSelected(venue);
  };
  
  // Check if the venue is ready to be saved
  const isVenueReady = image && boundaries.length > 0 && venueName.trim() !== '';
  
  return (
    <div className="venue-selector">
      <h2>Select Venue</h2>
      
      {!image ? (
        <div className="venue-upload-section">
          <p>Upload an aerial image of your venue:</p>
          <ImageUpload onImageUpload={handleImageUpload} />
        </div>
      ) : (
        <div className="venue-editor-section">
          <div className="boundary-editor-container">
            <p>Draw the boundaries of your venue:</p>
            <BoundaryEditor 
              image={image} 
              boundaries={boundaries}
              onBoundaryUpdate={handleBoundaryUpdate} 
            />
          </div>
          
          <div className="venue-info">
            <h3>Venue Details</h3>
            <div className="form-group">
              <label htmlFor="venue-name">Venue Name:</label>
              <input 
                type="text" 
                id="venue-name" 
                value={venueName} 
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Enter venue name"
                className={venueName ? 'valid-input' : ''}
              />
              {!venueName && <div className="input-hint">Required</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="venue-description">Description (optional):</label>
              <textarea 
                id="venue-description" 
                value={venueDescription} 
                onChange={(e) => setVenueDescription(e.target.value)}
                placeholder="Enter venue description"
                rows="3"
              />
            </div>
            
            <div className="venue-actions">
              <button 
                className="button-secondary" 
                onClick={() => setImage(null)}
              >
                Upload Different Image
              </button>
              
              <button 
                className={`button-save ${isVenueReady ? 'ready' : ''}`}
                onClick={handleSaveVenue}
                disabled={!isVenueReady}
              >
                {isVenueReady ? 'Save Venue & Continue' : 'Complete Required Fields'}
              </button>
            </div>
            
            <div className="venue-status">
              <h4>Completion Status:</h4>
              <ul className="status-list">
                <li className={image ? 'completed' : ''}>
                  {image ? '✓' : '○'} Upload venue image
                </li>
                <li className={boundaries.length > 0 ? 'completed' : ''}>
                  {boundaries.length > 0 ? '✓' : '○'} Draw venue boundaries
                </li>
                <li className={venueName ? 'completed' : ''}>
                  {venueName ? '✓' : '○'} Enter venue name
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VenueSelector;