# One Sentence Reviews

A full stack application for sharing quick one-sentence reviews of books, movies, TV shows, music, and games.

## Features

- **Random Feed** - Discover random reviews on the home page
- **One-Sentence Reviews** - Share your thoughts in just one sentence
- **Media Types** - Review books, movies, TV shows, music, and games
- **Rating System** - 5-star rating system
- **Review Tags** - Tag your reviews (#funny, #serious, #made-me-cry, etc.)
- **Reactions** - React with ❤️ 😂 😭 😲
- **User Authentication** - Register and login to post reviews
- **Responsive Design** - Works on desktop and mobile

## Tech Stack

### Backend
- Node.js + Express
- Postgress
- JWT Authentication

### Frontend
- Vue JS

## Quick Start

### Prerequisites
- Node.js
- Postgress

### Setup

1. Create the database:
```bash
mysql < database.sql
```

2. Install dependencies:
```bash
cd backend
npm install
```

3. Start the server:
```bash
npm start
```

4. Open http://localhost:5173

## Demo Account

- Email: demo@example.com
- Password: password123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user

### Reviews
- `GET /api/reviews/random` - Get random reviews (public feed)
- `GET /api/reviews` - Get all reviews
- `GET /api/reviews/user` - Get user's reviews (authenticated)
- `POST /api/reviews` - Create review (authenticated)
- `PUT /api/reviews/:id` - Update review (authenticated)
- `DELETE /api/reviews/:id` - Delete review (authenticated)

### Reactions
- `POST /api/reviews/:reviewId/reactions` - Toggle reaction
- `GET /api/reviews/:reviewId/reactions` - Get reactions

### Tags
- `GET /api/reviews/tags` - Get all available tags
