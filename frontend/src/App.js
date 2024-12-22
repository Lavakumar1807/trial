import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import FrameworkSelection from './components/FrameworkSelection';
import FetchFiles from './components/FetchFiles';

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
                <Route path="/" element={<FrameworkSelection />} />
                <Route path="/editor/:frameworkname/:foldername" element={<FetchFiles />} />
               
               
            </Routes>
        </Router>
    );
}

export default App;
