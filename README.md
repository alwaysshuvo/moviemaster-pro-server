MovieMaster Pro – Backend API

Live API:
https://moviemaster-pro-server-private.vercel.app/

Backend service for the MovieMaster Pro platform.
Built with Node.js, Express, and MongoDB, deployed on Vercel.

Tech Stack

Node.js

Express.js

MongoDB Atlas

Vercel Serverless Functions

CORS

dotenv

Installation
npm install

Run Locally
npm start

Environment Variables

Create a .env file:

MONGODB_URI=your_mongodb_uri
PORT=3000

API Endpoints
Root

GET / – Server status

Movies

GET /movies – Get all movies

GET /movies/:id – Get movie by ID

POST /movies – Add a movie

PUT /movies/:id – Update a movie

DELETE /movies/:id – Delete a movie

GET /movies/filter – Filter movies

GET /movies/user/:email – Movies added by user

Watchlist

POST /watchlist – Add to watchlist

GET /watchlist/:email – Get user watchlist

DELETE /watchlist/:email/:id – Remove watchlist item

Deployment

Backend hosted on Vercel.

Base URL:

https://moviemaster-pro-server-private.vercel.app/

Author

Ali Hossen Shuvo
MovieMaster Pro – Backend