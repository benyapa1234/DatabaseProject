import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from "./components/Navbar";
import LoginRegister from "./components/LoginRegister";
import Import from './components/Import';
import Dashboard from "./components/Dashboard";
import "./styles.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่า token มีอยู่ใน localStorage หรือไม่
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true); // หากมี token ให้ตั้งสถานะเป็น logged in
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // ลบ token เมื่อ Logout
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<LoginRegister onLogin={handleLogin} />} />
        <Route path="/import" element={isLoggedIn ? <Import /> : <LoginRegister onLogin={handleLogin} />} />
        <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <LoginRegister onLogin={handleLogin} />} />
      </Routes>
    </Router>
  );
}

export default App;
