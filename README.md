<h1 align="center" style="font-size:40px; font-weight:700; margin-bottom:0;">
  MovieMaster Pro – Backend API
</h1>

<p align="center">
  Node.js · Express · MongoDB · Vercel Serverless API
</p>

<p align="center">
  <a href="https://moviemaster-pro-server-private.vercel.app/">
    Live API
  </a>
</p>

---

## Overview

Backend service for the MovieMaster Pro movie platform.  
Provides movie management, watchlist system, filtering, and user-specific operations.

---

## Tech Stack

- Node.js  
- Express.js  
- MongoDB Atlas  
- Vercel Serverless Functions  
- CORS  
- dotenv  

---

## Installation

```bash
npm install
Run Locally
bash
Copy code
npm start
Environment Variables
Create a .env file:

ini
Copy code
MONGODB_URI=your_mongodb_uri
PORT=3000
API Endpoints
Root
GET /
Returns server status.

Movies
GET /movies – Get all movies
GET /movies/:id – Get a single movie
POST /movies – Add a movie
PUT /movies/:id – Update a movie
DELETE /movies/:id – Delete a movie
GET /movies/filter – Filter movies
GET /movies/user/:email – Movies added by a user

Watchlist
POST /watchlist – Add to watchlist
GET /watchlist/:email – Get user's watchlist
DELETE /watchlist/:email/:id – Remove watchlist item

Deployment
Hosted on Vercel (Serverless Functions).

Base URL:

arduino
Copy code
https://moviemaster-pro-server-private.vercel.app/
Author
Ali Hossen Shuvo
MovieMaster Pro – Backend

yaml
Copy code
