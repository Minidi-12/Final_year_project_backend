import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["health", "education", "environment", "community_development", "disaster_relief", "other"],
  },
  subCategory: {
  type: String,
  required: true,
  enum: ["eye_clinic","dental_clinic", "general_clinic","blood_donation","maternal_health","child_health","elderly_care",
    "disability_support","scholarship","tuition_support","school_supplies","digital_literacy","sanitary_access","clean_water",
    "waste_management","housing_support","counselling","legal_aid","youth_development","community_awareness","elder_companionship",
    "women_empowerment","disaster_relief","pre-loved_clothing_distribution","emergency_food","food_assistance","tech_project",
    "microfinance","agriculture_support","entrepreneurship"],
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
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Project = mongoose.model("Project", ProjectSchema);
export default Project;