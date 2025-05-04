import React, { useState } from 'react';
import VenueSelector from '../components/VenueSelector';
import CourseDesigner from '../components/CourseDesigner';

/**
 * CourseDesignPage - Main page for the course design workflow
 */
function CourseDesignPage() {
  const [venue, setVenue] = useState(null);
  const [_course, setCourse] = useState(null); // Prefixed with underscore to indicate intentionally unused
  const [step, setStep] = useState('venue'); // 'venue', 'design', 'save'
  
  // Handle venue selection
  const handleVenueSelected = (selectedVenue) => {
    setVenue(selectedVenue);
    setStep('design');
  };
  
  // Handle course completion
  const handleCourseComplete = (completedCourse) => {
    setCourse(completedCourse);
    setStep('save');
  };
  
  // Handle saving the course
  const handleSaveCourse = () => {
    // This would connect to your backend to save the course
    alert('Course saved successfully!');
    // Reset to start a new course
    setStep('venue');
    setVenue(null);
    setCourse(null);
  };
  
  // Render the appropriate step
  const renderStep = () => {
    switch (step) {
      case 'venue':
        return <VenueSelector onVenueSelected={handleVenueSelected} />;
      case 'design':
        return <CourseDesigner venue={venue} onCourseComplete={handleCourseComplete} />;
      case 'save':
        return (
          <div className="course-save">
            <h2>Save Your Course</h2>
            <div className="form-group">
              <label htmlFor="course-name">Course Name:</label>
              <input 
                type="text" 
                id="course-name" 
                placeholder="Enter a name for your course"
              />
            </div>
            <div className="form-group">
              <label htmlFor="course-description">Description:</label>
              <textarea 
                id="course-description" 
                placeholder="Describe your course"
                rows="3"
              />
            </div>
            <button className="button-primary" onClick={handleSaveCourse}>
              Save Course
            </button>
            <button className="button-secondary" onClick={() => setStep('design')}>
              Back to Editor
            </button>
          </div>
        );
      default:
        return <div>Unknown step</div>;
    }
  };
  
  return (
    <div className="course-design-page">
      <h1>Course Design</h1>
      
      {/* Progress indicator */}
      <div className="progress-steps">
        <div className={`step ${step === 'venue' ? 'active' : ''} ${step === 'design' || step === 'save' ? 'completed' : ''}`}>
          1. Select Venue
        </div>
        <div className={`step ${step === 'design' ? 'active' : ''} ${step === 'save' ? 'completed' : ''}`}>
          2. Design Course
        </div>
        <div className={`step ${step === 'save' ? 'active' : ''}`}>
          3. Save Course
        </div>
      </div>
      
      {/* Current step content */}
      <div className="step-content">
        {renderStep()}
      </div>
    </div>
  );
}

export default CourseDesignPage;