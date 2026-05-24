import mongoose from "mongoose";

const News_postSchema = new mongoose.Schema({

  post_type: {
    type: String,
    required: true,
    enum: ["activity", "campaign", "upcoming"],
  },

  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  image: {
    type: String,
    required: false,
    default: "",
  },

  author_name: {
    type: String,
    required: false,
    default: "Admin",
  },

  date: {
    type: String,
    required: false,
    default: "",
  },
  location: {
    type: String,
    required: false,
    default: "",
  },

  time: {
    type: String,
    required: false,
    default: "",
  },
  capacity: {
    type: String,
    required: false,
    default: "",
  },

  tag: {
    type: String,
    required: false,
    default: "",
  },

  impact: {
    type: String,
    required: false,
    default: "",
  },

  published_at: { type: Date, default: Date.now },
});

const News_post = mongoose.model("News_post", News_postSchema);
export default News_post;