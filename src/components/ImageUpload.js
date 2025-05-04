import React, { useState } from 'react';
import Dropzone from 'react-dropzone';

/**
 * Enhanced ImageUpload component with preview and validation
 * Supports larger images and provides better preview
 */
function ImageUpload({ onImageUpload }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  
  const handleDrop = (acceptedFiles, rejectedFiles) => {
    // Reset states
    setError(null);
    
    // Handle rejected files
    if (rejectedFiles && rejectedFiles.length > 0) {
      setError('Please upload a valid image file (PNG, JPG, JPEG) under 50MB');
      return;
    }
    
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('Image size should be less than 50MB');
        return;
      }
      
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // Pass the file to parent component
      onImageUpload(acceptedFiles);
    }
  };
  
  return (
    <div className="image-upload-container">
      <Dropzone 
        onDrop={(acceptedFiles, rejectedFiles) => handleDrop(acceptedFiles, rejectedFiles)}
        accept={{
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png']
        }}
        maxSize={50 * 1024 * 1024} // 50MB
        multiple={false}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div 
            {...getRootProps()} 
            className={`dropzone ${isDragActive ? 'active' : ''} ${preview ? 'has-preview' : ''}`}
          >
            <input {...getInputProps()} />
            
            {!preview ? (
              <div className="dropzone-content">
                <div className="dropzone-icon">
                  <i className="upload-icon">📁</i>
                </div>
                <p>Drag 'n' drop an image here, or click to select</p>
                <p className="dropzone-hint">Supported formats: JPG, PNG (max 50MB)</p>
                <p className="dropzone-hint">High-resolution aerial images are supported</p>
              </div>
            ) : (
              <div className="dropzone-preview">
                <img src={preview} alt="Preview" className="preview-image" />
                <div className="preview-overlay">
                  <p>Click or drop to change image</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Dropzone>
      
      {error && <div className="upload-error">{error}</div>}
      
      {preview && (
        <div className="upload-actions">
          <button 
            className="button-secondary"
            onClick={() => {
              setPreview(null);
              setError(null);
            }}
          >
            Remove Image
          </button>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;