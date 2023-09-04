import React from 'react';
import Dropzone from 'react-dropzone';

function ImageUpload({ onImageUpload }) {
  return (
    <Dropzone onDrop={(acceptedFiles) => onImageUpload(acceptedFiles)}>
      {({ getRootProps, getInputProps }) => (
        <div {...getRootProps()} className="dropzone">
          <input {...getInputProps()} />
          <p>Drag 'n' drop an image here, or click to select an image</p>
        </div>
      )}
    </Dropzone>
  );
}

export default ImageUpload;
