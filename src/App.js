// import logo from './logo.svg';
import './App.css';
// import { render } from "react-dom";
import { BrowserRouter, Route, Link, Routes } from 'react-router-dom';
import Homepage from './Homepage';
import Voting from './Voting';
import CourseDesign from './CourseDesign';

// const Homepage = () => <div>Home Page</div>;
// const Voting = () => <div>Voting Page</div>;
// const CourseDesign = () => <div>Course Design Page</div>;


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

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

export default App;
