import mongoose from "mongoose";

const Req_EvidenceSchema = new mongoose.Schema({
  fileUrl: {
    type: String,
    required: true,
  },
  file_name: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  uploaded_at: { type: Date, default: Date.now },
});

const Req_Evidence = mongoose.model("Req_Evidence", Req_EvidenceSchema);
export default Req_Evidence;