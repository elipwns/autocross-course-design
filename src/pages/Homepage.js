import React from 'react';

/**
 * Homepage component - Landing page for the application
 */
function Homepage() {
  return (
    <div className="homepage">
      <h1>Welcome to Autocross Course Designer</h1>
      <p>Design, share, and vote on autocross courses for your club events.</p>
      
      <div className="feature-section">
        <div className="feature">
          <h2>Design Courses</h2>
          <p>Create custom autocross courses with our intuitive design tools.</p>
          <ul>
            <li>Upload venue images</li>
            <li>Draw course layouts</li>
            <li>Place cones and elements</li>
            <li>Set start and finish points</li>
          </ul>
        </div>
        
        <div className="feature">
          <h2>Share with Your Club</h2>
          <p>Share your course designs with club members and get feedback.</p>
          <ul>
            <li>Save courses to your profile</li>
            <li>Share with specific members</li>
            <li>Export as images</li>
          </ul>
        </div>
        
        <div className="feature">
          <h2>Vote on Favorites</h2>
          <p>Vote on course designs to help choose the best for your next event.</p>
          <ul>
            <li>Browse submitted courses</li>
            <li>Vote on your favorites</li>
            <li>Comment and provide feedback</li>
          </ul>
        </div>
      </div>
      
      <div className="cta-section">
        <h2>Ready to get started?</h2>
        <div className="cta-buttons">
          <a href="/CourseDesign" className="button-primary">Design a Course</a>
          <a href="/voting" className="button-secondary">Vote on Courses</a>
        </div>
      </div>
    </div>
  );
}

export default Homepage;