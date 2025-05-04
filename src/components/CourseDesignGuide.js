import React from 'react';

/**
 * CourseDesignGuide component - Provides step-by-step guidance for course design
 */
function CourseDesignGuide({ courseLines, startPoint, finishPoint, currentLine, onCompleteLineClick, onSelectTool }) {
  // Check completion status of each step
  const hasStartPoint = !!startPoint;
  const hasFinishPoint = !!finishPoint;
  const hasCompletedLines = courseLines.length > 0;
  const isCurrentlyDrawing = currentLine.length > 0;
  
  // Calculate overall completion percentage
  const totalSteps = 3; // Start, Finish, Course Lines
  const completedSteps = 
    (hasStartPoint ? 1 : 0) + 
    (hasFinishPoint ? 1 : 0) + 
    (hasCompletedLines ? 1 : 0);
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100);
  
  return (
    <div className="course-design-guide">
      <h3>Course Design Steps</h3>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${completionPercentage}%` }}
        ></div>
        <span className="progress-text">{completionPercentage}% Complete</span>
      </div>
      
      <ul className="design-steps">
        <li className={hasStartPoint ? 'completed' : (isCurrentlyDrawing ? 'disabled' : '')}>
          <div className="step-number">{hasStartPoint ? '✓' : '1'}</div>
          <div className="step-content">
            <h4>Set Start Point</h4>
            <p>Click the "Start Point" button, then click on the map to place the starting position.</p>
            {!hasStartPoint && (
              <button 
                className="mini-button"
                onClick={() => onSelectTool('start')}
              >
                Select Start Tool
              </button>
            )}
          </div>
        </li>
        
        <li className={hasFinishPoint ? 'completed' : (!hasStartPoint ? 'disabled' : '')}>
          <div className="step-number">{hasFinishPoint ? '✓' : '2'}</div>
          <div className="step-content">
            <h4>Set Finish Point</h4>
            <p>Click the "Finish Point" button, then click on the map to place the finish line.</p>
            {hasStartPoint && !hasFinishPoint && (
              <button 
                className="mini-button"
                onClick={() => onSelectTool('finish')}
              >
                Select Finish Tool
              </button>
            )}
          </div>
        </li>
        
        <li className={completedSteps === totalSteps ? 'completed' : 'disabled'}>
          <div className="step-number">{completedSteps === totalSteps ? '✓' : '3'}</div>
          <div className="step-content">
            <h4>Add Course Elements</h4>
            <p>Add cones, slaloms, and other elements to complete your course design.</p>
            {hasStartPoint && hasFinishPoint && (
              <button 
                className="mini-button"
                onClick={() => onSelectTool('element')}
              >
                Select Elements Tool
              </button>
            )}
          </div>
        </li>
        
        <li className={hasCompletedLines ? 'completed' : (isCurrentlyDrawing ? 'in-progress' : '')}>
          <div className="step-number">{hasCompletedLines ? '✓' : '4'}</div>
          <div className="step-content">
            <h4>Draw Course Path</h4>
            <p>Click the "Course Line" button, then click and drag to draw the driving path. Double-click to finish the line.</p>
            {isCurrentlyDrawing && <span className="status-badge">Drawing...</span>}
            {isCurrentlyDrawing && (
              <button 
                className="mini-button"
                onClick={onCompleteLineClick}
              >
                Complete Line
              </button>
            )}
            {!hasCompletedLines && !isCurrentlyDrawing && (
              <button 
                className="mini-button"
                onClick={() => onSelectTool('course')}
              >
                Select Course Tool
              </button>
            )}
          </div>
        </li>
      </ul>
      
      {completedSteps === totalSteps && (
        <div className="completion-message">
          <h4>Course Design Complete!</h4>
          <p>You can now save your course or continue adding elements.</p>
        </div>
      )}
    </div>
  );
}

export default CourseDesignGuide;