const axios = require("axios");

const CLIMATIQ_API_URL = "https://api.climatiq.io/data/v1/estimate";
const API_KEY = process.env.CLIMATIQ_API_KEY;

const calculateCarbonFootprint = async (activityData) => {
  try {
    const response = await axios.post(CLIMATIQ_API_URL, activityData, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error fetching emission data"
    );
  }
};

module.exports = { calculateCarbonFootprint };