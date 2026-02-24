require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors());         // Enable CORS for React Native
app.use(helmet());       // Security Headers (DevSecOps Best Practice)
app.use(morgan('dev'));  // Logging

// Basic Health Check Route (Vital for DevOps Probes)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'EventHive Backend is running' });
});

// Start Server (only if not in test mode)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; // Export for testing