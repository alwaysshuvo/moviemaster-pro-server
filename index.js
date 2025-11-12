import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("movieMasterDB");
    const moviesCollection = db.collection("movies");
    const watchlistCollection = db.collection("watchlist");

    app.get("/", (req, res) => {
      res.send("🎬 MovieMaster Pro Server is Running!");
    });

    app.get("/movies", async (req, res) => {
      const movies = await moviesCollection.find().toArray();
      res.send(movies);
    });

    app.get("/movies/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const movie = await moviesCollection.findOne({ _id: new ObjectId(id) });
        res.send(movie);
      } catch (err) {
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    app.post("/movies", async (req, res) => {
      const newMovie = req.body;
      const result = await moviesCollection.insertOne(newMovie);
      res.send(result);
    });

    app.put("/movies/:id", async (req, res) => {
      const id = req.params.id;
      const updated = req.body;
      try {
        const result = await moviesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updated }
        );
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Error updating movie", error: err });
      }
    });

    app.delete("/movies/:id", async (req, res) => {
      const id = req.params.id;
      const result = await moviesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/movies/filter", async (req, res) => {
      try {
        const { genres, minRating, maxRating, language, country } = req.query;
        const query = {};

        if (genres) {
          const genreArray = genres.split(",").map((g) => g.trim());
          query.genre = { $in: genreArray };
        }

        if (minRating || maxRating) {
          query.rating = {};
          if (minRating) query.rating.$gte = parseFloat(minRating);
          if (maxRating) query.rating.$lte = parseFloat(maxRating);
        }

        if (language) query.language = language;
        if (country) query.country = country;

        const result = await moviesCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Error filtering movies", error: err });
      }
    });

    app.get("/movies/user/:email", async (req, res) => {
      const result = await moviesCollection
        .find({ addedBy: req.params.email })
        .toArray();
      res.send(result);
    });

    app.post("/watchlist", async (req, res) => {
      const { userEmail, movieId } = req.body;
      const existing = await watchlistCollection.findOne({ userEmail, movieId });
      if (existing)
        return res.status(400).send({ message: "Already in watchlist" });

      const movie = await moviesCollection.findOne({ _id: new ObjectId(movieId) });
      if (!movie) return res.status(404).send({ message: "Movie not found" });

      const watchItem = { ...movie, movieId, userEmail, addedAt: new Date() };
      const result = await watchlistCollection.insertOne(watchItem);
      res.send(result);
    });

    app.get("/watchlist/:email", async (req, res) => {
      const result = await watchlistCollection
        .find({ userEmail: req.params.email })
        .toArray();
      res.send(result);
    });

    app.delete("/watchlist/:email/:id", async (req, res) => {
      const { email, id } = req.params;
      const result = await watchlistCollection.deleteOne({
        userEmail: email,
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.listen(port, () => {
      console.log(`🚀 MovieMaster Pro Server running on port ${port}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}

run().catch(console.dir);
