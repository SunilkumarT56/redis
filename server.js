import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import redis from "redis";
import axios from "axios";

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors());

// 🟥 Redis Setup
const redisClient = redis.createClient();
redisClient.on("error", (err) => console.log("Redis Client Error", err));
await redisClient.connect(); // Make sure Node supports top-level await

// 🟩 Reusable Cache Function
async function getOrSetCache(key, cb) {
  const cachedData = await redisClient.get(key);

  if (cachedData) {
    console.log("📦 Serving from Redis Cache");
    return JSON.parse(cachedData);
  }

  const freshData = await cb();
  await redisClient.setEx(key, 3600, JSON.stringify(freshData)); // cache 1 hour
  console.log("🌐 Fetched fresh data and stored in cache");

  return freshData;
}

// 🟦 Routes
app.get("/photos", async (req, res) => {
  const { albumID } = req.query;

  try {
    const data = await getOrSetCache(`photos?albumID=${albumID}`, async () => {
      const { data } = await axios.get(
        "https://jsonplaceholder.typicode.com/photos",
        { params: { albumID } }
      );
      return data;
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching photos", error });
  }
});

app.get("/photos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const data = await getOrSetCache(`photo:${id}`, async () => {
      const { data } = await axios.get(
        `https://jsonplaceholder.typicode.com/photos/${id}`
      );
      return data;
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching photo", error });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 App is running on port ${PORT}`);
});