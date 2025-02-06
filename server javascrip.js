const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://https://backend-gw4i.onrender.com/tedpole', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Nodemailer Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Replace with your email
        pass: 'your-email-password',  // Replace with your email password
    },
});

// Routes

// Signup
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000);

        // Send verification email
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: email,
            subject: 'TEDPOLE Verification Code',
            text: `Your verification code is: ${verificationCode}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: 'Failed to send verification code' });
            }
            res.status(200).json({ message: 'Verification code sent', code: verificationCode });
        });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ email: user.email, id: user._id }, 'secret', { expiresIn: '1h' });

        res.status(200).json({ result: user, token });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
