import mongoose from "mongoose";

const clusterSchema = new mongoose.Schema({
  cluster_no: {
    type: Number,
    required: true,
  },
  label: {
    type: String,
    required: false,
  },
  avg_urgency_score: {
    type: Number,
    required: false,
  },
  member_count: {
    type: Number,
    required: false,
  },
  dominant_features: {
    type: [String],
    required: false,
  },
  dendrogram_url: {
    type: String,
    required: false,
  },
  generated_at: { type: Date, default: Date.now },
});

const Cluster = mongoose.model("Cluster", clusterSchema);
export default Cluster;