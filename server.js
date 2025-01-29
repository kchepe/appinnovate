const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const bcrypt = require('bcrypt'); // For password hashing
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'client' instead of 'public'
app.use(cookieParser()); // Middleware for handling cookies

const SECRET_KEY = 'your_secret_key';


// Database connection
//production
const db = mysql.createPool({
    host: 'monorail.proxy.rlwy.net',
    user: 'root',
    password: 'qRJoxjVJmCXuUVpRvvyVXsIzwPmqtFWM',
    database: 'railway',
    port: 17679,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

setInterval(() => {
    db.query('SELECT 1', (err) => {
        if (err) console.error('Error keeping connection alive:', err);
    });
}, 30000);

db.on('error', (err) => {
    console.error('Database connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Reconnecting to the database...');
        db = mysql.createPool(db.config);
    }
});


// development
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'admin', // Change according to your MySQL setup
//     database: 'app'
// });

// db.connect(err => {
//     if (err) {
//      throw err
//     };
//     console.log('Connected to MySQL database');
// });



const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service (Gmail, Outlook, etc.)
    auth: {
        user: 'sappinnovate@gmail.com', // Replace with your email
        pass: 'tmvb eesk sbac nmlk'   // Replace with your app password
    }
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

        const sql = 'INSERT INTO users (firstname, lastname, email, password, isAdmin) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [firstname, lastname, email, hashedPassword, false], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error saving user');
            }
            res.status(200).send('Registration successful!');
        });
    });
});

//current user endpoint
app.get('/me', (req, res) => {
    const token = req.cookies.authToken; // Get token from cookies

    if (!token) {
        return res.status(401).send('Unauthorized');
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).send('Invalid token');
        }
        res.json({ userId: decoded.userId, email: decoded.email, firstname: decoded.firstname, lastname: decoded.lastname, isAdmin: decoded.isAdmin});
    });
});
// Logout endpoint
app.post('/logout', (req, res) => {
    res.clearCookie('authToken'); // Remove the token
    res.send('Logged out successfully');
});


// contact us ednpoint
app.post('/contact-us', (req, res) => {
    const { fullname, email, budget, description, contact_number } = req.body;

    if (!fullname || !email || !budget || !description || !contact_number) {
        return res.status(400).send('All fields are required');
    }

    const sql = 'INSERT INTO contacts (fullname, email, budget, description, contact_number) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [fullname, email, budget, description, contact_number], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error saving contact details');
        }

        // Send confirmation email
        const mailOptions = {
            from: '"AppInnovate Solutions" <your_email@gmail.com>',
            to: email, // Send email to the user
            subject: 'Contact Request Received',
            html: `
                <p>Hello <strong>${fullname}</strong>,</p>
                <p>Thank you for reaching out! We have received your inquiry and will get back to you soon.</p>
                <p><strong>Details:</strong></p>
                <ul>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Contact Number:</strong> ${contact_number}</li>
                    <li><strong>Budget:</strong> ${budget}</li>
                    <li><strong>Description:</strong> ${description}</li>
                </ul>
                <p>Best regards,<br>AppInnovate Solutions</p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('Error sending confirmation email');
            }
            console.log('Email sent:', info.response);
            res.status(200).send('Contact details submitted successfully!');
        });
    });
});

app.get('/contacts', (req, res) => {
    const token = req.cookies.authToken; // Get token from cookies

    if (!token) {
        return res.status(401).send('Unauthorized');
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        const { email, isAdmin } = decoded;
        if (err) {
            return res.status(403).send('Invalid token');
        }

        // Adjust SQL query based on whether the user is an admin or not
        let sql = 'SELECT * FROM contacts ORDER BY createdAt DESC'; // Default query to fetch all contacts
        if (!isAdmin) {
            sql = 'SELECT * FROM contacts WHERE email = ? ORDER BY createdAt DESC'; // Fetch contacts for the user's email if not admin
        }

        db.query(sql, isAdmin ? [] : [email], (err, results) => {
            if (err) {
                console.error('Error fetching contacts:', err);
                return res.status(500).send('Error fetching contacts');
            }

            res.status(200).json(results);
        });
    });
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
                const token = jwt.sign({ userId: result[0].id, email, firstname: result[0].firstname, lastname: result[0].lastname, isAdmin: result[0].isAdmin}, SECRET_KEY, { expiresIn: '1h' });

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

// Start server development
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));