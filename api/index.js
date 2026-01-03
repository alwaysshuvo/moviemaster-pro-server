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

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("🎬 MovieMaster Pro Server is Running");
});

/* ================= MOVIES ================= */

/* ✅ All Movies */
app.get("/movies", async (req, res) => {
  try {
    await connectDB();

    const {
      search = "",
      genre = "",
      minRating = 0,
      maxRating = 10,
      sort = "latest",
    } = req.query;

    const query = {
      rating: { $gte: Number(minRating), $lte: Number(maxRating) },
    };

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (genre) {
      query.genre = genre;
    }

    let sortOption = { createdAt: -1 };
    if (sort === "rating") sortOption = { rating: -1 };
    if (sort === "title") sortOption = { title: 1 };

    const movies = await moviesCollection
      .find(query)
      .sort(sortOption)
      .toArray();

    res.send(movies);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch movies" });
  }
});


/* ✅ Movie Details */
app.get("/movies/:id", async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;

    const movie = await moviesCollection.findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : id,
    });

    if (!movie) {
      return res.status(404).send({ message: "Movie not found" });
    }

    res.send(movie);
  } catch {
    res.status(500).send({ message: "Server error" });
  }
});

/* ✅ Add Movie */
app.post("/movies", async (req, res) => {
  try {
    await connectDB();

    const movie = {
      ...req.body,
      createdAt: new Date(),
    };

    const result = await moviesCollection.insertOne(movie);
    res.send({ success: true, insertedId: result.insertedId });
  } catch {
    res.status(500).send({ message: "Failed to add movie" });
  }
});

/* ✅ Delete Movie */
app.delete("/movies/:id", async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;

    await moviesCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.send({ success: true });
  } catch {
    res.status(500).send({ message: "Failed to delete movie" });
  }
});

/* ================= MY COLLECTION ================= */

app.get("/my-collection", async (req, res) => {
  try {
    await connectDB();
    const email = req.query.email;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const movies = await moviesCollection
      .find({ addedBy: email })
      .toArray();

    res.send(movies);
  } catch {
    res.status(500).send({ message: "Failed to fetch my collection" });
  }
});

/* ================= WATCHLIST ================= */

/* ✅ Add to Watchlist */
app.post("/watchlist", async (req, res) => {
  try {
    await connectDB();

    const { userEmail, movieId } = req.body;

    const exists = await watchlistCollection.findOne({
      userEmail,
      movieId,
    });

    if (exists) {
      return res.send({ success: true, message: "Already added" });
    }

    const item = {
      userEmail,
      movieId,
      createdAt: new Date(),
    };

    const result = await watchlistCollection.insertOne(item);
    res.send({ success: true, insertedId: result.insertedId });
  } catch {
    res.status(500).send({ message: "Failed to add watchlist" });
  }
});

/* ✅ Get Watchlist (by email) */
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

/* ✅ Remove from Watchlist */
app.delete("/watchlist/:id", async (req, res) => {
  try {
    await connectDB();
    await watchlistCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    res.send({ success: true });
  } catch {
    res.status(500).send({ message: "Failed to remove watchlist item" });
  }
});

/* ================= EXPORT ================= */
export default app;

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`🚀 MovieMaster Pro Server running on port ${port}`);
});
