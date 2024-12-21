import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import FrameworkSelection from './components/FrameworkSelection';
import FetchFiles from './components/FetchFiles';


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
