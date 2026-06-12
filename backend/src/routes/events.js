const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth'); // Import our security guard
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @route   POST /api/events
// @desc    Create a new event
// @access  Private (Login Required)
router.post('/', [auth, [
  check('name', 'Name is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('startDate', 'Start Date is required').not().isEmpty(),
  check('endDate', 'End Date is required').not().isEmpty(),
  check('location.address', 'Location address is required').not().isEmpty(),
  check('totalTickets', 'Ticket count is required').custom((value, { req }) => {
    if (!req.body.isExternalTicket) {
      if (value === undefined || value === null || value === '') {
        throw new Error('Ticket count is required');
      }
      if (isNaN(value)) {
        throw new Error('Ticket count must be numeric');
      }
    }
    return true;
  })
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description, category, startDate, endDate, location, price, totalTickets, ticketType, poster, isExternalTicket, externalTicketUrl, registrationDeadline } = req.body;

    if (registrationDeadline) {
      if (new Date(registrationDeadline) > new Date(startDate)) {
        return res.status(400).json({ errors: [{ msg: 'Registration deadline must be before or equal to the event start date' }] });
      }
    }

    const newEvent = new Event({
      host: req.user.id,
      name,
      description,
      category,
      startDate,
      endDate,
      location, // Expecting { address, lat, lng }
      price: isExternalTicket ? 0 : (ticketType === 'Free' ? 0 : price),
      ticketType: isExternalTicket ? 'Free' : ticketType,
      totalTickets: isExternalTicket ? 0 : totalTickets,
      inventory: isExternalTicket ? 0 : totalTickets, // Initial inventory equals total tickets
      poster,
      isExternalTicket: !!isExternalTicket,
      externalTicketUrl: isExternalTicket ? externalTicketUrl : '',
      registrationDeadline: registrationDeadline || null
    });

    const event = await newEvent.save();

    try {
      // Notify users in the same city
      const CITIES = ['New Delhi', 'Mumbai', 'Bengaluru', 'Pune', 'Hyderabad'];
      const addressLower = location.address ? location.address.toLowerCase() : '';
      const matchedCity = CITIES.find(c => addressLower.includes(c.toLowerCase()));

      if (matchedCity) {
        // Find users in the matched city (excluding the host)
        const usersInCity = await User.find({
          city: { $regex: new RegExp(matchedCity, 'i') },
          _id: { $ne: req.user.id }
        });

        if (usersInCity.length > 0) {
          const notifications = usersInCity.map(u => new Notification({
            user: u._id,
            title: 'New Event in Your City! 📍',
            message: `A new event "${name}" has been posted in ${matchedCity}. Check it out!`,
            type: 'general',
            relatedId: event._id
          }));
          await Notification.insertMany(notifications);
        }
      }
    } catch (notifErr) {
      console.error('Failed to trigger city notifications:', notifErr.message);
    }

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
    const event = await Event.findById(req.params.id).populate('host', ['name', 'email', 'profilePicture', 'userType']);
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
    const events = await Event.find().populate('host', ['name', 'email', 'profilePicture', 'userType']).sort({ startDate: 1 });
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

    // Find all bookings for this event to notify guests
    const bookings = await Booking.find({ event: req.params.id, status: 'Confirmed' });
    if (bookings.length > 0) {
      const notifications = bookings.map(b => new Notification({
        user: b.user,
        title: 'Event Cancelled ⚠️',
        message: `Notice: The event "${event.name}" has been cancelled by the host.`,
        type: 'event_cancelled',
        relatedId: event._id
      }));
      await Notification.insertMany(notifications);
    }

    await event.deleteOne();

    res.json({ msg: 'Event removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Event not found' });
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/events/:id/guests
// @desc    Get all bookings/guests for an event
// @access  Private
router.get('/:id/guests', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    // Check if the requester is the host
    if (event.host.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const guests = await Booking.find({ event: req.params.id }).populate('user', ['name', 'email', 'profilePicture']);
    res.json(guests);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Event not found' });
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/events/:id/checkin
// @desc    Check in a guest by ticket code
// @access  Private
router.post('/:id/checkin', auth, async (req, res) => {
  try {
    const { ticketCode } = req.body;
    if (!ticketCode) return res.status(400).json({ msg: 'Ticket code is required' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    if (event.host.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const booking = await Booking.findOne({ event: req.params.id, ticketCode });
    if (!booking) {
      return res.status(404).json({ msg: 'Invalid ticket for this event' });
    }

    if (booking.checkedIn) {
      return res.status(400).json({ msg: 'Guest is already checked in' });
    }

    booking.checkedIn = true;
    await booking.save();
    await booking.populate('user', ['name', 'email', 'profilePicture']);

    // Create notifications for check-in
    // 1. Notification for the guest
    const guestNotification = new Notification({
      user: booking.user._id,
      title: 'Checked In Successfully! ✅',
      message: `You have successfully checked in to "${event.name}". Enjoy the event!`,
      type: 'check_in',
      relatedId: booking._id
    });
    await guestNotification.save();

    // 2. Notification for the host
    const hostNotification = new Notification({
      user: req.user.id,
      title: 'Guest Checked In 👥',
      message: `${booking.user.name} has checked in to your event "${event.name}".`,
      type: 'check_in',
      relatedId: booking._id
    });
    await hostNotification.save();

    res.json({ msg: 'Check-in successful', booking });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;