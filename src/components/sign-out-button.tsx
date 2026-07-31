"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-100"
    >
      Logout
    </button>
  );
}
