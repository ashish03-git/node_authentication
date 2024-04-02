import mongoose from "mongoose";

// defining the schema
const userSchema = mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  mobile: { type: Number, required: true, trim: true },
  password: { type: String, required: true, trim: true },
});

// Model
export const UserModel = mongoose.model("user", userSchema);
