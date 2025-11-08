// backend/src/models/Alert.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IAlert extends Document {
  message: string;
  userId: mongoose.Types.ObjectId;
}

const alertSchema = new Schema<IAlert>(
  {
    message: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Alert = mongoose.model<IAlert>("Alert", alertSchema);