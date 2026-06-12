const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/server');
const User = require('../src/models/User');
const Event = require('../src/models/Event');
const Booking = require('../src/models/Booking');

// Increase timeout for DB operations
jest.setTimeout(30000);

describe('Check-in and User Population API', () => {
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
            email: `host_${Date.now()}@example.com`,
            password: 'password123'
        });
        await hostUser.save();
        hostToken = jwt.sign({ user: { id: hostUser.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Create Test Attendee
        attendeeUser = new User({
            name: 'Test Attendee',
            email: `attendee_${Date.now()}@example.com`,
            password: 'password123'
        });
        await attendeeUser.save();
        attendeeToken = jwt.sign({ user: { id: attendeeUser.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Create Test Event hosted by hostUser
        testEvent = new Event({
            host: hostUser.id,
            name: 'Testing Event',
            description: 'This is a testing description.',
            category: 'Other',
            startDate: new Date(),
            endDate: new Date(Date.now() + 3600000),
            location: { address: 'Test Location', lat: 12.9716, lng: 77.5946 },
            ticketType: 'Free',
            price: 0,
            totalTickets: 100,
            inventory: 100
        });
        await testEvent.save();

        // Create Test Booking for attendeeUser
        testBooking = new Booking({
            event: testEvent.id,
            user: attendeeUser.id,
            amount: 0,
            status: 'Confirmed',
            ticketCode: `TCK-${Date.now()}`
        });
        await testBooking.save();
    });

    afterAll(async () => {
        // Clean up database entries defensively
        try {
            const hostId = hostUser ? hostUser.id : null;
            const attendeeId = attendeeUser ? attendeeUser.id : null;
            const testEventId = testEvent ? testEvent.id : null;

            const userIds = [hostId, attendeeId].filter(id => id !== null);
            if (testEventId) {
                await Booking.deleteMany({ event: testEventId });
                await Event.deleteOne({ _id: testEventId });
            }
            if (userIds.length > 0) {
                await User.deleteMany({ _id: { $in: userIds } });
            }
        } catch (e) {
            console.error('Clean up error in checkin tests:', e);
        }
        await mongoose.connection.close();
    });

    it('should successfully check in a guest and populate user info', async () => {
        const res = await request(app)
            .post(`/api/events/${testEvent.id}/checkin`)
            .set('x-auth-token', hostToken)
            .send({ ticketCode: testBooking.ticketCode });

        expect(res.statusCode).toEqual(200);
        expect(res.body.msg).toEqual('Check-in successful');
        expect(res.body.booking.checkedIn).toBe(true);
        expect(res.body.booking.user).toBeDefined();
        expect(res.body.booking.user.name).toEqual('Test Attendee');
        expect(res.body.booking.user.email).toBeDefined();
    });

    it('should return 400 if user is already checked in', async () => {
        const res = await request(app)
            .post(`/api/events/${testEvent.id}/checkin`)
            .set('x-auth-token', hostToken)
            .send({ ticketCode: testBooking.ticketCode });

        expect(res.statusCode).toEqual(400);
        expect(res.body.msg).toEqual('Guest is already checked in');
    });

    it('should return 404 for invalid ticket code', async () => {
        const res = await request(app)
            .post(`/api/events/${testEvent.id}/checkin`)
            .set('x-auth-token', hostToken)
            .send({ ticketCode: 'INVALID-CODE' });

        expect(res.statusCode).toEqual(404);
        expect(res.body.msg).toEqual('Invalid ticket for this event');
    });

    it('should return 401 if non-host tries to check in guests', async () => {
        const res = await request(app)
            .post(`/api/events/${testEvent.id}/checkin`)
            .set('x-auth-token', attendeeToken)
            .send({ ticketCode: testBooking.ticketCode });

        expect(res.statusCode).toEqual(401);
        expect(res.body.msg).toEqual('Not authorized');
    });
});
