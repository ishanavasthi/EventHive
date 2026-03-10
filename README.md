# EventHive 

EventHive is a mobile application for discovering, hosting, and booking events in your city. Built with a focus on immersive UI and seamless user experience, it connects event organizers with thrill-seekers.

##  Problem Statement
Finding local events that match specific vibes (from tech workshops to neon parties) is often difficult due to fragmented platforms and poor user interfaces. EventHive solves this by offering a centralized, visually stunning marketplace where:
- **Attendees** can easily discover, filter, and book events.
- **Hosts** can create and manage events with intuitive tools.

## 🛠 Tech Stack

### Frontend (Mobile)
-   **Framework**: React Native (via Expo SDK 52)
-   **Animations**: React Native Reanimated 3
-   **UI Components**: Linear Gradient, Expo Blur (Glassmorphism), Lucide Icons
-   **Navigation**: React Navigation
-   **State Management**: React Context API
-   **Maps**: Google Places Autocomplete

### Backend (Server)
-   **Runtime**: Node.js & Express.js
-   **Database**: MongoDB (Atlas)
-   **Authentication**: JWT (JSON Web Tokens)
-   **Deployment**: Render (Web Service)

##  Features Implemented
-   **Authentication**: Login/Register with JWT.
-   **Event Discovery**:
    -   Immersive Home Screen with Featured Carousel.
    -   Search & Filter by City (e.g., Bengaluru, Mumbai).
-   **Create Event**:
    -   Host new events with Poster upload.
    -   Location search using Google Maps API.
    -   Date/Time picker with validation.
-   **My Events**:
    -   Track "Going" (booked) and "Hosting" events.
    -   Auto-refreshing status.
-   **Event Details**:
    -   Dynamic gradient overlays.
    -   One-tap booking system.
    -   Maps integration.

##  How to Run Locally

### Prerequisites
-   Node.js (v18+)
-   MongoDB URI
-   Expo Go App on your phone

### 1. Backend Setup
1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in `backend/` and add:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_atlas_uri
    JWT_SECRET=your_jwt_secret
    ```
4.  Start the server:
    ```bash
    npm run dev
    ```

### 2. Frontend Setup
1.  Navigate to the mobile app folder:
    ```bash
    cd mobile-app
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in `mobile-app/` and add:
    ```env
    EXPO_PUBLIC_API_URL=http://localhost:5000/api
    # Or use your Render URL for cloud backend
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
    ```
4.  Start the app:
    ```bash
    npx expo start
    ```
5.  Scan the QR code with Expo Go.

##  API Documentation

### Auth
-   `POST /api/auth/register` - Create a new user.
-   `POST /api/auth/login` - Authenticate user & get token.

### Events
-   `GET /api/events` - Fetch all upcoming events.
-   `GET /api/events/:id` - Get details for a specific event.
-   `POST /api/events` - Create a new event (Auth required).
-   `DELETE /api/events/:id` - Delete an event (Host only).

### Bookings
-   `POST /api/bookings/:eventId` - Book a ticket.
-   `GET /api/bookings/my-bookings` - Get user's booked events.
