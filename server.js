require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { calculateCarbonFootprint } = require("./services/climatiqService");

const app = express();

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
    // Sample input: Electricity consumption (4200 kWh in the UK)
    const activityData = {
      emission_factor: {
        activity_id: "electricity-supply_grid-source_supplier_mix", // Updated ID
        region: "GB", // UK
        data_version: "20.20", // Latest version per error
      },
      parameters: {
        energy: 4200, // kWh
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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});