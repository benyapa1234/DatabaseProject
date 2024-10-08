import React, { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ isLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(''); // เก็บชื่อผู้ใช้ที่ล็อกอิน

  useEffect(() => {
    // ดึงชื่อผู้ใช้จาก localStorage ถ้ามีการล็อกอิน
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername); // ตั้งค่า username ที่ดึงมา
    }
  }, [isLoggedIn]); // เรียกใช้ useEffect เมื่อ isLoggedIn เปลี่ยนแปลง

  const handleLinkClick = (path) => {
    if (!isLoggedIn && path !== "/") {  // Only show alert for non-login pages
      alert("Please log in to access this page.");
    } else {
      navigate(path);
    }
  };

  if (!isLoggedIn) {
    return null; // Return null เพื่อไม่ให้ render navbar
  }

  return (
    <nav className="navbar">
      <ul>
        {/* แสดง username ด้านซ้ายเมื่อผู้ใช้ล็อกอิน */}
        {isLoggedIn && (
          <li className="username-display">Hello, {username}</li>
        )}
        {/* แสดง Login หรือ Logout ตามสถานะ isLoggedIn */}
        {!isLoggedIn ? (
          <li><Link to="/" onClick={() => handleLinkClick("/")}>Login</Link></li>
        ) : (
          <li><Link to="/" onClick={onLogout}>Logout</Link></li>
        )}
        <li><Link to="/dashboard" onClick={() => handleLinkClick("/dashboard")}>Dashboard</Link></li>
        <li><Link to="/import" onClick={() => handleLinkClick("/import")}>Import</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
