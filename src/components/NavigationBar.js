// src/components/NavigationBar.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';

function NavigationBar() {
  const { user, signOut } = useContext(AuthContext);
  
  return (
    <nav className="navigation-bar">
      <div className="nav-logo">
        <Link to="/">Autocross Course Designer</Link>
      </div>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/CourseDesign">Design Course</Link>
        <Link to="/voting">Vote</Link>
        {user ? (
          <>
            <span className="user-greeting">Hello, {user.username}</span>
            <button onClick={signOut} className="sign-out-button">Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavigationBar;
