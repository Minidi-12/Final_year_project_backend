import mongoose from "mongoose";

const DonationSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  nic: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
  },
  phone_no: {
    type: String,
    required: false,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    default: "LKR",
    enum: ["LKR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "AED","SEK"],
  },
  type: {
    type: String,
    required: true,
    enum: ["one-time", "recurring", "in-kind","sponsorship","crowd-funding"],
  },
  status: {
    type: String,
    required: false,
    enum: ["pending", "confirmed", "failed"],
  },
  message: {
    type: String,
    required: false,
  },
  donated_at: { type: Date, default: Date.now },
});

const Donation = mongoose.model("Donation", DonationSchema);
export default Donation;