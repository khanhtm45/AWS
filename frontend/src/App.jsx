import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        {/* Thêm các Route mới của dự án ở đây */}
        {/* <Route path="/" element={<HomePage />} /> */}
        {/* <Route path="/about" element={<AboutPage />} /> */}
      </Routes> 
    </Router>
  );
}

export default App;