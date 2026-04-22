import mongoose from "mongoose";

const VolunteerSchema = new mongoose.Schema({
  project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },
  nic: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
  },
  Phone_no: {
    type: String,
    required: false,
  },
  skills: {
    type: [String],
    required: false,
    default: [],
  },
  availability: {
    type: String,
    required: false,
    enum: ["weekdays", "weekends", "flexible"],
  },
  district: {
    type: String,
    required: false,
  },
  vol_status: {
    type: String,
    required: false,
    default: "pending",
    enum: ["active", "inactive", "pending", "rejected", "approved","withdrawn"],
  },
  registered_at: { type: Date, default: Date.now },
});

const Volunteer = mongoose.model("Volunteer", VolunteerSchema);
export default Volunteer;