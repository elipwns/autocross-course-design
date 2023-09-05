import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Homepage from './Homepage';
import Voting from './Voting';
import CourseDesign from './CourseDesign';
import NavigationBar from './NavigationBar';

function App() {
  return (
    <Router>
      <NavigationBar />
      <Routes>
        <Route path="/" element={<Homepage/>} />
        <Route path="/CourseDesign" element={<CourseDesign/>} />
        <Route path="/voting" element={<Voting/>} />
        <Route path="/login" element={<Homepage/>} />
        <Route path="/register" element={<Homepage/>} />
      </Routes>
    </Router>
  );
}

export default App;
