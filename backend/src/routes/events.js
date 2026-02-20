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
  check('startDate', 'Start Date is required').not().isEmpty(),
  check('endDate', 'End Date is required').not().isEmpty(),
  check('totalTickets', 'Ticket count is required').isNumeric(),
  check('location.address', 'Location address is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description, category, startDate, endDate, location, price, totalTickets, ticketType, poster } = req.body;

    const newEvent = new Event({
      host: req.user.id,
      name,
      description,
      category,
      startDate,
      endDate,
      location, // Expecting { address, lat, lng }
      price: ticketType === 'Free' ? 0 : price,
      ticketType,
      totalTickets,
      inventory: totalTickets, // Initial inventory equals total tickets
      poster
    });

    const event = await newEvent.save();
    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('host', ['name', 'email', 'profilePicture']);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    res.json(event);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Event not found' });
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
    const events = await Event.find().sort({ startDate: 1 });
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ msg: 'Event not found' });

    // Check user
    if (event.host.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await event.deleteOne();

    res.json({ msg: 'Event removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Event not found' });
    res.status(500).send('Server Error');
  }
});

module.exports = router;