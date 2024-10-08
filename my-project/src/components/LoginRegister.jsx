import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // เพิ่มการใช้ useNavigate

const LoginRegister = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [registerError, setRegisterError] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const navigate = useNavigate(); // สร้างตัวแปร navigate

  useEffect(() => {
    // ตรวจสอบว่า token มีอยู่หรือไม่
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard'); // ถ้ามี token ให้เปลี่ยนเส้นทางไปที่ Dashboard
    }
  }, [navigate]);

  // ฟังก์ชันการเข้าสู่ระบบ
  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json(); // ดึงข้อมูล token จาก response
        localStorage.setItem('token', data.token); // บันทึก token ลง localStorage
        localStorage.setItem('username', username);
        onLogin(); // เรียกฟังก์ชันจาก props เพื่อแจ้งว่าผู้ใช้ล็อกอินสำเร็จ
        navigate('/dashboard'); // เปลี่ยนเส้นทางไปยังหน้า Dashboard
      } else {
        setLoginError(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setLoginError(true);
    }
  };

  // ฟังก์ชันการลงทะเบียน
  const handleRegister = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });

      if (response.ok) {
        setRegisterSuccess(true);
        setRegisterError(false);

        setTimeout(() => {
            setRegisterSuccess(false);
          }, 1500);

      } else {
        setRegisterError(true);
        setRegisterSuccess(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setRegisterError(true);
      setRegisterSuccess(false);
    }
  };

  // ฟังก์ชันการออกจากระบบ
  const handleLogout = () => {
    localStorage.removeItem('token'); // ลบ token ออกจาก localStorage
    onLogin(); // เรียกฟังก์ชันเพื่ออัปเดตสถานะผู้ใช้
    navigate('/'); // เปลี่ยนเส้นทางไปยังหน้าหลัก
  };

  return (
    <div class="login-register-container">
      {isLogin ? (
        <form id="loginForm" onSubmit={handleLogin}>
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
          {loginError && <p style={{ color: 'red' }}>Login failed!</p>}
          <p onClick={() => setIsLogin(false)} className="register-link" style={{ color: 'white', cursor: 'pointer' }}>Don't have an account? Register</p>
        </form>
      ) : (
        <form id="registerForm" onSubmit={handleRegister}>
          <h2>Register</h2>
          <input
            type="text"
            placeholder="New Username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit">Register</button>
          {registerError && <p style={{ color: 'red' }}>Registration failed!</p>}
          {registerSuccess && <p style={{ color: 'green' }}>Registration successful!</p>}
          <p onClick={() => setIsLogin(true)} className="login-link" style={{ color: 'white',cursor: 'pointer' }}>Already have an account? Login</p>
        </form>
      )}
      {/* ปุ่มสำหรับออกจากระบบ */}
      {/* <button onClick={handleLogout}>Logout</button> */}
    </div>
  );
};

export default LoginRegister;
