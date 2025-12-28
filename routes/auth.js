const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const User = require('../models/User'); 
const PendingUser = require('../models/PendingUser'); // ✅ Fixed: Now Imported!

const router = express.Router();

// 1. Configure Email Sender (Fallback Mode)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,              // Back to standard port
  secure: false,          // Use STARTTLS (False for 587)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // ⚠️ Allow connection even if certs fail
  },
  connectionTimeout: 10000, // Wait only 10 seconds
  greetingTimeout: 5000,    // Wait 5 seconds for hello
  socketTimeout: 10000,     // Wait 10 seconds for data
  family: 4                 // Force IPv4
});

// ==========================================
// 1. SIGNUP -> Saves to "PendingUser"
// ==========================================
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // A. Check if they are already a REAL user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists. Please Login." });
    }

    // B. Hash Password & Generate OTP
    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // C. Save to PENDING collection (The Waiting Room)
    // If they tried before but failed, overwrite the old pending entry
    await PendingUser.findOneAndDelete({ email }); 
    
    const newPending = new PendingUser({
      username,
      email,
      password: hashedPassword,
      otp: otpCode
    });
    
    await newPending.save();

    // D. Send Email
    await transporter.sendMail({
      from: '"Cozy Kitchen" <geethan0503@gmail.com>',
      to: email,
      subject: "Verify your Account",
      text: `Your verification code is: ${otpCode}`
    });

    res.status(200).json({ message: "OTP sent! Please verify to complete signup." });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Error during signup" });
  }
});

// ==========================================
// 2. VERIFY -> Moves to "User"
// ==========================================
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    // A. Find in the WAITING ROOM
    const pendingUser = await PendingUser.findOne({ email });
    
    if (!pendingUser) {
      return res.status(400).json({ message: "Code expired or invalid email. Please sign up again." });
    }

    // B. Check OTP
    if (pendingUser.otp !== otp) {
      return res.status(400).json({ message: "Invalid Code ❌" });
    }

    // C. 🎉 SUCCESS! Move them to the Real Database
    const newUser = new User({
      username: pendingUser.username,
      email: pendingUser.email,
      password: pendingUser.password,
      isVerified: true,
      favorites: [] 
    });

    await newUser.save();

    // D. Delete from Waiting Room (Cleanup)
    await PendingUser.deleteOne({ email });

    res.status(200).json({ message: "Account verified successfully!" });

  } catch (err) {
    console.error("Verify Error:", err);
    res.status(500).json({ message: "Server error during verification" });
  }
});

// ==========================================
// 3. LOGIN ROUTE
// ==========================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Double check verification (Safety net)
    if (!user.isVerified) {
       return res.status(400).json({ message: "Please verify your email first!" });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate Token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'secretkey123', 
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// 4. FORGOT PASSWORD (Send OTP)
// ==========================================
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate & Save new OTP to the EXISTING user
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otpCode;
    await user.save();

    await transporter.sendMail({
      from: '"Cozy Kitchen" <geethan0503@gmail.com>',
      to: email,
      subject: "Reset Password - Cozy Kitchen",
      text: `Your Password Reset Code is: ${otpCode}`
    });

    res.status(200).json({ message: "OTP sent to your email." });
  } catch (err) {
    res.status(500).json({ message: "Error sending email" });
  }
});

// ==========================================
// 5. RESEND OTP (Smart Logic: Checks Pending OR Real User)
// ==========================================
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  try {
    // A. If they are already a REAL user, they don't need a signup code
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Account already verified. Please login." });
    }

    // B. Find them in the WAITING ROOM
    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) {
      return res.status(400).json({ message: "No pending signup found. Please sign up first." });
    }

    // C. Update their code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    pendingUser.otp = otpCode;
    await pendingUser.save();

    // D. Send Email
    await transporter.sendMail({
      from: '"Cozy Kitchen" <geethan0503@gmail.com>',
      to: email,
      subject: "New Verification Code",
      text: `Your new verification code is: ${otpCode}`
    });

    res.status(200).json({ message: "New code sent to your email!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending email" });
  }
});

// ==========================================
// 6. RESET PASSWORD (Verify OTP & Change)
// ==========================================
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid Code" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    user.password = hashedPassword;
    user.otp = undefined; 
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error resetting password" });
  }
});

module.exports = router;