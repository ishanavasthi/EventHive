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
    enum: ['Music', 'Workshop', 'Meetup', 'Sports', 'Tech', 'Art', 'Cultural', 'Cooking', 'Other'],
    required: true
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: {
    address: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number }
  },
  ticketType: { type: String, enum: ['Free', 'Paid'], default: 'Free' },
  price: { type: Number, default: 0 },        // 0 = Free
  totalTickets: { 
    type: Number, 
    required: function() { return !this.isExternalTicket; },
    default: 0 
  },
  inventory: { 
    type: Number, 
    required: function() { return !this.isExternalTicket; },
    default: 0 
  },
  isExternalTicket: { type: Boolean, default: false },
  externalTicketUrl: { type: String, default: '' },
  poster: { type: String }, // URL to image
  registrationDeadline: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);