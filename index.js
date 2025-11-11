import express from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect(); // 🔥 এই লাইনটা MongoDB connect করে
    console.log("✅ MongoDB connected successfully!");

    const db = client.db("movieMasterDB");
    const moviesCollection = db.collection("movies");

    app.get("/movies", async (req, res) => {
      try {
        const movies = await moviesCollection.find().toArray();
        res.send(movies);
      } catch (err) {
        res.status(500).send({ error: "Failed to load movies", details: err });
      }
    });

    app.post("/movies", async (req, res) => {
      const movie = req.body;
      const result = await moviesCollection.insertOne(movie);
      res.send(result);
    });

    app.put("/movies/:id", async (req, res) => {
      const { id } = req.params;
      const updated = req.body;
      const result = await moviesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updated }
      );
      res.send(result);
    });

    app.delete("/movies/:id", async (req, res) => {
      const { id } = req.params;
      const result = await moviesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/", (req, res) => {
      res.send("🎬 MovieMaster Pro API is running!");
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

run().catch(console.dir);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
