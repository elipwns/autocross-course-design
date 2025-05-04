import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * CourseDesigner component for creating autocross courses on a venue
 * With pan and zoom functionality for large images
 */
function CourseDesigner({ venue, onCourseComplete }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [drawingMode, setDrawingMode] = useState('course'); // 'course', 'start', 'finish', 'element'
  const [courseLines, setCourseLines] = useState([]);
  const [currentLine, setCurrentLine] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [finishPoint, setFinishPoint] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState(null);
  const [zoom, setZoom] = useState(1);
  
  // Draw venue boundaries
  const drawVenueBoundaries = useCallback((boundaries, ctx, offsetX, offsetY, currentZoom) => {
    if (!ctx) return;
    
    boundaries.forEach(boundary => {
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
  }, []);
  
  // Draw course elements (cones, etc.)
  const drawCourseElements = useCallback((ctx, offsetX, offsetY, currentZoom) => {
    if (!ctx) return;
    
    elements.forEach(element => {
      // Draw based on element type
      switch (element.type) {
        case 'cone':
          drawCone(ctx, element.position, element.selected, offsetX, offsetY, currentZoom);
          break;
        case 'slalom':
          drawSlalom(ctx, element.positions, element.selected, offsetX, offsetY, currentZoom);
          break;
        // Add more element types as needed
        default:
          break;
      }
    });
  }, [elements]);
  
  // Draw a cone
  const drawCone = (ctx, position, isSelected, offsetX, offsetY, currentZoom) => {
    const x = position.x * currentZoom + offsetX;
    const y = position.y * currentZoom + offsetY;
    
    // Draw cone base
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 5);
    ctx.lineTo(x + 5, y + 5);
    ctx.lineTo(x, y - 10);
    ctx.closePath();
    
    ctx.fillStyle = isSelected ? 'rgba(255, 165, 0, 1)' : 'rgba(255, 165, 0, 0.8)';
    ctx.fill();
    
    ctx.strokeStyle = isSelected ? 'white' : 'black';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();
  };
  
  // Draw a slalom (multiple cones in a line)
  const drawSlalom = (ctx, positions, isSelected, offsetX, offsetY, currentZoom) => {
    positions.forEach(position => {
      drawCone(ctx, position, isSelected, offsetX, offsetY, currentZoom);
    });
    
    // Connect cones with a line
    if (positions.length > 1) {
      ctx.beginPath();
      ctx.moveTo(
        positions[0].x * currentZoom + offsetX,
        positions[0].y * currentZoom + offsetY
      );
      
      for (let i = 1; i < positions.length; i++) {
        ctx.lineTo(
          positions[i].x * currentZoom + offsetX,
          positions[i].y * currentZoom + offsetY
        );
      }
      
      ctx.strokeStyle = isSelected ? 'rgba(255, 165, 0, 0.8)' : 'rgba(255, 165, 0, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };
  
  // Function to redraw the entire canvas
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
    
    // Draw venue boundaries
    if (venue && venue.boundaries) {
      drawVenueBoundaries(venue.boundaries, ctx, offsetX, offsetY, currentZoom);
    }
    
    // Draw completed course lines
    courseLines.forEach(line => {
      if (line.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(
        line[0].x * currentZoom + offsetX,
        line[0].y * currentZoom + offsetY
      );
      
      for (let i = 1; i < line.length; i++) {
        ctx.lineTo(
          line[i].x * currentZoom + offsetX,
          line[i].y * currentZoom + offsetY
        );
      }
      
      ctx.strokeStyle = 'rgba(0, 0, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
    });
    
    // Draw current line being created
    if (currentLine.length > 0) {
      ctx.beginPath();
      ctx.moveTo(
        currentLine[0].x * currentZoom + offsetX,
        currentLine[0].y * currentZoom + offsetY
      );
      
      for (let i = 1; i < currentLine.length; i++) {
        ctx.lineTo(
          currentLine[i].x * currentZoom + offsetX,
          currentLine[i].y * currentZoom + offsetY
        );
      }
      
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw points for each vertex
      currentLine.forEach(point => {
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
    
    // Draw start point
    if (startPoint) {
      ctx.beginPath();
      ctx.arc(
        startPoint.x * currentZoom + offsetX,
        startPoint.y * currentZoom + offsetY,
        10, 0, Math.PI * 2
      );
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw "START" text
      ctx.font = '14px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(
        'START', 
        startPoint.x * currentZoom + offsetX, 
        (startPoint.y * currentZoom + offsetY) - 15
      );
    }
    
    // Draw finish point
    if (finishPoint) {
      ctx.beginPath();
      ctx.arc(
        finishPoint.x * currentZoom + offsetX,
        finishPoint.y * currentZoom + offsetY,
        10, 0, Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw "FINISH" text
      ctx.font = '14px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(
        'FINISH', 
        finishPoint.x * currentZoom + offsetX, 
        (finishPoint.y * currentZoom + offsetY) - 15
      );
    }
    
    // Draw course elements
    drawCourseElements(ctx, offsetX, offsetY, currentZoom);
    
    // Draw zoom indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(canvas.width - 80, canvas.height - 30, 70, 20);
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Zoom: ${Math.round(currentZoom * 100)}%`, canvas.width - 15, canvas.height - 15);
  }, [venue, courseLines, currentLine, startPoint, finishPoint, drawVenueBoundaries, drawCourseElements]);
  
  // Initialize canvas when component mounts or venue changes
  useEffect(() => {
    if (!canvasRef.current || !venue || !venue.image) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Load the image
    const img = new Image();
    img.src = venue.image;
    img.onload = () => {
      // Reset view to fit the image
      resetView(img);
    };
  }, [venue]);
  
  // Reset view to fit the entire image
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
  
  // Redraw everything when any drawing elements change
  useEffect(() => {
    if (venue && venue.image) {
      const img = new Image();
      img.src = venue.image;
      img.onload = () => {
        redrawCanvas(img, offset.x, offset.y, zoom);
      };
    }
  }, [courseLines, currentLine, startPoint, finishPoint, elements, drawingMode, offset, zoom, venue, redrawCanvas]);
  
  // Convert canvas coordinates to image coordinates
  const canvasToImageCoords = useCallback((canvasX, canvasY) => {
    return {
      x: (canvasX - offset.x) / zoom,
      y: (canvasY - offset.y) / zoom
    };
  }, [offset, zoom]);
  
  // Handle mouse down event
  const handleMouseDown = (e) => {
    if (!venue || !venue.image) return;
    
    // Prevent default browser behavior for middle mouse button
    if (e.button === 1) {
      e.preventDefault();
    }
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if middle mouse button or alt key + left click is pressed (for panning)
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setLastPanPoint({ x, y });
      return;
    }
    
    // Left click for drawing
    if (e.button === 0) {
      // Convert to image coordinates
      const imageCoords = canvasToImageCoords(x, y);
      
      // Handle based on drawing mode
      switch (drawingMode) {
        case 'course':
          handleCourseDrawing(imageCoords);
          break;
        case 'start':
          setStartPoint(imageCoords);
          break;
        case 'finish':
          setFinishPoint(imageCoords);
          break;
        case 'element':
          if (selectedElement === 'cone') {
            addCone(imageCoords);
          } else if (selectedElement === 'slalom') {
            startSlalom(imageCoords);
          }
          break;
        default:
          break;
      }
    }
  };
  
  // Handle mouse move event
  const handleMouseMove = (e) => {
    if (!canvasRef.current || !venue || !venue.image) return;
    
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
      return;
    }
    
    // Handle drawing
    if (isDrawing && drawingMode === 'course') {
      // Convert to image coordinates
      const imageCoords = canvasToImageCoords(x, y);
      
      // Add point to current line if moved enough distance
      if (currentLine.length > 0) {
        const lastPoint = currentLine[currentLine.length - 1];
        const distance = Math.sqrt(
          Math.pow((lastPoint.x - imageCoords.x) * zoom, 2) + 
          Math.pow((lastPoint.y - imageCoords.y) * zoom, 2)
        );
        
        if (distance > 10) {
          setCurrentLine([...currentLine, imageCoords]);
        }
      }
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
    setIsDrawing(false);
  };
  
  // Handle mouse wheel for zooming
  const handleWheel = (e) => {
    // Always prevent default to stop page scrolling
    e.preventDefault();
    e.stopPropagation();
    
    if (!canvasRef.current || !venue || !venue.image) return;
    
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
  
  // Handle course drawing
  const handleCourseDrawing = (coords) => {
    if (currentLine.length === 0) {
      // Start a new line
      setCurrentLine([coords]);
      setIsDrawing(true);
    } else {
      // Continue the line
      setCurrentLine([...currentLine, coords]);
    }
  };
  
  // Complete the current course line
  const completeCourseDrawing = () => {
    if (currentLine.length > 1) {
      setCourseLines([...courseLines, currentLine]);
      setCurrentLine([]);
    }
  };
  
  // Add a cone element
  const addCone = (position) => {
    setElements([
      ...elements,
      {
        id: `cone-${Date.now()}`,
        type: 'cone',
        position,
        selected: false
      }
    ]);
  };
  
  // Start creating a slalom
  const startSlalom = (position) => {
    // Implementation for slalom creation would go here
    // This would likely involve a multi-step process to place multiple cones
  };
  
  // Clear all course elements
  const clearCourse = () => {
    setCourseLines([]);
    setCurrentLine([]);
    setStartPoint(null);
    setFinishPoint(null);
    setElements([]);
  };
  
  // Handle key press for canceling the current line
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setCurrentLine([]);
    } else if (e.key === 'Enter') {
      completeCourseDrawing();
    } else if (e.key === 'r') {
      // Reset view
      const img = new Image();
      img.src = venue.image;
      img.onload = () => resetView(img);
    }
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
  
  // Handle reset view
  const handleResetView = () => {
    const img = new Image();
    img.src = venue.image;
    img.onload = () => resetView(img);
  };
  
  // Handle course completion
  const handleFinishCourse = () => {
    // Validate course has required elements
    if (courseLines.length === 0) {
      alert('Please draw at least one course line');
      return;
    }
    
    if (!startPoint) {
      alert('Please set a start point');
      return;
    }
    
    if (!finishPoint) {
      alert('Please set a finish point');
      return;
    }
    
    // Create course object
    const course = {
      venueId: venue.id || 'temp-venue-id',
      venueName: venue.name || 'Unnamed Venue',
      courseLines,
      startPoint,
      finishPoint,
      elements,
      coneCount: elements.filter(e => e.type === 'cone').length,
      courseLength: calculateCourseLength()
    };
    
    // Pass to parent component
    if (onCourseComplete) {
      onCourseComplete(course);
    }
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
    <div className="course-designer" tabIndex="0" onKeyDown={handleKeyDown}>
      <div className="drawing-tools">
        <div className="tool-group">
          <h4>Drawing Mode</h4>
          <button 
            className={`tool-button ${drawingMode === 'course' ? 'active' : ''}`}
            onClick={() => setDrawingMode('course')}
          >
            Course Line
          </button>
          <button 
            className={`tool-button ${drawingMode === 'start' ? 'active' : ''}`}
            onClick={() => setDrawingMode('start')}
          >
            Start Point
          </button>
          <button 
            className={`tool-button ${drawingMode === 'finish' ? 'active' : ''}`}
            onClick={() => setDrawingMode('finish')}
          >
            Finish Point
          </button>
        </div>
        
        <div className="tool-group">
          <h4>Course Elements</h4>
          <button 
            className={`tool-button ${drawingMode === 'element' && selectedElement === 'cone' ? 'active' : ''}`}
            onClick={() => {
              setDrawingMode('element');
              setSelectedElement('cone');
            }}
          >
            Cone
          </button>
          <button 
            className={`tool-button ${drawingMode === 'element' && selectedElement === 'slalom' ? 'active' : ''}`}
            onClick={() => {
              setDrawingMode('element');
              setSelectedElement('slalom');
            }}
          >
            Slalom
          </button>
        </div>
        
        <div className="tool-group">
          <h4>Navigation</h4>
          <button 
            className="tool-button"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <span role="img" aria-label="Zoom In">🔍+</span>
          </button>
          <button 
            className="tool-button"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <span role="img" aria-label="Zoom Out">🔍-</span>
          </button>
          <button 
            className="tool-button"
            onClick={handleResetView}
            title="Reset View"
          >
            <span role="img" aria-label="Reset View">🔄</span>
          </button>
        </div>
        
        <div className="tool-group">
          <h4>Actions</h4>
          <button 
            className="button-primary"
            onClick={completeCourseDrawing}
            disabled={currentLine.length < 2}
          >
            Complete Line
          </button>
          <button 
            className="button-danger"
            onClick={clearCourse}
          >
            Clear All
          </button>
          <button 
            className="button-primary"
            onClick={handleFinishCourse}
            disabled={courseLines.length === 0 || !startPoint || !finishPoint}
          >
            Finish Course
          </button>
        </div>
      </div>
      
      <div className="canvas-container" ref={containerRef}>
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="course-canvas"
        />
      </div>
      
      <div className="course-info">
        <h4>Course Statistics</h4>
        <p>Cones: {elements.filter(e => e.type === 'cone').length}</p>
        <p>Course Length: {calculateCourseLength()} meters</p>
        <p className="course-instructions">
          <strong>Navigation:</strong> Hold ALT + drag or use middle mouse button to pan. Use mouse wheel to zoom.
        </p>
      </div>
    </div>
  );
  
  // Helper function to calculate course length
  function calculateCourseLength() {
    let totalLength = 0;
    
    courseLines.forEach(line => {
      for (let i = 1; i < line.length; i++) {
        const dx = line[i].x - line[i-1].x;
        const dy = line[i].y - line[i-1].y;
        totalLength += Math.sqrt(dx*dx + dy*dy);
      }
    });
    
    // Convert to meters (assuming the image has some scale)
    // This would need to be calibrated based on the actual venue size
    return Math.round(totalLength * 0.5);
  }
}

export default CourseDesigner;