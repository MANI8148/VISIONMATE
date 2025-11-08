export interface User {
  _id: string;
  googleId?: string;
  displayName: string;
  email: string;
  image?: string;
  createdAt: string; // Dates are often serialized as strings
  updatedAt: string;
}