import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

export default NextAuth(authConfig).auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isPatientRoute = pathname.startsWith("/patient");
  const isDoctorRoute = pathname.startsWith("/doctor");

  // Not logged in but trying to reach a protected area -> send to login
  if (!isLoggedIn && (isPatientRoute || isDoctorRoute)) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in but wrong role -> bounce to their own dashboard
  if (isLoggedIn && isPatientRoute && role !== "PATIENT") {
    return NextResponse.redirect(new URL("/doctor/dashboard", req.nextUrl.origin));
  }
  if (isLoggedIn && isDoctorRoute && role !== "DOCTOR") {
    return NextResponse.redirect(new URL("/patient/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/patient/:path*", "/doctor/:path*"],
};
