import './styles/App.css';
import './styles/CourseDesign.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import NavigationBar from './components/NavigationBar';
import Homepage from './pages/Homepage';
import VotingPage from './pages/VotingPage';
import CourseDesignPage from './pages/CourseDesignPage';

/**
 * AuthContext to provide user authentication state throughout the app
 */
import { createContext, useContext } from 'react';
export const AuthContext = createContext(null);

/**
 * Protected route component that redirects to login if not authenticated
 */
function ProtectedRoute({ children }) {
  const { user, isLoading } = useContext(AuthContext);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

/**
 * Main App component - Sets up routing and layout
 */
function App({ signOut, user: initialUser }) {
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check authentication status
    async function checkUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkUser();
  }, [initialUser]);
  
  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      <Router>
        <NavigationBar />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route 
            path="/CourseDesign" 
            element={
              <ProtectedRoute>
                <CourseDesignPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/voting" 
            element={
              <ProtectedRoute>
                <VotingPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<Homepage />} /> {/* Placeholder until login is implemented */}
          <Route path="/register" element={<Homepage />} /> {/* Placeholder until registration is implemented */}
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default withAuthenticator(App);
