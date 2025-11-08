import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  googleId?: string;
  displayName: string;
  email: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      required: false, // Not every user will have a Google ID if you allow other auth methods
    },
    displayName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Emails should be unique
      match: [/.+\@.+\..+/, "Please fill a valid email address"], // Basic email validation
    },
    image: {
      type: String,
      required: false,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

export const User = mongoose.model<IUser>("User", UserSchema);