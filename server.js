require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const { calculateCarbonFootprint } = require("./services/climatiqService");
const morgan = require('morgan');

const app = express();

// Check for required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));

// Sample Route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Route to Calculate Carbon Footprint
app.post("/carbon-footprint", async (req, res) => {
  console.log("POST /carbon-footprint route hit");
  try {
    const { emission_factor, parameters } = req.body;
    if (!emission_factor || !parameters) {
      return res.status(400).json({ error: "Invalid input data" });
    }
    const result = await calculateCarbonFootprint({ emission_factor, parameters });
    res.json({
      message: "Carbon footprint calculated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Signup Endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
      [email, password_hash, first_name, last_name]
    );
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: result.insertId,
        email,
        first_name,
        last_name
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong'
  });
});

// Start Server only after DB connection
const PORT = process.env.PORT || 5000;
pool.getConnection()
  .then(connection => {
    console.log('Connected to the database');
    connection.release();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  });