
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CalculatorPage from './pages/CalculatorPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<CalculatorPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
};

export default App;
