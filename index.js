import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

dotenv.config();

console.log("Mongo URI:", process.env.MONGODB_URI);

const app = express();
const port = process.env.PORT || 3000;


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://movie-matrix10.netlify.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);


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
      res.send(" MovieMaster Pro Server is Running!");
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
        if (ObjectId.isValid(id)) movie = await moviesCollection.findOne({ _id: new ObjectId(id) });
        if (!movie) movie = await moviesCollection.findOne({ _id: id });
        if (!movie) return res.status(404).send({ message: "Movie not found" });
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
        if (updated._id) delete updated._id;

        let result;
        if (ObjectId.isValid(id)) {
          result = await moviesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updated }
          );
        }
        if (!result || result.matchedCount === 0) {
          result = await moviesCollection.updateOne(
            { _id: id },
            { $set: updated }
          );
        }
        if (result.matchedCount === 0)
          return res.status(404).send({ message: "Movie not found" });

        res.send({
          success: true,
          message: "✅ Movie updated successfully!",
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
        if (result.deletedCount === 0)
          return res.status(404).send({ message: "Movie not found" });

        res.send({ success: true, message: "🗑️ Movie deleted successfully" });
      } catch (err) {
        res.status(500).send({ message: "Error deleting movie", error: err });
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
