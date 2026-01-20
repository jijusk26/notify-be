import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/notify-db";
    await mongoose.connect(mongoURI);
  } catch (error) {
    process.exit(1);
  }
};

export default connectDB;
