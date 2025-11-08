import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();


export const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Connected to MongoDB");
    });
    await mongoose.connect(`${process.env.MONGO_URI}/redis-data`);
  } catch (err) {
    console.log(err);
  }
};
