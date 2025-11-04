// backend/src/models/Alert.ts
import mongoose, { Schema } from "mongoose";

const alertSchema = new Schema(
  {
    message: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const Alert = mongoose.model("Alert", alertSchema);