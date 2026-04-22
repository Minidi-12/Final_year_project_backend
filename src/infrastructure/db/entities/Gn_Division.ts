import mongoose from "mongoose"

const gn_DivisionSchema = new mongoose.Schema({

  gn_division_Name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: false,
  },
})

const Gn_Division = mongoose.model("Gn_Division", gn_DivisionSchema);
export default Gn_Division;