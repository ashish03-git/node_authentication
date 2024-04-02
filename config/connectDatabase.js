import mongoose from "mongoose";

export const connectDatabase = async (database_url) => {
  try {
    let option = {
      dbName: "Voxscribe",
    };
    await mongoose.connect(database_url, option);
    console.log("database connection established");
  } catch (error) {
    console.log("failed to connect to database >>>>>", error);
  }
};
