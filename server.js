import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import redis from "redis";
import axios from "axios";
import { connectDB } from "./db.js";
import Post from "./Post.js";

dotenv.config();
await connectDB();

const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
const redisUrl = "redis://localhost:6379";

const redisClient = redis.createClient(redisUrl); // setup the redis client using the 6379
redisClient.on("error", (err) => console.log("Redis Client Error", err));
await redisClient.connect(); //connect redis client

app.post("/post", async (req, res) => {
  const { key, value } = req.body;
  try {
    const post = new Post({ key, value });
    await post.save();
    return res.send("ok");
  } catch (err) {
    console.log(err);
  }
});
app.post("/postInDetail", async (req, res) => {
  const { key, name, age } = req.body;
  try {
    const post = new Post({ key, name, age });
    await post.save();
    return res.send("ok");
  } catch (err) {
    console.log(err);
  }
});

app.get("/:key", async (req, res) => {
  const { key } = req.params;
  try {
    const response = await redisClient.get(key); // get the value using the key stored in redis

    if (!response) {
      const post = await Post.findOne({ key });
      if (post) {
        await redisClient.setEx(key, 60, post.value); // // set the value (key value pair) because redis is a key value store with expiry date in seconds,
        return res.json(post.value);
      }
    }
    res.json(response);
  } catch (err) {
    console.log(err);
  }
});

app.get("/detail/:key", async (req, res) => {
  const { key } = req.params;
  try {
    const response = await redisClient.hGetAll(key); // get the value using the key stored in redis

    if (Object.keys(response).length === 0) {
      const post = await Post.findOne({ key });
      if (post) {
        // Store hash in Redis
        await redisClient.hSet(key, {
          name: post.name,
          age: post.age,
        });
        await redisClient.expire(key, 60); //set expiry manually

        console.log(`Cached new data for key: ${key}`);
        return res.json({ key: post.key, name: post.name, age: post.age });
      } else {
        return res.status(404).json({ message: "Post not found" });
      }
    }
    res.json({ ...response });
  } catch (err) {
    console.log(err);
  }
});

app.listen(PORT, () => {
  console.log("Server is running on port 8080");
});
