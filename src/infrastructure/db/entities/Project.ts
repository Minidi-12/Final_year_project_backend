import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["health", "education", "environment", "community_development", "disaster_relief", "infrastructure", "other"],
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["active", "completed", "on_hold"]
  },
  location: {
    type: String,
    required: true,
  },
  requiredSkills: {
    type: [String],
    required: true,
    default: []
  },
  budget: {
    type: Number,
    required: true,
    default: 0,
  },
  fundsRaised: {
    type: Number,
    required: false,
    default: 0,
  },
  volunteers_needed: {
    type: Number,
    required: true,
    default: 0,
  },
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: false,
  },
  skillsEmbedding: {
    type: [Number],
    default: []
  },
  skillsText: {
    type: String,
    default: ""
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Project = mongoose.model("Project", ProjectSchema);
export default Project;