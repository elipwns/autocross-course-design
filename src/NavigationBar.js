import React from 'react';
import { Link } from 'react-router-dom';

const NavigationBar = () => {
  return (
    <nav>
      <div className="left">
        <Link to="/">Home</Link>
        <Link to="/CourseDesign">Design a Course</Link>
        <Link to="/voting">Vote</Link>
      </div>
      <div className="right">
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </nav>
  );
};

export default NavigationBar;
