import mongoose from "mongoose";

const B_profileSchema = new mongoose.Schema({
  nic: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ["male", "female", "other"],
  },
  address: {
    type: String,
    required: true,
  },
  gn_division: {
    type: String,
    required: true,
  },
  family_size: {
    type: Number,
    required: true,
  },
  children_under_18: {
    type: Number,
    required: true,
    default: 0,
  },
  monthly_income: {
    type: Number,
    required: true,
  },
  employment_type: {
    type: String,
    required: true,
    enum: ["Government","Private","Self employed","Unemployed","Daily wage"]
  },
  GovtAllowance: {
    type: [String],
    required: true,
    enum: ["Samurdhi", "Elderly Allowance", "Disability Allowance", "Ath Wasuma", "Other"],
  },
  otherIncomeSources: {
    type: [String],
    required: true,
    default: [0]
  },
 chronic_illness: {
    exists: { type: Boolean, default: false },
    description: { type: String, default: "" }
  },
  nearest_hospitalkm: {
    type: Number,
    required: true,
  },
  disabilityInHousehold: {
    type: Boolean,
    required: true,
    default: false,
  },
  highestEducationLevel: {
    type: String,
    required: true,
    enum: ["none", "1-10", "O/Level", "A/Level", "degree", "other"],
  },
  distanceToSchoolKm: {
    type: Number,
    required: true,
    default: 0,
  },
  childrenDroppedOut: {
    type: Boolean,
    required: true,
    default: false,
  },
  housing_type: {
    type: String,
    required: true,
    enum: ["own", "rent", "temporary", "no-fixed_shelter"],
  },
  safewater_access: {
    type: Boolean,
    required: true,
    default: false,
  },
  sanitation_access: {
    type: Boolean,
    required: true,
    default: false,
  },
  electricity_access: {
    type: Boolean,
    required: true,
  },
  regular_Healthcare_Access: {
    type: Boolean,
    required: true,
    default: false,
  },
  support_types: {
    type: [String],
    required: true,
    enum: ["financial", "medical", "educational", "sanitation","pre-loved_items","counselling","other"],
  },
  support_description: {
    type: String,
    required: false,
  },
  selfrated_urgency: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4, 5],
  },

});

const B_Profile = mongoose.model("B_Profile", B_profileSchema);
export default B_Profile;