import mongoose from "mongoose";

const News_postSchema = new mongoose.Schema({
  author_name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  image_url: {
    type: String,
    required: false,
  },
  category: {
    type: String,
    required: true,
    enum: ["general", "project_updates", "volunteer_spotlight", "success_stories", "urgent_needs","awareness_campaigns",
          "press_releases"],
  },
  published_at: { type: Date, default: Date.now },
});

const News_post = mongoose.model("News_post", News_postSchema);
export default News_post;