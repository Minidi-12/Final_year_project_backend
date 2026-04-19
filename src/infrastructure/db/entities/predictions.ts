import mongoose from "mongoose";

const PredictionsSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: false,
  },
  score: {
    type: Number,
    required: false,
  },
});

const Predictions = mongoose.model("Predictions", PredictionsSchema);
export default Predictions;