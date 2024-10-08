const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors'); // นำเข้า cors
const jwt = require('jsonwebtoken'); // สำหรับ JWT
const multer = require('multer'); // สำหรับการอัปโหลดไฟล์
const xlsx = require('xlsx'); // สำหรับการอ่านไฟล์ Excel
const app = express();

// กำหนดตัวเลือก CORS
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],  // เพิ่ม Authorization และ Headers ที่จำเป็น
    credentials: true,
};

// ใช้ bodyParser และ cors
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions)); 
app.options('*', cors(corsOptions)); // ใช้ cors กับตัวเลือกที่กำหนด

// สร้างการเชื่อมต่อกับฐานข้อมูล MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',  // ใส่รหัสผ่าน MySQL ของคุณที่นี่
    database: 'userdb'
});

// ตรวจสอบการเชื่อมต่อฐานข้อมูล
db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database');
});

// Middleware สำหรับตรวจสอบสถานะการเข้าสู่ระบบ
const checkAuth = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access. Please log in.' });
    }
    jwt.verify(token.split(' ')[1], 'your_jwt_secret', (err, decoded) => { 
        if (err) {
            return res.status(401).json({ message: 'Unauthorized access. Please log in.' });
        }
        req.userId = decoded.id; // เก็บ userId สำหรับใช้งานใน route ถัดไป
        next();
    });
};

// Endpoint สำหรับการสมัครสมาชิก (Register)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(sql, [username, hashedPassword], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error registering user' });
        }
        res.json({ message: 'User registered successfully' });
    });
});

// Endpoint สำหรับการเข้าสู่ระบบ (Login)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error logging in' });
        }
        if (results.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        // สร้าง JWT Token
        const token = jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    });
});

// เริ่มต้นอัปโหลดไฟล์ Excel ด้วย Multer
const storage = multer.memoryStorage(); // เก็บไฟล์ใน memory เพื่ออ่านได้ทันที
const upload = multer({ storage });

// API สำหรับการนำเข้าข้อมูลจากไฟล์ Excel
app.post('/import', checkAuth, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // ตรวจสอบโครงสร้างข้อมูล
    if (!worksheet.length || !worksheet[0].date || !worksheet[0].patient_data) {
        return res.status(400).json({ message: 'Invalid data format in JSON' });
    }

    const query = 'INSERT INTO data (date, patient_data) VALUES (?, ?)';
    const promises = worksheet.map(row => {
        return new Promise((resolve, reject) => {
            db.query(query, [row.date, row.patient_data], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    });

    Promise.all(promises)
        .then(() => {
            res.json({ message: 'Data imported successfully' });
        })
        .catch(err => {
            console.error('Error inserting data:', err);
            res.status(500).json({ message: 'Failed to import data' });
        });
});

// Endpoints สำหรับหน้า Dashboard, More
app.get('/dashboard', checkAuth, (req, res) => {
    res.json({ message: 'Dashboard page' });
});

// app.get('/more', checkAuth, (req, res) => {
//     res.json({ message: 'More page' });
// });

// Route สำหรับดึงข้อมูลจากตาราง data
app.get('/getdata', (req, res) => {
    const sql = 'SELECT * FROM data'; // ดึงข้อมูลจากตาราง 'data'
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ message: 'Failed to fetch data' });
        }
        res.json(results); // ส่งข้อมูลในรูปแบบ JSON กลับไปที่ Frontend
    });
});

// เริ่มต้นเซิร์ฟเวอร์
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
