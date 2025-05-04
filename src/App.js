import './styles/App.css';
import './styles/CourseDesign.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavigationBar from './components/NavigationBar';
import Homepage from './pages/Homepage';
import VotingPage from './pages/VotingPage';
import CourseDesignPage from './pages/CourseDesignPage';

/**
 * Main App component - Sets up routing and layout
 */
function App() {
  return (
    <Router>
      <NavigationBar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/CourseDesign" element={<CourseDesignPage />} />
        <Route path="/voting" element={<VotingPage />} />
        <Route path="/login" element={<Homepage />} /> {/* Placeholder until login is implemented */}
        <Route path="/register" element={<Homepage />} /> {/* Placeholder until registration is implemented */}
      </Routes>
    </Router>
  );
}

export default App;