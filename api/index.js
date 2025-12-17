import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

dotenv.config();

const app = express();

/* ✅ CORS */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://movie-matrix10.netlify.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

/* ✅ MongoDB */
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

/* ✅ Mongo connect once */
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

/* ✅ Routes */
app.get("/", (req, res) => {
  res.send("🎬 MovieMaster Pro Server is Running!");
});

app.get("/movies", async (req, res) => {
  try {
    const movies = await moviesCollection.find().toArray();
    res.send(movies);
  } catch (err) {
    res.status(500).send({ message: "Error loading movies" });
  }
});

app.get("/movies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let movie = ObjectId.isValid(id)
      ? await moviesCollection.findOne({ _id: new ObjectId(id) })
      : await moviesCollection.findOne({ _id: id });

    if (!movie) return res.status(404).send({ message: "Movie not found" });
    res.send(movie);
  } catch {
    res.status(500).send({ message: "Server error" });
  }
});

app.post("/movies", async (req, res) => {
  const result = await moviesCollection.insertOne(req.body);
  res.send({ success: true, insertedId: result.insertedId });
});

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


export default app;
