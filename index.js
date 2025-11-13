import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

dotenv.config();

console.log("Mongo URI:", process.env.MONGODB_URI);


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
      try {
        const movies = await moviesCollection.find().toArray();
        res.send(movies);
      } catch (err) {
        res.status(500).send({ message: "Error loading movies", error: err });
      }
    });

    app.get("/movies/:id", async (req, res) => {
      const { id } = req.params;
      try {
        let movie = null;
        if (ObjectId.isValid(id)) {
          movie = await moviesCollection.findOne({ _id: new ObjectId(id) });
        }
        if (!movie) {
          movie = await moviesCollection.findOne({ _id: id });
        }
        if (!movie) {
          return res.status(404).send({ message: "Movie not found" });
        }
        res.send(movie);
      } catch (err) {
        res.status(500).send({ message: "Internal Server Error", error: err });
      }
    });

    app.post("/movies", async (req, res) => {
      try {
        const newMovie = req.body;
        const result = await moviesCollection.insertOne(newMovie);
        res.send({
          success: true,
          message: "🎬 Movie added successfully!",
          insertedId: result.insertedId,
        });
      } catch (err) {
        res.status(500).send({ message: "Error adding movie", error: err });
      }
    });

    app.put("/movies/:id", async (req, res) => {
      const { id } = req.params;
      const updated = req.body;

      try {
        if (updated && Object.prototype.hasOwnProperty.call(updated, "_id")) {
          delete updated._id;
        }
        let result;
        if (ObjectId.isValid(id)) {
          result = await moviesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updated }
          );
          console.log(result);
        }
        if (!result || result.matchedCount === 0) {
          result = await moviesCollection.updateOne(
            { _id: id },
            { $set: updated }
          );
        }
        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "Movie not found" });
        }
        res.send({
          success: true,
          message: "✅ Movie updated successfully!",
          modifiedCount: result.modifiedCount,
        });
      } catch (err) {
        res.status(500).send({ message: "Error updating movie", error: err });
      }
    });

    app.delete("/movies/:id", async (req, res) => {
      const { id } = req.params;
      try {
        let result;
        if (ObjectId.isValid(id)) {
          result = await moviesCollection.deleteOne({ _id: new ObjectId(id) });
        }
        if (!result || result.deletedCount === 0) {
          result = await moviesCollection.deleteOne({ _id: id });
        }
        if (result.deletedCount === 0) {
          return res.status(404).send({ message: "Movie not found" });
        }
        res.send({
          success: true,
          message: "🗑️ Movie deleted successfully",
        });
      } catch (err) {
        res.status(500).send({ message: "Error deleting movie", error: err });
      }
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
      try {
        const result = await moviesCollection
          .find({ addedBy: req.params.email })
          .toArray();
        res.send(result);
      } catch (err) {
        res
          .status(500)
          .send({ message: "Error loading user movies", error: err });
      }
    });

    app.post("/watchlist", async (req, res) => {
      try {
        const { userEmail, movieId } = req.body;
        const existing = await watchlistCollection.findOne({
          userEmail,
          movieId,
        });
        if (existing)
          return res.status(400).send({ message: "Already in watchlist" });
        let movie;
        if (ObjectId.isValid(movieId)) {
          movie = await moviesCollection.findOne({
            _id: new ObjectId(movieId),
          });
        } else {
          movie = await moviesCollection.findOne({ _id: movieId });
        }
        if (!movie) return res.status(404).send({ message: "Movie not found" });
        const watchItem = { ...movie, movieId, userEmail, addedAt: new Date() };
        const result = await watchlistCollection.insertOne(watchItem);
        res.send({
          success: true,
          message: "❤️ Added to watchlist",
          insertedId: result.insertedId,
        });
      } catch (err) {
        res
          .status(500)
          .send({ message: "Error adding to watchlist", error: err });
      }
    });

    app.get("/watchlist/:email", async (req, res) => {
      try {
        const result = await watchlistCollection
          .find({ userEmail: req.params.email })
          .toArray();
        res.send(result);
      } catch (err) {
        res
          .status(500)
          .send({ message: "Error fetching watchlist", error: err });
      }
    });

    app.delete("/watchlist/:email/:id", async (req, res) => {
      const { email, id } = req.params;
      try {
        let result;
        if (ObjectId.isValid(id)) {
          result = await watchlistCollection.deleteOne({
            userEmail: email,
            _id: new ObjectId(id),
          });
        }
        if (!result || result.deletedCount === 0) {
          result = await watchlistCollection.deleteOne({
            userEmail: email,
            _id: id,
          });
        }
        if (result.deletedCount === 0) {
          return res.status(404).send({
            message: "Item not found in watchlist",
          });
        }
        res.send({
          success: true,
          message: "❌ Removed from watchlist",
        });
      } catch (err) {
        res
          .status(500)
          .send({ message: "Error removing from watchlist", error: err });
      }
    });

    app.listen(port, () => {
      console.log(`🚀 MovieMaster Pro Server running on port ${port}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}

run().catch(console.dir);
