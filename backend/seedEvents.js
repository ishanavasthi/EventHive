require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Event = require('./src/models/Event');
const Booking = require('./src/models/Booking');

const USERS_TO_CREATE = [
  { name: 'Rohit Sharma', email: 'rohit@example.com', password: 'rohit123', city: 'Bengaluru' },
  { name: 'Virat Kohli', email: 'virat@example.com', password: 'virat123', city: 'Mumbai' },
  { name: 'Jasprit Bumrah', email: 'jasprit@example.com', password: 'jasprit123', city: 'Mumbai' }
];

const getFutureDate = (daysFromNow, hoursOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(d.getHours() + hoursOffset);
  return d;
};

const createEventsList = (hosts) => {
  const [rohitId, viratId, jaspritId] = hosts;

  return [
    // --- ROHIT SHARMA'S EVENTS ---
    {
      host: rohitId,
      name: 'Neon Beats: Under the Stars',
      description: 'Experience the ultimate outdoor electronic dance music festival under the stars. Featuring top local and international DJs, custom neon visualizers, fire spinners, and interactive visual art installations. Free neon glow wristbands at entry!',
      category: 'Music',
      startDate: getFutureDate(3, 4),
      endDate: getFutureDate(3, 10),
      location: {
        address: 'Indiranagar Club Grounds, Indiranagar, Bengaluru, Karnataka, India',
        lat: 12.971891,
        lng: 77.641151
      },
      ticketType: 'Paid',
      price: 799,
      totalTickets: 250,
      inventory: 242,
      isExternalTicket: false,
      externalTicketUrl: '',
      targetAgeGroup: '21+',
      registrationDeadline: getFutureDate(2, 0),
      poster: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-concert-crowd-cheering-under-lights-42571-large.mp4'
    },
    {
      host: rohitId,
      name: 'React Native & Reanimated Masterclass',
      description: 'A deep-dive hands-on workshop into building ultra-smooth, 60 FPS mobile user interfaces. We will cover React Native Reanimated 3, gesture handler integration, layout animations, and performance profiling.',
      category: 'Tech',
      startDate: getFutureDate(10, 0),
      endDate: getFutureDate(10, 3),
      location: {
        address: 'Virtual Meet (Zoom Platform)',
        lat: 0,
        lng: 0
      },
      ticketType: 'Free',
      price: 0,
      totalTickets: 500,
      inventory: 488,
      isExternalTicket: false,
      externalTicketUrl: '',
      targetAgeGroup: 'All Ages',
      registrationDeadline: getFutureDate(9, 23),
      poster: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-programmer-typing-on-a-keyboard-41553-large.mp4'
    },
    {
      host: rohitId,
      name: 'Cyberpunk GameDev Hackathon 2026',
      description: 'A 36-hour nonstop game development sprint. Build indie game prototypes using Unity, Unreal Engine, or Godot around the theme "Futuristic Metropolis". Prizes worth ₹2,500,000 for top 3 teams!',
      category: 'Tech',
      startDate: getFutureDate(18, 2),
      endDate: getFutureDate(20, 4),
      location: {
        address: 'Koramangala Innovation Hub, 80 Feet Road, Bengaluru, Karnataka, India',
        lat: 12.9352,
        lng: 77.6245
      },
      ticketType: 'Free',
      price: 0,
      totalTickets: 120,
      inventory: 120,
      isExternalTicket: false,
      externalTicketUrl: '',
      targetAgeGroup: '18+',
      registrationDeadline: getFutureDate(16, 12),
      poster: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80',
      videoUrl: ''
    },
    {
      host: rohitId,
      name: 'Sunburn Beach Music Carnival',
      description: 'The biggest beach EDM extravaganza of the summer! Featuring world-renowned headliners, beachside food stalls, laser shows, and sunset afterparties. Book tickets on our official ticketing partner.',
      category: 'Music',
      startDate: getFutureDate(30, 8),
      endDate: getFutureDate(32, 14),
      location: {
        address: 'Anjuna Beach Stage, Anjuna, Goa, India',
        lat: 15.5872,
        lng: 73.7368
      },
      ticketType: 'Paid',
      price: 2499,
      totalTickets: 0,
      inventory: 0,
      isExternalTicket: true,
      externalTicketUrl: 'https://in.bookmyshow.com/events/sunburn-goa-2026/ET00099999',
      targetAgeGroup: '21+',
      registrationDeadline: getFutureDate(29, 0),
      poster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-people-dancing-at-a-party-41566-large.mp4'
    },
    {
      host: rohitId,
      name: 'Subcontinental Comedy & Roast Night',
      description: 'Get ready for an unscripted night of gut-busting standup comedy and roasts by India’s funniest rising comics. Drinks and snacks included with premium pass.',
      category: 'Other',
      startDate: getFutureDate(6, 11),
      endDate: getFutureDate(6, 14),
      location: {
        address: 'Canvas Laugh Club, Lower Parel, Mumbai, Maharashtra, India',
        lat: 18.9953,
        lng: 72.8288
      },
      ticketType: 'Paid',
      price: 499,
      totalTickets: 80,
      inventory: 74,
      isExternalTicket: false,
      externalTicketUrl: '',
      targetAgeGroup: '18+',
      registrationDeadline: getFutureDate(5, 18),
      poster: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&q=80',
      videoUrl: ''
    },
    {
      host: rohitId,
      name: 'Indie Short Film Premiere & Q&A',
      description: 'Screening of 5 award-winning independent short films from across Asia, followed by an intimate panel discussion and Q&A session with directors and cinematographers.',
      category: 'Art',
      startDate: getFutureDate(12, 5),
      endDate: getFutureDate(12, 9),
      location: {
        address: 'Alliance Française Auditorium, Vasanth Nagar, Bengaluru, Karnataka, India',
        lat: 12.9892,
        lng: 77.5923
      },
      ticketType: 'Free',
      price: 0,
      totalTickets: 150,
      inventory: 150,
      isExternalTicket: false,
      externalTicketUrl: '',
      targetAgeGroup: 'All Ages',
      registrationDeadline: getFutureDate(11, 20),
      poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-artist-painting-on-a-canvas-41539-large.mp4'
    },

    // --- VIRAT KOHLI'S EVENTS ---
    {
      host: viratId,
      name: 'The Ultimate 5v5 Turf Championship',
      description: 'Gather your squad for the most intense amateur 5-a-side football championship in the city. Knockout format with FIFA-certified referees, hydration stations, and ₹50,000 cash prize for champions!',
      category: 'Sports',
      startDate: getFutureDate(7, 2),
      endDate: getFutureDate(8, 10),
      location: {
        address: 'St. Andrews Turf, Bandra West, Mumbai, Maharashtra, India',
        lat: 19.0543,
        lng: 72.8293
      },
      ticketType: 'Paid',
      price: 1500,
      totalTickets: 32,
      inventory: 28,
      isExternalTicket: false,
      externalTicketUrl: '',
      targetAgeGroup: '18+',
      registrationDeadline: getFutureDate(5, 0),
      poster: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-soccer-player-kicking-a-ball-in-a-stadium-41552-large.mp4'
    },
    {
      host: viratId,
      name: 'Gourmet French Bistro Masterclass',
      description: 'Learn the secret culinary techniques behind classic French bistro cuisine. Prepare a 3-course gourmet meal featuring French Onion Soup, Duck Confit, and Crème Brûlée under MasterChef guidance.',
      category: 'Cooking',
      startDate: getFutureDate(14, 3),
      endDate: getFutureDate(14, 7),
      location: {
        address: "L'Opéra Culinary Studio, Chanakyapuri, New Delhi, Delhi, India",
        lat: 28.5996,
        lng: 77.2144
      },
      ticketType: 'Paid',
      price: 3500,
      totalTickets: 15,
      inventory: 15,
      isExternalTicket: false,
      externalTicketUrl: '',
      targetAgeGroup: '18+',
      registrationDeadline: getFutureDate(11, 0),
      poster: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-dish-in-a-restaurant-kitchen-41544-large.mp4'
    },
    {
      host: viratId,
      name: 'High-Intensity CrossFit & Hydration Challenge',
      description: 'Test your stamina and agility in a high-octane fitness arena! Includes kettlebell workouts, obstacle runs, mobility sessions, and electrolyte tasting stations. Open to all fitness levels.',
      category: 'Sports',
      startDate: getFutureDate(4, 1),
      endDate: getFutureDate(4, 4),
      location: {
        address: 'Cult Fitness Arena, HSR Layout, Bengaluru, Karnataka, India',
        lat: 12.9121,
        lng: 77.6445
      },
      ticketType: 'Paid',
      price: 599,
      totalTickets: 100,
      inventory: 92,
      isExternalTicket: false,
      externalTicketUrl: '',
      targetAgeGroup: 'All Ages',
      registrationDeadline: getFutureDate(3, 18),
      poster: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=80',
      videoUrl: ''
    },
    {
      host: viratId,
      name: 'Artisan Coffee Cupping & Espresso Brewing',
      description: 'Explore single-origin coffee beans from Ethiopia, Colombia, and Chikmagalur. Learn pour-over methods, latte art fundamentals, and coffee bean roasting science.',
      category: 'Workshop',
      startDate: getFutureDate(9, 4),
      endDate: getFutureDate(9, 7),
      location: {
        address: 'Roastery Coffee House, Bandra West, Mumbai, Maharashtra, India',
        lat: 19.0600,
        lng: 72.8362
      },
      ticketType: 'Paid',
      price: 850,
      totalTickets: 25,
      inventory: 25,
      isExternalTicket: false,
      externalTicketUrl: '',
      targetAgeGroup: '18+',
      registrationDeadline: getFutureDate(8, 12),
      poster: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80',
      videoUrl: ''
    },
    {
      host: viratId,
      name: 'Street Photography Walk: Old City & Murals',
      description: 'Grab your camera or smartphone! Join award-winning visual storytellers as we explore historical alleyways, vibrant murals, and urban architecture. Photo critique session at the end.',
      category: 'Art',
      startDate: getFutureDate(11, 1),
      endDate: getFutureDate(11, 5),
      location: {
        address: 'Lodhi Art District, Channing Square, New Delhi, Delhi, India',
        lat: 28.5888,
        lng: 77.2272
      },
      ticketType: 'Free',
      price: 0,
      totalTickets: 40,
      inventory: 40,
      isExternalTicket: false,
      externalTicketUrl: '',
      targetAgeGroup: 'All Ages',
      registrationDeadline: getFutureDate(10, 18),
      poster: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-artist-painting-on-a-canvas-41539-large.mp4'
    },
    {
      host: viratId,
      name: 'Contemporary Indian Art Exhibition 2026',
      description: 'A grand exhibition showcasing modern Indian canvas paintings, sculpture installations, and digital NFT art. Free entry pass available on Paytm Insider.',
      category: 'Cultural',
      startDate: getFutureDate(22, 4),
      endDate: getFutureDate(25, 12),
      location: {
        address: 'Jehangir Art Gallery, Kala Ghoda, Fort, Mumbai, Maharashtra, India',
        lat: 18.9275,
        lng: 72.8317
      },
      ticketType: 'Free',
      price: 0,
      totalTickets: 0,
      inventory: 0,
      isExternalTicket: true,
      externalTicketUrl: 'https://insider.in/events/contemporary-art-exhibition-2026',
      targetAgeGroup: 'All Ages',
      registrationDeadline: getFutureDate(21, 0),
      poster: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&q=80',
      videoUrl: ''
    },

    // --- JASPRIT BUMRAH'S EVENTS ---
    {
      host: jaspritId,
      name: 'UI/UX Startup Founders Mixer',
      description: 'An exclusive informal networking evening for startup founders, product designers, and engineering leaders. Share design systems insights, user retention hacks, and growth strategies over craft beverages.',
      category: 'Meetup',
      startDate: getFutureDate(5, 11),
      endDate: getFutureDate(5, 15),
      location: {
        address: 'Social, Indiranagar, 80 Feet Road, Bengaluru, Karnataka, India',
        lat: 12.9698,
        lng: 77.6413
      },
      ticketType: 'Free',
      price: 0,
      totalTickets: 100,
      inventory: 96,
      isExternalTicket: false,
      externalTicketUrl: '',
      targetAgeGroup: '21+',
      registrationDeadline: getFutureDate(4, 18),
      poster: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80',
      videoUrl: ''
    },
    {
      host: jaspritId,
      name: 'Acoustic Soul & Jazz Fest 2026',
      description: 'An intimate candlelit evening of live acoustic melodies, neo-soul vocals, and contemporary jazz by breakthrough independent bands. Purchase tickets via BookMyShow.',
      category: 'Music',
      startDate: getFutureDate(25, 10),
      endDate: getFutureDate(25, 15),
      location: {
        address: 'Shanmukhananda Hall, Sion East, Mumbai, Maharashtra, India',
        lat: 19.0347,
        lng: 72.8617
      },
      ticketType: 'Paid',
      price: 1200,
      totalTickets: 0,
      inventory: 0,
      isExternalTicket: true,
      externalTicketUrl: 'https://in.bookmyshow.com/events/acoustic-soul-jazz-fest-2026/ET00012345',
      targetAgeGroup: 'All Ages',
      registrationDeadline: getFutureDate(24, 0),
      poster: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-concert-crowd-cheering-under-lights-42571-large.mp4'
    },
    {
      host: jaspritId,
      name: 'Salsa & Bachata Sunset Dance Social',
      description: 'Learn sensual Bachata and energetic Salsa movements from top Latin dancers. Beginner workshop for first 60 minutes followed by social dancing till midnight!',
      category: 'Cultural',
      startDate: getFutureDate(8, 9),
      endDate: getFutureDate(8, 14),
      location: {
        address: 'Baga Sunset Lounge, Baga Beach, Goa, India',
        lat: 15.5553,
        lng: 73.7517
      },
      ticketType: 'Paid',
      price: 999,
      totalTickets: 75,
      inventory: 75,
      isExternalTicket: false,
      externalTicketUrl: '',
      targetAgeGroup: '18+',
      registrationDeadline: getFutureDate(7, 18),
      poster: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=600&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-people-dancing-at-a-party-41566-large.mp4'
    },
    {
      host: jaspritId,
      name: 'AI Agent Architectures & LLM Summit 2026',
      description: 'A flagship technical summit on autonomous AI agents, tool-use reasoning models, vector indexing, and multi-agent orchestrations. Talks by AI researchers & lead engineers.',
      category: 'Tech',
      startDate: getFutureDate(15, 3),
      endDate: getFutureDate(16, 11),
      location: {
        address: 'NIMHANS Convention Centre, Lakkasandra, Bengaluru, Karnataka, India',
        lat: 12.9388,
        lng: 77.5960
      },
      ticketType: 'Paid',
      price: 1999,
      totalTickets: 300,
      inventory: 300,
      isExternalTicket: false,
      externalTicketUrl: '',
      targetAgeGroup: '18+',
      registrationDeadline: getFutureDate(13, 23),
      poster: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-programmer-typing-on-a-keyboard-41553-large.mp4'
    },
    {
      host: jaspritId,
      name: 'Traditional Pottery & Ceramic Clay Workshop',
      description: 'Unplug and get creative! Learn wheel throwing, hand-building, and glaze painting in a tranquil pottery studio. Take your custom ceramic mug home after firing!',
      category: 'Workshop',
      startDate: getFutureDate(5, 2),
      endDate: getFutureDate(5, 6),
      location: {
        address: 'Claystation Studio, 12th Main Road, HAL 2nd Stage, Bengaluru, Karnataka, India',
        lat: 12.9663,
        lng: 77.6472
      },
      ticketType: 'Paid',
      price: 1100,
      totalTickets: 20,
      inventory: 20,
      isExternalTicket: false,
      externalTicketUrl: '',
      targetAgeGroup: 'Teens',
      registrationDeadline: getFutureDate(4, 12),
      poster: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80',
      videoUrl: ''
    },
    {
      host: jaspritId,
      name: 'Plant-Based & Organic Culinary Expo',
      description: 'Discover the future of plant-based dining! Live cooking demonstrations by celebrity chefs, vegan cheese tastings, and sustainable packaging exhibits.',
      category: 'Cooking',
      startDate: getFutureDate(20, 4),
      endDate: getFutureDate(21, 12),
      location: {
        address: 'MMRDA Grounds, Bandra Kurla Complex, Mumbai, Maharashtra, India',
        lat: 19.0660,
        lng: 72.8687
      },
      ticketType: 'Free',
      price: 0,
      totalTickets: 0,
      inventory: 0,
      isExternalTicket: true,
      externalTicketUrl: 'https://zomato.com/events/plant-based-culinary-expo-2026',
      targetAgeGroup: 'All Ages',
      registrationDeadline: getFutureDate(19, 18),
      poster: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&q=80',
      videoUrl: ''
    }
  ];
};

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is missing in .env file!');
    }

    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully!');

    // Clean existing records to allow a fresh, pristine seed state
    await Booking.deleteMany({});
    await Event.deleteMany({});
    console.log('Cleared previous events and bookings.');

    const seededHostIds = [];

    // 1. Create or Find Users
    for (const u of USERS_TO_CREATE) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        console.log(`Creating user account for: ${u.name}...`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(u.password, salt);

        user = new User({
          name: u.name,
          email: u.email,
          password: hashedPassword,
          city: u.city,
          userType: 'individual',
          profilePicture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`
        });
        await user.save();
        console.log(`Created user: ${user.email}`);
      } else {
        console.log(`User existing: ${user.email}`);
      }
      seededHostIds.push(user._id);
    }

    // 2. Generate and Save Events
    const events = createEventsList(seededHostIds);
    for (const e of events) {
      console.log(`Seeding event: ${e.name}`);
      const event = new Event(e);
      await event.save();
    }

    console.log('\n--- Seeding completed successfully! ---');
    console.log('Registered host credentials:');
    USERS_TO_CREATE.forEach(u => {
      console.log(`- Email: ${u.email} | Password: ${u.password} (${u.name})`);
    });
    console.log(`Seeded ${events.length} diverse, high-quality event configurations across all categories.`);

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

seed();

