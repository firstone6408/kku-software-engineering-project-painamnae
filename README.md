# Pai Nam Nae - A Safe Ride Sharing App

"Pai Nam Nae is a carpooling web application that connects drivers and passengers heading in the same direction, with a primary focus on safety and convenience. It is developed with a **Nuxt.js** frontend and an **Express.js** backend, powered by the **Prisma** ORM and a **PostgreSQL** database."

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Google Maps APIs Used](#google-maps-apis-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [License](#license)
- [Contact](#contact)

## Features

- User registration with multi-step identity verification
- JWT authentication
- Role-based access control (PASSENGER / DRIVER / ADMIN)
- Route & Trip Management: Drivers can create and manage their routes.
- Booking System: Passengers can find and book trips.
- Real-time Notifications: In-app notifications for booking status and other events.
- Google Maps Integration: For directions, geocoding, and distance calculation.
- Vehicle management (CRUD, set default)
- User profile management
- Admin capabilities for user management (list, update status, delete)
- Image uploads for verification handled via **Cloudinary**
- Input validation via **Zod**
- API documentation with Swagger UI
- **Incident & Report Management:** In-app reporting system for users and a management dashboard for Admins (Added in Sprint 1 & 2).
- **Emergency Contacts:** Users can configure emergency contacts to receive critical updates natively (Added in Sprint 3).
- **Live Location Sharing:** Share live trip progress natively through the app with location history tracking (Added in Sprint 3).
- **LINE Integration:** Webhook system to link user accounts and receive real-time updates directly via LINE Official Account (Added in Sprint 3).

## Tech Stack

- **Frontend:** Nuxt.js 3, Vue 3, Tailwind CSS v4, Maps Integration (`@googlemaps/js-api-loader`, `leaflet`)
- **Backend:** Node.js, Express.js (Migrated to **TypeScript** in Sprint 2)
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** JSON Web Tokens (JWT)
- **Image Storage & Uploads:** Cloudinary, Multer
- **Validation & Security:** Zod, Helmet, Express Rate Limit
- **API Docs & Monitoring:** Swagger (UI Express, JSDoc), Prometheus (`prom-client`)
- **Integration:** LINE Messaging API & Webhook

## Google Maps APIs Used

- **Backend**
  - Geocoding API
  - Directions API
  - Distance Matrix API

- **Frontend**
  - Maps JavaScript API
  - Places API
  - Places API (New)
  - Geocoding API
  - Distance Matrix API

## Prerequisites

- Node.js v16+ (or v20+)
- npm or yarn
- PostgreSQL instance
- Cloudinary Account (for API Key, Secret, and Cloud Name)
- Google Maps API Keys (for both frontend and backend)
- LINE Developers Account (for Webhook & Messaging API keys)

## Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/Pai-Nam-Nae-A-Safe-Ride-Sharing/PaiNamNaeWebApp.git
    cd PaiNamNaeWebApp
    ```

2.  **Install backend dependencies**

    ```bash
    cd code/sprint-3/backend
    npm install
    ```

3.  **Install frontend dependencies**

    ```bash
    cd ../frontend
    npm install
    ```

## Environment Variables

Create a `.env` file in the `backend` directory with the following:

```ini
# Server
PORT=3000

# Database
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>?schema=public"

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Maps API Key (Backend)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_for_backend

# Google Maps API Key (Frontend)
NUXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_for_frontend

# LINE API Credentials (Optional/If enabled)
LINE_CHANNEL_ACCESS_TOKEN=your_line_access_token

# Account Admin (Example)
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin123
ADMIN_PASSWORD=123456789
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Administrator
```

## Database Setup

1.  **Navigate to the backend directory**
    ```bash
    cd code/sprint-3/backend
    ```
2.  **Generate Prisma Client**
    ```bash
    npx prisma generate
    ```
3.  **Run migrations**
    ```bash
    npx prisma migrate dev --name init
    ```

## Running the Application

1.  **Start the backend**
    ```bash
    cd code/sprint-3/backend
    npm run dev # starts Express server on http://localhost:3000
    ```
2.  **Start the frontend**
    ```bash
    cd code/sprint-3/frontend
    npm run dev # starts Nuxt.js on http://localhost:3001
    ```

## API Endpoints

Visit [**http://localhost:3000/documentation**](http://localhost:3000/documentation) for interactive Swagger UI and full API reference.

### Authentication

- `POST /api/auth/login` – Login with email/username & password.
- `PUT /api/auth/change-password` – Change current user's password.

### Users

- `POST /api/users` – Register a new user.
- `GET /api/users/me` – Get current user's profile.
- `PUT /api/users/me` – Update current user's profile.
- `GET /api/users/:id` – Get user's public profile by ID.
- `GET /api/users/admin` – List all users (Admin only).
- `GET /api/users/admin/:id` – Get a user's full details by ID (Admin only).
- `PUT /api/users/admin/:id` – Update user by ID (Admin only).
- `DELETE /api/users/admin/:id` – Delete user by ID (Admin only).
- `PATCH /api/users/admin/:id/status` – Set user's status (Admin only).

### Vehicles

- `GET /api/vehicles` – List all vehicles for the current user.
- `POST /api/vehicles` – Create a new vehicle.
- `GET /api/vehicles/:id` – Get vehicle by ID.
- `PUT /api/vehicles/:id` – Update a vehicle.
- `DELETE /api/vehicles/:id` – Delete a vehicle.
- `PUT /api/vehicles/:id/default` – Set a vehicle as the default.
- `GET /api/vehicles/admin` - List all vehicles.
- `GET /api/vehicles/admin/:id` - Get a vehicle by ID.
- `GET /api/vehicles/admin/user/:userId` - List all vehicles for a specific user.
- `POST /api/vehicles/admin` - Create a vehicle for a user.
- `PUT /api/vehicles/admin/:id` - Update a vehicle.
- `DELETE /api/vehicles/admin/:id` - Delete a vehicle.

### Driver Verifications

- `GET /api/driver-verifications/me` – View your own verification record.
- `POST /api/driver-verifications` – Submit a new driver verification request.
- `PUT /api/driver-verifications/:id` – Update your verification request.
- `GET /api/driver-verifications/admin` – List all verification requests.
- `GET /api/driver-verifications/admin/:id` – Get a specific verification record.
- `POST /api/driver-verifications/admin` - Create a verification record for a user.
- `PUT /api/driver-verifications/admin/:id` - Update a verification record.
- `DELETE /api/driver-verifications/admin/:id` - Delete a verification record.
- `PATCH /api/driver-verifications/:id/status` – Approve or reject a driver verification.

### Routes

- `GET /api/routes` – List all available routes (Public).
- `GET /api/routes/:id` – Get route by ID (Public).
- `GET /api/routes/me` - List all routes created by the current logged-in driver.
- `POST /api/routes` – Create a new route (Driver only).
- `PUT /api/routes/:id` – Update your route (Driver only).
- `DELETE /api/routes/:id` – Delete your route (Driver only).
- `GET /api/routes/admin` - List all routes in the system.
- `GET /api/routes/admin/driver/:driverId` - Get all routes for a specific driver.
- `POST /api/routes/admin` - Create a route for a driver.
- `PUT /api/routes/admin/:id` - Update a route.
- `DELETE /api/routes/admin/:id` - Delete a route.

### Bookings

- `GET /api/bookings/me` - List all bookings made by the current user.
- `GET /api/bookings/:id` - Get a booking by its ID.
- `POST /api/bookings` - Create a new booking for a route.
- `PATCH /api/bookings/:id/status` - Update a booking's status.
- `PATCH /api/bookings/:id/cancel` - Cancel a booking.
- `DELETE /api/bookings/:id` - Delete a booking.
- `GET /api/bookings/admin` - List all bookings in the system.
- `GET /api/bookings/admin/:id` - Get a booking by ID.
- `POST /api/bookings/admin` - Create a booking for a user.
- `PUT /api/bookings/admin/:id` - Update a booking.
- `DELETE /api/bookings/admin/:id` - Delete a booking.

### Notifications

- `GET /api/notifications` - List all notifications for the current user.
- `GET /api/notifications/unread-count` - Get the count of unread notifications.
- `PATCH /api/notifications/read-all` - Mark all notifications as read.
- `GET /api/notifications/:id` - Get a notification by ID.
- `PATCH /api/notifications/:id/read` - Mark a notification as read.
- `PATCH /api/notifications/:id/unread` - Mark a notification as unread.
- `DELETE /api/notifications/:id` - Delete a notification.

### Reports & Incidents (Added in Sprint 1 & 2)

- `POST /api/reports` – Submit a new incident report (Driver/Passenger).
- `GET /api/reports/me` – View my submitted reports.
- `GET /api/reports/:id` – View specific report details.
- `PATCH /api/reports/:id/resolve` – Admin resolve a report.
- `PATCH /api/reports/:id/reject` – Admin reject a report.
- `GET /api/admin/reports` – Admin list all reports.
- `GET /api/admin/reports/:id` – Admin view report details.

### Emergency Contacts (Added in Sprint 3)

- `POST /api/emergency-contacts` – Create an emergency contact.
- `GET /api/emergency-contacts/me` – List your emergency contacts.
- `GET /api/emergency-contacts/:id` – Get emergency contact by ID.
- `PUT /api/emergency-contacts/:id` – Update an emergency contact.
- `DELETE /api/emergency-contacts/:id` – Delete an emergency contact.

### Location Sharing (Added in Sprint 3)

- `POST /api/location-sharing` – Start a new live location sharing session.
- `GET /api/location-sharing/active` – Get your active location sharing session.
- `GET /api/location-sharing/history` – View location sharing session history.
- `GET /api/location-sharing/:sessionId` – Get specific location sharing session details.
- `PATCH /api/location-sharing/:sessionId/location` – Update active live location coordinates.
- `POST /api/location-sharing/:sessionId/send` – Manually trigger sending a location update via LINE.
- `PATCH /api/location-sharing/:sessionId/stop` – Manually stop an active sharing session.
- `PATCH /api/location-sharing/:sessionId/expire` – Trigger session expiration (System/CronJob).

### LINE Webhook (Added in Sprint 3)

- `POST /api/line-webhook` – Receive events and manage chat links via LINE Official Account.

### Maps

- `POST /api/maps/directions` – Get directions between locations.
- `GET /api/maps/geocode` – Convert an address to coordinates.
- `GET /api/maps/reverse-geocode` – Convert coordinates to an address.

### Health-check & Metrics

- `GET /health` – Check application & database health.
- `GET /metrics` – Expose Prometheus-compatible metrics.
- `GET /documentation` - Access the Swagger UI API documentation page.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Contact

For questions or feedback, reach out to:

**Email:**
- [jonathandoillon2002@gmail.com](mailto:jonathandoillon2002@gmail.com)
- [seth.s@kkumail.com](mailto:seth.s@kkumail.com)
