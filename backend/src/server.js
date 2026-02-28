require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db'); 

const app = express();

// Middleware
app.use(express.json()); 
app.use(cors());        
app.use(helmet());       
app.use(morgan('dev'));  

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'EventHive Backend is running' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));

if (require.main === module) {
  connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; 