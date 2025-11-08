import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  age: {
    type: Number,
    required: false,
  },
});

const Post = mongoose.model("Post", postSchema);

export default Post;
