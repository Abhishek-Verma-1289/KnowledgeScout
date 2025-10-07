export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateData {
  email: string;
  password: string;
  name: string;
  role?: "user" | "admin";
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
}