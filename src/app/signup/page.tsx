import Link from "next/link";
import SignupForm from "../../components/signup-form";
import AuthLayout from "../../components/auth-layout";

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join the future of medical diagnostics with NeuroBrain."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Login
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthLayout>
  );
}
