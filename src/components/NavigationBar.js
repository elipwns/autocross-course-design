import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';

function NavigationBar() {
  const { user, isAdmin, signOut } = useContext(AuthContext);

  const displayName = user?.signInDetails?.loginId?.split('@')[0] ?? user?.username;

  return (
    <nav className="navigation-bar">
      <div className="nav-logo">
        <Link to="/">Autocross Course Designer</Link>
      </div>
      <div className="nav-links">
        <Link to="/">Events</Link>
        <Link to="/design">Design Course</Link>
        <Link to="/voting">Vote</Link>
        {isAdmin && <Link to="/events/new">+ New Event</Link>}
        {user ? (
          <>
            <span className="nav-divider" />
            <span className="user-greeting">{displayName}</span>
            <button onClick={signOut} className="sign-out-button">Sign Out</button>
          </>
        ) : (
          <Link to="/">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default NavigationBar;
