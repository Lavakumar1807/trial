import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import FrameworkSelection from './components/FrameworkSelection';
import FetchFiles from './components/FetchFiles';
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";

// const resizeObserverLoopErr = (err) => {
//     if (
//       err.message ===
//       "ResizeObserver loop completed with undelivered notifications"
//     ) {
//       return;
//     }
//     throw err;
//   };
  
//   window.addEventListener("error", resizeObserverLoopErr);
  

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path='/:username' element={<FrameworkSelection/>} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/:username/editor/:frameworkname/:foldername" element={<FetchFiles />} />
            </Routes>
        </Router>
    );
}

export default App;
