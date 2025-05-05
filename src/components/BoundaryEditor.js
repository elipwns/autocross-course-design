import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * BoundaryEditor component for drawing venue boundaries on an uploaded image
 * With pan and zoom functionality for large images
 */
function BoundaryEditor({ image, boundaries, onBoundaryUpdate }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [currentBoundary, setCurrentBoundary] = useState([]);
  const [allBoundaries, setAllBoundaries] = useState(boundaries || []);
  const [canvasSize] = useState({ width: 800, height: 600 });
  // Scale is used in coordinate conversion and redrawing
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState(null);
  const [zoom, setZoom] = useState(1);
  
  // Function to redraw the entire canvas - defined before it's used
  const redrawCanvas = useCallback((img, offsetX, offsetY, currentZoom) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the image with current zoom and offset
    const scaledWidth = img.width * currentZoom;
    const scaledHeight = img.height * currentZoom;
    
    ctx.drawImage(
      img, 
      0, 0, img.width, img.height,
      offsetX, offsetY, scaledWidth, scaledHeight
    );
    
    // Draw all completed boundaries
    allBoundaries.forEach(boundary => {
      if (boundary.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(
        boundary[0].x * currentZoom + offsetX,
        boundary[0].y * currentZoom + offsetY
      );
      
      for (let i = 1; i < boundary.length; i++) {
        ctx.lineTo(
          boundary[i].x * currentZoom + offsetX,
          boundary[i].y * currentZoom + offsetY
        );
      }
      
      // Close the boundary
      ctx.lineTo(
        boundary[0].x * currentZoom + offsetX,
        boundary[0].y * currentZoom + offsetY
      );
      
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
      ctx.fill();
    });
    
    // Draw the current boundary being created
    if (currentBoundary.length > 0) {
      ctx.beginPath();
      ctx.moveTo(
        currentBoundary[0].x * currentZoom + offsetX,
        currentBoundary[0].y * currentZoom + offsetY
      );
      
      for (let i = 1; i < currentBoundary.length; i++) {
        ctx.lineTo(
          currentBoundary[i].x * currentZoom + offsetX,
          currentBoundary[i].y * currentZoom + offsetY
        );
      }
      
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw points for each vertex
      currentBoundary.forEach(point => {
        ctx.beginPath();
        ctx.arc(
          point.x * currentZoom + offsetX,
          point.y * currentZoom + offsetY,
          5, 0, Math.PI * 2
        );
        ctx.fillStyle = 'rgba(0, 255, 0, 1)';
        ctx.fill();
      });
    }
  }, [allBoundaries, currentBoundary]);

  // Reset view to fit the entire image - defined after redrawCanvas
  const resetView = useCallback((img) => {
    if (!canvasRef.current || !img) return;
    
    const canvas = canvasRef.current;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate scaling to fit image within canvas while maintaining aspect ratio
    const imgScale = Math.min(
      canvasWidth / img.width,
      canvasHeight / img.height
    );
    
    // Set initial zoom to fit the image
    setZoom(imgScale);
    
    // Center the image on the canvas
    const scaledWidth = img.width * imgScale;
    const scaledHeight = img.height * imgScale;
    
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;
    
    // Store these values for coordinate conversion
    setScale(imgScale);
    setOffset({ x: offsetX, y: offsetY });
    
    // Redraw everything
    redrawCanvas(img, offsetX, offsetY, imgScale);
  }, [redrawCanvas]);
  
  // Initialize canvas when component mounts or image changes
  useEffect(() => {
    if (!canvasRef.current || !image) return;
    
    const canvas = canvasRef.current;
    // ctx is used indirectly through resetView and redrawCanvas
    const ctx = canvas.getContext('2d');
    
    // Load the image
    const img = new Image();
    img.src = image;
    img.onload = () => {
      // Reset view to fit the image
      resetView(img);
    };
  }, [image, resetView]);
  
  // Update boundaries when they change externally
  useEffect(() => {
    if (JSON.stringify(boundaries) !== JSON.stringify(allBoundaries)) {
      setAllBoundaries(boundaries || []);
    }
  }, [boundaries, allBoundaries]);
  
  // Draw all boundaries whenever they change
  useEffect(() => {
    if (image) {
      const img = new Image();
      img.src = image;
      img.onload = () => {
        redrawCanvas(img, offset.x, offset.y, zoom);
      };
    }
  }, [allBoundaries, currentBoundary, offset, zoom, image, redrawCanvas]);
  
  // Convert canvas coordinates to image coordinates
  const canvasToImageCoords = useCallback((canvasX, canvasY) => {
    return {
      x: (canvasX - offset.x) / zoom,
      y: (canvasY - offset.y) / zoom
    };
  }, [offset, zoom]);
  
  // Handle mouse down event
  const handleMouseDown = (e) => {
    if (!image) return;
    
    // Prevent default browser behavior for middle mouse button
    if (e.button === 1) {
      e.preventDefault();
    }
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if middle mouse button or space key is pressed (for panning)
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setLastPanPoint({ x, y });
      return;
    }
    
    // Left click for drawing
    if (e.button === 0) {
      // Convert to image coordinates
      const imageCoords = canvasToImageCoords(x, y);
      
      // Check if we're closing the boundary (clicking near the first point)
      if (currentBoundary.length > 2) {
        const firstPoint = currentBoundary[0];
        const distance = Math.sqrt(
          Math.pow((firstPoint.x - imageCoords.x) * zoom, 2) + 
          Math.pow((firstPoint.y - imageCoords.y) * zoom, 2)
        );
        
        if (distance < 20) {
          // Close the boundary
          const newBoundaries = [...allBoundaries, currentBoundary];
          setAllBoundaries(newBoundaries);
          setCurrentBoundary([]);
          onBoundaryUpdate(newBoundaries);
          return;
        }
      }
      
      // Add point to current boundary
      setCurrentBoundary([...currentBoundary, imageCoords]);
    }
  };
  
  // Handle mouse move event
  const handleMouseMove = (e) => {
    if (!canvasRef.current || !image) return;
    
    // If panning, prevent default browser behavior
    if (isPanning) {
      e.preventDefault();
    }
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Handle panning
    if (isPanning && lastPanPoint) {
      const dx = x - lastPanPoint.x;
      const dy = y - lastPanPoint.y;
      
      setOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setLastPanPoint({ x, y });
    }
  };
  
  // Handle mouse up event
  const handleMouseUp = (e) => {
    // Prevent default browser behavior for middle mouse button
    if (e.button === 1) {
      e.preventDefault();
    }
    
    setIsPanning(false);
    setLastPanPoint(null);
  };
  
  // Handle mouse wheel for zooming
  const handleWheel = (e) => {
    // Always prevent default to stop page scrolling
    e.preventDefault();
    e.stopPropagation();
    
    if (!canvasRef.current || !image) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get mouse position relative to canvas
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert to image coordinates before zoom change
    const imgCoordsBefore = canvasToImageCoords(mouseX, mouseY);
    
    // Calculate new zoom level
    const zoomDelta = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.1, Math.min(10, zoom * zoomDelta));
    
    // Set new zoom
    setZoom(newZoom);
    
    // Calculate new offset to zoom toward/from mouse position
    const newOffsetX = mouseX - imgCoordsBefore.x * newZoom;
    const newOffsetY = mouseY - imgCoordsBefore.y * newZoom;
    
    setOffset({ x: newOffsetX, y: newOffsetY });
    
    return false; // Prevent any default behavior
  };
  
  // Handle key press for canceling the current boundary
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setCurrentBoundary([]);
    } else if (e.key === 'r') {
      // Reset view
      const img = new Image();
      img.src = image;
      img.onload = () => resetView(img);
    }
  };
  
  // Handle clear all boundaries
  const handleClearAll = () => {
    setAllBoundaries([]);
    setCurrentBoundary([]);
    onBoundaryUpdate([]);
  };
  
  // Handle undo last point
  const handleUndoPoint = () => {
    if (currentBoundary.length > 0) {
      setCurrentBoundary(currentBoundary.slice(0, -1));
    }
  };
  
  // Handle complete current boundary
  const handleCompleteBoundary = () => {
    if (currentBoundary.length > 2) {
      const newBoundaries = [...allBoundaries, currentBoundary];
      setAllBoundaries(newBoundaries);
      setCurrentBoundary([]);
      onBoundaryUpdate(newBoundaries);
    } else {
      alert('A boundary must have at least 3 points');
    }
  };
  
  // Handle reset view
  const handleResetView = () => {
    const img = new Image();
    img.src = image;
    img.onload = () => resetView(img);
  };
  
  // Handle zoom in
  const handleZoomIn = () => {
    const newZoom = Math.min(10, zoom * 1.2);
    setZoom(newZoom);
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, zoom * 0.8);
    setZoom(newZoom);
  };
  
  // Add event listeners to prevent wheel scrolling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Function to prevent wheel scrolling
    const preventWheelScroll = (e) => {
      e.preventDefault();
      return false;
    };
    
    // Add the event listener with passive: false to allow preventDefault
    canvas.addEventListener('wheel', preventWheelScroll, { passive: false });
    
    // Clean up
    return () => {
      canvas.removeEventListener('wheel', preventWheelScroll);
    };
  }, []);
  
  return (
    <div className="boundary-editor" tabIndex="0" onKeyDown={handleKeyDown}>
      <div className="canvas-container" ref={containerRef}>
        <canvas 
          ref={canvasRef} 
          width={canvasSize.width} 
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="boundary-canvas"
        />
      </div>
      
      <div className="boundary-controls">
        <div className="drawing-controls">
          <button 
            className="button-secondary"
            onClick={handleUndoPoint}
            disabled={currentBoundary.length === 0}
          >
            Undo Last Point
          </button>
          
          <button 
            className="button-primary"
            onClick={handleCompleteBoundary}
            disabled={currentBoundary.length < 3}
          >
            Complete Boundary
          </button>
          
          <button 
            className="button-danger"
            onClick={handleClearAll}
            disabled={allBoundaries.length === 0 && currentBoundary.length === 0}
          >
            Clear All
          </button>
        </div>
        
        <div className="navigation-controls">
          <button 
            className="button-secondary"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <span role="img" aria-label="Zoom In">🔍+</span>
          </button>
          
          <button 
            className="button-secondary"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <span role="img" aria-label="Zoom Out">🔍-</span>
          </button>
          
          <button 
            className="button-secondary"
            onClick={handleResetView}
            title="Reset View"
          >
            <span role="img" aria-label="Reset View">🔄</span>
          </button>
        </div>
      </div>
      
      <div className="boundary-instructions">
        <h4>Instructions:</h4>
        <ul>
          <li>Click on the image to place boundary points</li>
          <li>Click near the first point to close the boundary</li>
          <li>Press ESC to cancel the current boundary</li>
          <li>Hold ALT + drag or use middle mouse button to pan</li>
          <li>Use mouse wheel to zoom in/out</li>
          <li>Press R or click 🔄 to reset the view</li>
        </ul>
      </div>
    </div>
  );
}

export default BoundaryEditor;