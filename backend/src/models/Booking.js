const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Failed', 'Refunded'],
        default: 'Pending'
    },
    paymentId: { type: String }, // Razorpay Payment ID
    orderId: { type: String },   // Razorpay Order ID
    ticketCode: { type: String, unique: true }, // Simple unique code for entry
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
