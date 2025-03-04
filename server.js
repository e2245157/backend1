require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const { calculateCarbonFootprint } = require("./services/climatiqService");

const app = express();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'carbon_footprint_counter'
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Middleware
app.use(express.json());
app.use(cors());

// Sample Route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Route to Calculate Carbon Footprint
app.post("/carbon-footprint", async (req, res) => {
  console.log("POST /carbon-footprint route hit");
  try {
    const activityData = {
      emission_factor: {
      activity_id: "electricity-supply_grid-source_supplier_mix",
      region: "GB",
      data_version: "20.20",
    },
    parameters: {
      energy: 4200,
      energy_unit: "kWh",
    },
    };

    const result = await calculateCarbonFootprint(activityData);
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

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Check if email already exists
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

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Insert new user into database
        const [result] = await pool.query(
            'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
            [email, password_hash, first_name, last_name]
        );

        // Return success response
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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});