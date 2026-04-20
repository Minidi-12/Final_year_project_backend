import mongoose from "mongoose";
import B_Profile from "./B_Profile";
import Req_Evidence from "./Req_Evidence";
import Predictions from "./predictions";

const B_reqSchema = new mongoose.Schema({
  b_profile: {
    type: [B_Profile.schema],
    required: true,
  },
  req_evidence: {
    type: [Req_Evidence.schema],
    required: true,
    default: [],
  },
  gn_division_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Gn_Division",
    required: true,
  },
  predictions: {
    type: [Predictions.schema],
    required: false,
  },
  status: {
    type: String,
    required: true,
    enum: ["pending","gn_assigned", "verified", "flagged", "resolved", "rejected"],
  },
  gn_verified: {
    type: Boolean,
    default: false,
  },
  reference_no: {
    type: String,
    required: true,
    unique: true,
  },
  submitted_at: { type: Date, default: Date.now },
  urgency_score: {
    type: Number,
    required: false,
    default:"0",
  },
  urgency_label: {
    type: String,
    required: false,
    enum: ["low", "medium", "high"],
    default:"",
  },
  cluster_no: {
    type: Number,
    required: false,
  },
 pca_x: {
    type: Number,
    required: false,
    default: null,
  },
  pca_y: {
    type: Number,
    required: false,
    default: null,
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const B_Req = mongoose.model("B_Req", B_reqSchema);
export default B_Req;