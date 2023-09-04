import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import DrawingCanvas from './DrawingCanvas';

export function CourseDesign() {

  const [image, setImage] = useState(null);

  const handleImageUpload = (acceptedFiles) => {
    const selectedImage = acceptedFiles[0];
    setImage(URL.createObjectURL(selectedImage));
  };

  return (
    <div>
      <h1>Welcome to Course Design</h1>
      <p>This is a simple React page holding space for future course design page.</p>
      <ImageUpload onImageUpload={handleImageUpload} />
      {image && <DrawingCanvas image={image} />}
    </div>
  );
}

export default CourseDesign;
