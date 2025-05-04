import React, { useRef, useEffect } from 'react';

function DrawingCanvas({ image }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current || !image) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 600;
    
    // Load the image
    const img = new Image();
    img.src = image;
    img.onload = () => {
      // Calculate scaling to fit image within canvas while maintaining aspect ratio
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );
      
      const centerX = (canvas.width - img.width * scale) / 2;
      const centerY = (canvas.height - img.height * scale) / 2;
      
      // Clear canvas and draw image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img, 
        0, 0, img.width, img.height,
        centerX, centerY, img.width * scale, img.height * scale
      );
    };
    
    // Drawing state
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    // Drawing functions
    const startDrawing = (e) => {
      const rect = canvas.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
      isDrawing = true;
    };
    
    const draw = (e) => {
      if (!isDrawing) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      lastX = x;
      lastY = y;
    };
    
    const stopDrawing = () => {
      isDrawing = false;
    };
    
    // Add event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Cleanup
    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
    };
  }, [image]);
  
  return (
    <div className="canvas-container">
      <canvas ref={canvasRef} className="drawing-canvas"></canvas>
    </div>
  );
}

export default DrawingCanvas;