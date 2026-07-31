export default function SiteFooter() {
  return (
    <footer className="w-full py-8 bg-surface-container-low border-t border-outline-variant/20 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center max-w-[1440px] mx-auto px-4 md:px-12 gap-6">
        <div className="text-2xl font-semibold text-primary">NeuroBrain</div>

        <div className="flex gap-4 items-center text-sm">
          <a
            href="#"
            className="text-on-surface-variant/70 hover:text-secondary hover:underline decoration-secondary underline-offset-4 transition-colors duration-200"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-on-surface-variant/70 hover:text-secondary hover:underline decoration-secondary underline-offset-4 transition-colors duration-200"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="text-on-surface-variant/70 hover:text-secondary hover:underline decoration-secondary underline-offset-4 transition-colors duration-200"
          >
            Security
          </a>
          <a
            href="#"
            className="text-on-surface-variant/70 hover:text-secondary hover:underline decoration-secondary underline-offset-4 transition-colors duration-200"
          >
            Status
          </a>
          <a
            href="#"
            className="text-on-surface-variant/70 hover:text-secondary hover:underline decoration-secondary underline-offset-4 transition-colors duration-200"
          >
            Careers
          </a>
        </div>

        <div className="text-sm text-on-surface-variant">
          © {new Date().getFullYear()} NeuroBrain. Expert Intelligence for
          Clinical Excellence.
        </div>
      </div>
    </footer>
  );
}
