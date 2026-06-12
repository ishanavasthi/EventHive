const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/server');
const User = require('../src/models/User');
const Event = require('../src/models/Event');
const Booking = require('../src/models/Booking');

// Increase timeout for DB operations
jest.setTimeout(30000);

describe('Event Registration Deadline API Integration Tests', () => {
  let hostUser, attendeeUser;
  let hostToken, attendeeToken;
  let futureEvent, expiredEvent;

  beforeAll(async () => {
    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // Create Test Host
    hostUser = new User({
      name: 'Deadline Host',
      email: `deadline_host_${Date.now()}@example.com`,
      password: 'password123'
    });
    await hostUser.save();
    hostToken = jwt.sign({ user: { id: hostUser.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create Test Attendee
    attendeeUser = new User({
      name: 'Deadline Attendee',
      email: `deadline_attendee_${Date.now()}@example.com`,
      password: 'password123'
    });
    await attendeeUser.save();
    attendeeToken = jwt.sign({ user: { id: attendeeUser.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create an expired event (deadline set to 1 hour in the past)
    expiredEvent = new Event({
      host: hostUser.id,
      name: 'Expired Registration Event',
      description: 'Event description',
      category: 'Tech',
      startDate: new Date(Date.now() + 86400000), // starts tomorrow
      endDate: new Date(Date.now() + 86400000 + 3600000),
      location: { address: 'Test Lab', lat: 0, lng: 0 },
      ticketType: 'Free',
      price: 0,
      totalTickets: 50,
      inventory: 50,
      registrationDeadline: new Date(Date.now() - 3600000) // closed 1 hour ago
    });
    await expiredEvent.save();

    // Create a future event (deadline set to tomorrow)
    futureEvent = new Event({
      host: hostUser.id,
      name: 'Open Registration Event',
      description: 'Event description',
      category: 'Tech',
      startDate: new Date(Date.now() + 172800000), // starts in 2 days
      endDate: new Date(Date.now() + 172800000 + 3600000),
      location: { address: 'Test Lab', lat: 0, lng: 0 },
      ticketType: 'Free',
      price: 0,
      totalTickets: 50,
      inventory: 50,
      registrationDeadline: new Date(Date.now() + 86400000) // closes tomorrow
    });
    await futureEvent.save();
  });

  afterAll(async () => {
    // Teardown
    try {
      const hostId = hostUser ? hostUser.id : null;
      const attendeeId = attendeeUser ? attendeeUser.id : null;
      const expiredEventId = expiredEvent ? expiredEvent.id : null;
      const futureEventId = futureEvent ? futureEvent.id : null;

      const userIds = [hostId, attendeeId].filter(id => id !== null);
      if (userIds.length > 0) {
        await User.deleteMany({ _id: { $in: userIds } });
      }
      if (expiredEventId) {
        await Booking.deleteMany({ event: expiredEventId });
        await Event.deleteOne({ _id: expiredEventId });
      }
      if (futureEventId) {
        await Booking.deleteMany({ event: futureEventId });
        await Event.deleteOne({ _id: futureEventId });
      }
    } catch (e) {
      console.error('Teardown error:', e);
    }
    await mongoose.connection.close();
  });

  it('should reject event creation if the registration deadline is set after the event starts', async () => {
    const invalidEvent = {
      name: 'Late Deadline Event',
      description: 'Test Description',
      category: 'Workshop',
      startDate: new Date(Date.now() + 3600000), // starts in 1 hour
      endDate: new Date(Date.now() + 7200000),
      location: { address: 'Delhi', lat: 0, lng: 0 },
      ticketType: 'Free',
      price: 0,
      totalTickets: 100,
      registrationDeadline: new Date(Date.now() + 7200000) // deadline in 2 hours (after start!)
    };

    const res = await request(app)
      .post('/api/events')
      .set('x-auth-token', hostToken)
      .send(invalidEvent);

    expect(res.statusCode).toEqual(400);
    expect(res.body.errors[0].msg).toContain('Registration deadline must be before or equal to');
  });

  it('should successfully book tickets for events with open registration deadlines', async () => {
    const res = await request(app)
      .post('/api/bookings/verify')
      .set('x-auth-token', attendeeToken)
      .send({
        eventId: futureEvent.id,
        quantity: 1,
        razorpay_payment_id: 'pay_future',
        razorpay_order_id: 'order_future'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.msg).toEqual('Booking confirmed');
  });

  it('should reject bookings if the registration deadline has already passed', async () => {
    // Try checkout
    const checkoutRes = await request(app)
      .post('/api/bookings/checkout')
      .set('x-auth-token', attendeeToken)
      .send({
        eventId: expiredEvent.id,
        quantity: 1
      });

    expect(checkoutRes.statusCode).toEqual(400);
    expect(checkoutRes.body.msg).toEqual('Registrations for this event have closed');

    // Try verify
    const verifyRes = await request(app)
      .post('/api/bookings/verify')
      .set('x-auth-token', attendeeToken)
      .send({
        eventId: expiredEvent.id,
        quantity: 1,
        razorpay_payment_id: 'pay_expired',
        razorpay_order_id: 'order_expired'
      });

    expect(verifyRes.statusCode).toEqual(400);
    expect(verifyRes.body.msg).toEqual('Registrations for this event have closed');
  });
});
