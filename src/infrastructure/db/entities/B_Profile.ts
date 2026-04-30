import mongoose from "mongoose";
import { match } from "node:assert";

const B_profileSchema = new mongoose.Schema({
  nic: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone_no: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/,
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
    required: false,
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
    required: false,
    enum: ["Samurdhi", "Elderly Allowance", "Disability Allowance", "Ath Wasuma", "Other"],
    default: [],
  },
  otherIncomeSources: {
    type: String,
    required: false,
    default: "",
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
    required: false,
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
    required: false,
    default: false,
  },
  housing_type: {
    type: String,
    required: true,
    enum: ["own", "rent", "temporary", "no-fixed_shelter"],
  },
  safewater_access: {
    type: Boolean,
    required: false,
    default: false,
  },
  sanitation_access: {
    type: Boolean,
    required: false,
    default: false,
  },
  electricity_access: {
    type: Boolean,
    required: false,
  },
  regular_Healthcare_Access: {
    type: Boolean,
    required: false,
    default: false,
  },
  support_types: {
    type: [String],
    required: true,
    enum: ["financial", "medical", "educational", "sanitation","pre-loved_items","counselling","other"],
  },
  support_description: {
    type: String,
    required: true,
  },
  selfrated_urgency: {
  type: String, 
  required: true,
  enum: ["1", "2", "3", "4", "5"], 
  }

});

const B_Profile = mongoose.model("B_Profile", B_profileSchema);
export default B_Profile;