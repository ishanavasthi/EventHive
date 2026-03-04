const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links this event to the User who created it
    required: true
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Music', 'Workshop', 'Meetup', 'Sports', 'Other'], // PRD Categories
    required: true 
  },
  date: { type: Date, required: true },
  location: { type: String, required: true }, // Keeping it simple for now
  price: { type: Number, default: 0 },        // 0 = Free
  totalTickets: { type: Number, required: true },
  poster: { type: String }, // URL to image (we'll handle upload later)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);