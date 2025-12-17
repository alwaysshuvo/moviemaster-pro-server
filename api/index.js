import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const app = express();

/* ================= CORS ================= */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://movie-matrix10.netlify.app",
    ],
  })
);

app.use(express.json());

/* ================= MongoDB ================= */
const client = new MongoClient(process.env.MONGODB_URI);

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

/* ================= Routes ================= */

app.get("/", (req, res) => {
  res.send("🎬 MovieMaster Pro Server is Running");
});

/* -------- All Movies -------- */
app.get("/movies", async (req, res) => {
  try {
    await connectDB();
    const movies = await moviesCollection.find().toArray();
    res.send(movies);
  } catch {
    res.status(500).send({ message: "Failed to fetch movies" });
  }
});

/* -------- Movie Details -------- */
app.get("/movies/:id", async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;

    const movie = await moviesCollection.findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : id,
    });

    if (!movie) return res.status(404).send({ message: "Movie not found" });
    res.send(movie);
  } catch {
    res.status(500).send({ message: "Server error" });
  }
});

/* -------- Add Movie -------- */
app.post("/movies", async (req, res) => {
  try {
    await connectDB();
    const result = await moviesCollection.insertOne(req.body);
    res.send({ success: true, insertedId: result.insertedId });
  } catch {
    res.status(500).send({ message: "Failed to add movie" });
  }
});

/* -------- My Collection -------- */
app.get("/my-collection", async (req, res) => {
  try {
    await connectDB();
    const email = req.query.email;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const movies = await moviesCollection
      .find({ userEmail: email })
      .toArray();

    res.send(movies);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to fetch my collection" });
  }
});

/* -------- Watchlist -------- */
app.post("/watchlist", async (req, res) => {
  try {
    await connectDB();
    const result = await watchlistCollection.insertOne(req.body);
    res.send({ success: true, insertedId: result.insertedId });
  } catch {
    res.status(500).send({ message: "Failed to add watchlist" });
  }
});

app.get("/watchlist", async (req, res) => {
  try {
    await connectDB();
    const email = req.query.email;

    const list = await watchlistCollection
      .find({ userEmail: email })
      .toArray();

    res.send(list);
  } catch {
    res.status(500).send({ message: "Failed to fetch watchlist" });
  }
});

/* -------- Remove from Watchlist -------- */
app.delete("/watchlist/:id", async (req, res) => {
  try {
    await connectDB();
    await watchlistCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.send({ success: true });
  } catch {
    res.status(500).send({ message: "Failed to delete watchlist item" });
  }
});

export default app;
