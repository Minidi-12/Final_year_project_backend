import mongoose from "mongoose";

const VolunteerSchema = new mongoose.Schema({
  project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  Phone_no: {
    type: String,
    required: true,
  },
  skills: {
    type: [String],
    required: true,
    default: [],
  },
  availability: {
    type: String,
    required: false,
    enum: ["weekdays", "weekends", "flexible"],
  },
  message: {
    type: String,
    required: false
  },
  matchScore: {
    type: Number,
    default: 0,
  },
  recommendedProjects: [{
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    matchScore: Number,
    matchedSkills: [String]
  }],
  registered_at: { type: Date, default: Date.now },
});

const Volunteer = mongoose.model("Volunteer", VolunteerSchema);
export default Volunteer;