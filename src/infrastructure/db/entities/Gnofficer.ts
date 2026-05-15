import mongoose from "mongoose";

const GnOfficerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone_no: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/,
    },
    gn_division_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gn_Division",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    proofFileUrl: {
      type: String,
      required: false,
      description: "URL to proof file (photo or PDF)",
    },
    proofFileName: {
      type: String,
      required: false,
      description: "Original file name of the proof",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const GnOfficer = mongoose.model("GnOfficer", GnOfficerSchema);
export default GnOfficer;
