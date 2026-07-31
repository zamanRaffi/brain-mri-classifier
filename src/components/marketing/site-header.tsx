import Link from "next/link";

const navLink = (isActive: boolean) =>
  isActive
    ? "text-primary font-bold border-b-2 border-primary pb-1"
    : "text-on-surface-variant hover:text-primary transition-colors";

export default function SiteHeader({
  active,
}: {
  active?: "home" | "about" | "contact";
}) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm transition-all duration-300 ease-in-out">
      <div className="flex justify-between items-center max-w-[1440px] mx-auto px-4 md:px-12 py-4">
        <Link href="/" className="text-lg font-bold text-primary tracking-tight">
          NeuroBrain
        </Link>

        <div className="hidden md:flex gap-6 items-center text-sm font-medium">
          <Link href="/" className={navLink(active === "home")}>
            Home
          </Link>
          <Link href="/about" className={navLink(active === "about")}>
            About
          </Link>
          <Link href="/contact" className={navLink(active === "contact")}>
            Contact
          </Link>
          <Link
            href="/login"
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            Login
          </Link>
        </div>

        <Link
          href="/signup"
          className="hidden md:block bg-primary text-on-primary px-8 py-2 rounded-full text-sm font-medium tracking-wide hover:opacity-80 transition-opacity"
        >
          Sign Up
        </Link>

        <button className="md:hidden text-primary" aria-label="Open menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </nav>
  );
}
