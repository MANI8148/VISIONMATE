git remote add origin https://github.com/MANI8148/LINK-SPACE.git
git branch -M main
git push -u origin mainimport mongoose, { Schema, Document } from "mongoose";

export interface IChat extends Document {
  userId: mongoose.Types.ObjectId;
  role: "user" | "model";
  message: string;
  createdAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "model"], required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const Chat = mongoose.model<IChat>("Chat", ChatSchema);