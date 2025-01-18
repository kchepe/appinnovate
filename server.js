const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const bcrypt = require('bcrypt'); // For password hashing

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'client' instead of 'public'
app.use(cookieParser()); // Middleware for handling cookies

const SECRET_KEY = 'your_secret_key';

// Database connection
//production
const db = mysql.createConnection({
    host: 'mysql.railway.internal',
    user: 'root',
    password: 'qRJoxjVJmCXuUVpRvvyVXsIzwPmqtFWM', // Change according to your MySQL setup
    database: 'railway'
});

// development
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'admin', // Change according to your MySQL setup
//     database: 'app'
// });

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Correct path
});

// Registration endpoint
app.post('/register', (req, res) => {
    const { firstname, lastname, email, password } = req.body;

    if (!firstname || !lastname || !email || !password) {
        return res.status(400).send('All fields are required');
    }

    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error hashing password');
        }

        const sql = 'INSERT INTO users (firstname, lastname, email, password) VALUES (?, ?, ?, ?)';
        db.query(sql, [firstname, lastname, email, hashedPassword], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error saving user');
            }
            res.status(200).send('Registration successful!');
        });
    });
});

app.get('/me', (req, res) => {
    const token = req.cookies.authToken; // Get token from cookies

    if (!token) {
        return res.status(401).send('Unauthorized');
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).send('Invalid token');
        }
        res.json({ userId: decoded.userId, email: decoded.email, firstname: decoded.firstname, lastname: decoded.lastname });
    });
});

app.post('/logout', (req, res) => {
    res.clearCookie('authToken'); // Remove the token
    res.send('Logged out successfully');
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching user');
        }

        if (result.length === 0) {
            return res.status(404).send('User not found');
        }

        

        bcrypt.compare(password, result[0].password, (err, isMatch) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error comparing passwords');
            }

    

            if (isMatch) {
                // Create JWT Token
                const token = jwt.sign({ userId: result[0].id, email, firstname: result[0].firstname, lastname: result[0].lastname }, SECRET_KEY, { expiresIn: '1h' });

                // Set token in HTTP-only cookie
                res.cookie('authToken', token, {
                    httpOnly: true,  // Prevents JavaScript from accessing it (security best practice)
                    secure: process.env.NODE_ENV === 'production', // Use only in HTTPS for production
                    sameSite: 'Strict',
                });

                res.status(200).send('Login successful!');
            } else {
                res.status(400).send('Invalid credentials');
            }
        });
    });
});

// Start server
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
