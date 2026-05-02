import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["GN_OFFICER", "NGO_OFFICER"],
    required: true,
  },
  name: {
    type: String,
  },
  isFirstLogin: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("User", UserSchema);