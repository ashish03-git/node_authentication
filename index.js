import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./config/connectDatabase.js";
import userRoutes from "./routes/userRouts.js";
dotenv.config();
const app = express();
const stringPort = process.env.PORT || 8000; // Change the port number to 8000
const DATABASE_URL = process.env.DATABASE_URL;

// Cors policy
app.use(cors());

// connect database
connectDatabase(DATABASE_URL);

// Json
app.use(express.json());

// Loading routes
app.use("/api/user", userRoutes);

app.get("/", (request, response) => {
  console.log("server is running on port", 5500);
  response.status(200).send("server is running on port " + 5500); // Concatenate the port number with the string
});

app.listen(5500, () => {
  //   console.log(`Server is running on port ${5500}`);
});
