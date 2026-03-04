const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth'); // Import our security guard
const Event = require('../models/Event');

// @route   POST /api/events
// @desc    Create a new event
// @access  Private (Login Required)
router.post('/', [auth, [
  check('name', 'Name is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('date', 'Date is required').not().isEmpty(),
  check('totalTickets', 'Ticket count is required').isNumeric()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const newEvent = new Event({
      host: req.user.id, // Comes from the middleware
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      date: req.body.date,
      location: req.body.location,
      price: req.body.price,
      totalTickets: req.body.totalTickets,
      poster: req.body.poster
    });

    const event = await newEvent.save();
    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/events
// @desc    Get all events
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Return all events, sorted by newest first
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;