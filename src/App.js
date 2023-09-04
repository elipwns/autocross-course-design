import './App.css';
import { BrowserRouter, Route, Link, Routes } from 'react-router-dom';
import Homepage from './Homepage';
import Voting from './Voting';
import CourseDesign from './CourseDesign';

function App() {
  return (
    <BrowserRouter>
      <div>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/CourseDesign">Course Design</Link>
          </li>
          <li>
            <Link to="/voting">Voting</Link>
          </li>
        </ul>

        <hr />
        <Routes>
          <Route path="/" element={<Homepage/>} />
          <Route path="/CourseDesign" element={<CourseDesign/>} />
          <Route path="/Voting" element={<Voting/>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
