import React from 'react';
import { Link } from 'react-router-dom';

/**
 * NavigationBar component - Main navigation for the application
 */
const NavigationBar = () => {
  return (
    <nav className="navigation-bar">
      <div className="left">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/CourseDesign" className="nav-link">Design a Course</Link>
        <Link to="/voting" className="nav-link">Vote</Link>
      </div>
      <div className="right">
        <Link to="/login" className="nav-link">Login</Link>
        <Link to="/register" className="nav-link">Register</Link>
      </div>
    </nav>
  );
};

export default NavigationBar;