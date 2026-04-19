import mongoose from "mongoose";


const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error("MongoDB connection string is not defined");
    }
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to the Database");
  } catch (error) {
    if (error instanceof Error) {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    }
  }
};

export default connectDB;