const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/server');
const User = require('../src/models/User');
const Event = require('../src/models/Event');
const Booking = require('../src/models/Booking');
const Notification = require('../src/models/Notification');

// Increase timeout for DB operations
jest.setTimeout(30000);

describe('Notifications API & Triggers Integration Tests', () => {
  let hostUser, attendeeUser;
  let hostToken, attendeeToken;
  let testEvent;
  let testBooking;

  beforeAll(async () => {
    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // Create Test Host
    hostUser = new User({
      name: 'Test Host',
      email: `host_${Date.now()}_${Math.floor(Math.random() * 1000000)}@example.com`,
      password: 'password123',
      city: 'Mumbai'
    });
    await hostUser.save();
    hostToken = jwt.sign({ user: { id: hostUser.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create Test Attendee
    attendeeUser = new User({
      name: 'Test Attendee',
      email: `attendee_${Date.now()}_${Math.floor(Math.random() * 1000000)}@example.com`,
      password: 'password123',
      city: 'New Delhi'
    });
    await attendeeUser.save();
    attendeeToken = jwt.sign({ user: { id: attendeeUser.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create Test Event hosted by hostUser
    testEvent = new Event({
      host: hostUser.id,
      name: 'Testing Notification Event',
      description: 'Test Description',
      category: 'Tech',
      startDate: new Date(),
      endDate: new Date(Date.now() + 3600000),
      location: { address: 'Connaught Place, New Delhi, India', lat: 28.6139, lng: 77.2090 },
      ticketType: 'Free',
      price: 0,
      totalTickets: 50,
      inventory: 50
    });
    await testEvent.save();
  });

  afterAll(async () => {
    // Defensive clean up
    try {
      const hostId = hostUser ? hostUser.id : null;
      const attendeeId = attendeeUser ? attendeeUser.id : null;
      const testEventId = testEvent ? testEvent.id : null;
      
      const userIds = [hostId, attendeeId].filter(id => id !== null);
      if (userIds.length > 0) {
        await Notification.deleteMany({ user: { $in: userIds } });
        await User.deleteMany({ _id: { $in: userIds } });
      }
      if (testEventId) {
        await Booking.deleteMany({ event: testEventId });
        await Event.deleteOne({ _id: testEventId });
      }
    } catch (e) {
      console.error('Clean up error:', e);
    }
    await mongoose.connection.close();
  });

  it('should trigger notification for attendee when booking is confirmed', async () => {
    // Simulate booking verification
    const res = await request(app)
      .post('/api/bookings/verify')
      .set('x-auth-token', attendeeToken)
      .send({
        eventId: testEvent.id,
        quantity: 1,
        razorpay_payment_id: 'pay_test',
        razorpay_order_id: 'order_test'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.msg).toEqual('Booking confirmed');
    testBooking = res.body.booking;

    // Check notifications for attendee
    const notifRes = await request(app)
      .get('/api/notifications')
      .set('x-auth-token', attendeeToken);

    expect(notifRes.statusCode).toEqual(200);
    expect(notifRes.body.length).toBeGreaterThanOrEqual(1);
    
    const bookingNotif = notifRes.body.find(n => n.type === 'booking_confirmed');
    expect(bookingNotif).toBeDefined();
    expect(bookingNotif.title).toContain('Booking Confirmed');
    expect(bookingNotif.message).toContain(testEvent.name);
    expect(bookingNotif.read).toBe(false);
  });

  it('should trigger notifications for both guest and host on check-in', async () => {
    // Execute check-in
    const res = await request(app)
      .post(`/api/events/${testEvent.id}/checkin`)
      .set('x-auth-token', hostToken)
      .send({ ticketCode: testBooking.ticketCode });

    expect(res.statusCode).toEqual(200);
    expect(res.body.msg).toEqual('Check-in successful');

    // Guest notification check
    const guestNotifRes = await request(app)
      .get('/api/notifications')
      .set('x-auth-token', attendeeToken);
    const checkinGuestNotif = guestNotifRes.body.find(n => n.type === 'check_in');
    expect(checkinGuestNotif).toBeDefined();
    expect(checkinGuestNotif.title).toContain('Checked In Successfully');

    // Host notification check
    const hostNotifRes = await request(app)
      .get('/api/notifications')
      .set('x-auth-token', hostToken);
    const checkinHostNotif = hostNotifRes.body.find(n => n.type === 'check_in');
    expect(checkinHostNotif).toBeDefined();
    expect(checkinHostNotif.title).toContain('Guest Checked In');
    expect(checkinHostNotif.message).toContain(attendeeUser.name);
  });

  it('should mark a specific notification as read', async () => {
    const notifRes = await request(app)
      .get('/api/notifications')
      .set('x-auth-token', attendeeToken);
    
    const targetNotif = notifRes.body.find(n => n.read === false);
    expect(targetNotif).toBeDefined();

    const updateRes = await request(app)
      .put(`/api/notifications/${targetNotif._id}/read`)
      .set('x-auth-token', attendeeToken);

    expect(updateRes.statusCode).toEqual(200);
    expect(updateRes.body.read).toBe(true);

    // Verify in db
    const verifyRes = await request(app)
      .get('/api/notifications')
      .set('x-auth-token', attendeeToken);
    const updatedNotif = verifyRes.body.find(n => n._id === targetNotif._id);
    expect(updatedNotif.read).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    // Mark all read
    const res = await request(app)
      .put('/api/notifications/read-all')
      .set('x-auth-token', attendeeToken);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.msg).toEqual('All notifications marked as read');

    // Verify all read
    const verifyRes = await request(app)
      .get('/api/notifications')
      .set('x-auth-token', attendeeToken);
    
    const unread = verifyRes.body.filter(n => n.read === false);
    expect(unread.length).toEqual(0);
  });

  it('should trigger notification for users in the same city when a new event is posted', async () => {
    // Update attendee city to Bengaluru
    attendeeUser.city = 'Bengaluru';
    await attendeeUser.save();

    // Create a new event located in Bengaluru (hosted by hostUser)
    const newEventData = {
      name: 'Bengaluru Tech Expo',
      description: 'Mega tech showcase',
      category: 'Tech',
      startDate: new Date(),
      endDate: new Date(Date.now() + 3600000),
      location: { address: 'Whitefield, Bengaluru, Karnataka, India', lat: 12.9716, lng: 77.5946 },
      ticketType: 'Free',
      price: 0,
      totalTickets: 100,
      inventory: 100
    };

    // Post to API to trigger notification pipeline
    const res = await request(app)
      .post('/api/events')
      .set('x-auth-token', hostToken)
      .send(newEventData);

    expect(res.statusCode).toEqual(200);
    const createdEventId = res.body._id;

    // Verify attendee (who is registered in Bengaluru) received notification
    const attendeeNotifRes = await request(app)
      .get('/api/notifications')
      .set('x-auth-token', attendeeToken);

    const cityNotif = attendeeNotifRes.body.find(n => n.title.includes('New Event in Your City'));
    expect(cityNotif).toBeDefined();
    expect(cityNotif.message).toContain('Bengaluru');
    expect(cityNotif.message).toContain('Bengaluru Tech Expo');

    // Clean up created event and its associated notifications
    await Event.deleteOne({ _id: createdEventId });
    await Notification.deleteMany({ relatedId: createdEventId });
  });

  it('should notify attendees when an event is cancelled', async () => {
    // Create new booking for cancellation test
    const newAttendee = new User({
      name: 'Cancel Attendee',
      email: `cancel_${Date.now()}_${Math.floor(Math.random() * 1000000)}@example.com`,
      password: 'password123',
      city: 'Mumbai'
    });
    await newAttendee.save();
    const cancelAttendeeToken = jwt.sign({ user: { id: newAttendee.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Book ticket
    await request(app)
      .post('/api/bookings/verify')
      .set('x-auth-token', cancelAttendeeToken)
      .send({
        eventId: testEvent.id,
        quantity: 1,
        razorpay_payment_id: 'pay_cancel',
        razorpay_order_id: 'order_cancel'
      });

    // Cancel event
    const cancelRes = await request(app)
      .delete(`/api/events/${testEvent.id}`)
      .set('x-auth-token', hostToken);

    expect(cancelRes.statusCode).toEqual(200);
    expect(cancelRes.body.msg).toEqual('Event removed');

    // Verify notification received
    const notifRes = await request(app)
      .get('/api/notifications')
      .set('x-auth-token', cancelAttendeeToken);

    const cancelNotif = notifRes.body.find(n => n.type === 'event_cancelled');
    expect(cancelNotif).toBeDefined();
    expect(cancelNotif.title).toContain('Event Cancelled');
    expect(cancelNotif.message).toContain(testEvent.name);

    // Clean up cancel user
    await Notification.deleteMany({ user: newAttendee.id });
    await User.deleteOne({ _id: newAttendee.id });
  });
});
