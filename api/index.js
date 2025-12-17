import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

dotenv.config();

const app = express();

/* =======================
   CORS CONFIG
======================= */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://movie-matrix10.netlify.app",
      "https://moviemaster-pro.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

/* =======================
   MongoDB SETUP
======================= */
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let moviesCollection;
let watchlistCollection;

async function connectDB() {
  if (!moviesCollection) {
    await client.connect();
    const db = client.db("movieMasterDB");
    moviesCollection = db.collection("movies");
    watchlistCollection = db.collection("watchlist");
    console.log("✅ MongoDB connected");
  }
}
connectDB();

/* =======================
   ROUTES
======================= */

app.get("/", (req, res) => {
  res.send("🎬 MovieMaster Pro Server is Running!");
});

/* ---------- MOVIES ---------- */

// Get all movies
app.get("/movies", async (req, res) => {
  try {
    const movies = await moviesCollection.find().toArray();
    res.send(movies);
  } catch {
    res.status(500).send({ message: "Failed to fetch movies" });
  }
});

// Get single movie
app.get("/movies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const movie = ObjectId.isValid(id)
      ? await moviesCollection.findOne({ _id: new ObjectId(id) })
      : await moviesCollection.findOne({ _id: id });

    if (!movie) return res.status(404).send({ message: "Movie not found" });
    res.send(movie);
  } catch {
    res.status(500).send({ message: "Server error" });
  }
});

// Add movie
app.post("/movies", async (req, res) => {
  try {
    const movie = req.body;
    const result = await moviesCollection.insertOne(movie);
    res.send({ success: true, insertedId: result.insertedId });
  } catch {
    res.status(500).send({ message: "Failed to add movie" });
  }
});

// Update movie
app.put("/movies/:id", async (req, res) => {
  const { id } = req.params;
  const updated = req.body;
  delete updated._id;

  const filter = ObjectId.isValid(id)
    ? { _id: new ObjectId(id) }
    : { _id: id };

  const result = await moviesCollection.updateOne(filter, { $set: updated });

  if (!result.matchedCount)
    return res.status(404).send({ message: "Movie not found" });

  res.send({ success: true });
});

// Delete movie
app.delete("/movies/:id", async (req, res) => {
  const { id } = req.params;

  const filter = ObjectId.isValid(id)
    ? { _id: new ObjectId(id) }
    : { _id: id };

  const result = await moviesCollection.deleteOne(filter);

  if (!result.deletedCount)
    return res.status(404).send({ message: "Movie not found" });

  res.send({ success: true });
});

/* ---------- MY COLLECTION (USER BASED) ---------- */
// GET /my-collection?email=user@email.com
app.get("/my-collection", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const movies = await moviesCollection
      .find({ userEmail: email })
      .toArray();

    res.send(movies);
  } catch {
    res.status(500).send({ message: "Failed to fetch my collection" });
  }
});

/* ---------- WATCHLIST ---------- */

// Add to watchlist
app.post("/watchlist", async (req, res) => {
  try {
    const item = req.body;
    const exists = await watchlistCollection.findOne({
      movieId: item.movieId,
      userEmail: item.userEmail,
    });

    if (exists) {
      return res.status(409).send({ message: "Already in watchlist" });
    }

    const result = await watchlistCollection.insertOne(item);
    res.send({ success: true, insertedId: result.insertedId });
  } catch {
    res.status(500).send({ message: "Failed to add to watchlist" });
  }
});

// Get watchlist
app.get("/watchlist", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const list = await watchlistCollection
      .find({ userEmail: email })
      .toArray();

    res.send(list);
  } catch {
    res.status(500).send({ message: "Failed to fetch watchlist" });
  }
});

// Remove from watchlist
app.delete("/watchlist/:id", async (req, res) => {
  const { id } = req.params;

  const filter = ObjectId.isValid(id)
    ? { _id: new ObjectId(id) }
    : { _id: id };

  const result = await watchlistCollection.deleteOne(filter);

  if (!result.deletedCount)
    return res.status(404).send({ message: "Item not found" });

  res.send({ success: true });
});

/* =======================
   EXPORT (Vercel)
======================= */
export default app;
