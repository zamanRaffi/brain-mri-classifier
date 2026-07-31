import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "PATIENT" | "DOCTOR";
    } & DefaultSession["user"];
  }

  interface User {
    role: "PATIENT" | "DOCTOR";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "PATIENT" | "DOCTOR";
  }
}
