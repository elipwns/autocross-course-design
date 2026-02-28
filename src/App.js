import './styles/App.css';
import './styles/CourseDesign.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useEffect, useState } from 'react';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { createContext, useContext } from 'react';
import NavigationBar from './components/NavigationBar';
import EventCalendarPage from './pages/EventCalendarPage';
import EventCreationPage from './pages/EventCreationPage';
import VotingPage from './pages/VotingPage';
import CourseDesignPage from './pages/CourseDesignPage';
import VenueManagementPage from './pages/VenueManagementPage';

export const AuthContext = createContext(null);

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isLoading, isAdmin } = useContext(AuthContext);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return children;
}

function App({ signOut, user: initialUser }) {
  const [user, setUser] = useState(initialUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload?.['cognito:groups'] ?? [];
        setIsAdmin(groups.includes('Admin'));
      } catch (err) {
        setUser(null);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkUser();
  }, [initialUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, signOut }}>
      <Router>
        <NavigationBar />
        <Routes>
          <Route path="/" element={<EventCalendarPage />} />
          <Route
            path="/events/new"
            element={
              <ProtectedRoute adminOnly>
                <EventCreationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/design/:eventId"
            element={
              <ProtectedRoute>
                <CourseDesignPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/design"
            element={
              <ProtectedRoute>
                <CourseDesignPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/voting/:eventId"
            element={
              <ProtectedRoute>
                <VotingPage />
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
          <Route
            path="/venues"
            element={
              <ProtectedRoute adminOnly>
                <VenueManagementPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default withAuthenticator(App);
