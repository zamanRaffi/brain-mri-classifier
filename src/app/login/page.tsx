import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "../../components/login-form";
import AuthLayout from "../../components/auth-layout";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Log in to NeuroBrainto access your workspace."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Sign Up
          </Link>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
