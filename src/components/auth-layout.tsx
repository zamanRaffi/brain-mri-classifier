import Image from "next/image";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background flex">
      {/* ================= Left Hero ================= */}
      <aside className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-surface-container-high">
        {/* Hero Image */}
        <Image
          src="/auth-brain.jpeg"
          alt="NeuroBrain"
          fill
          priority
          className="object-cover object-center"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#16376B]/85 via-[#16376B]/15 to-transparent" />

        {/* Branding */}
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/20 backdrop-blur-md">
              <span className="material-symbols-outlined text-cyan-300 text-3xl">
                neurology
              </span>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white">
              NeuroBrain
            </h2>
          </div>

          <p className="max-w-md text-lg leading-8 text-blue-100">
            Pioneering the future of neurological diagnostics with
            clinical-grade precision and advanced artificial intelligence.
          </p>
        </div>
      </aside>

      {/* ================= Right Form ================= */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 xl:p-24 overflow-y-auto bg-background">
        <div className="w-full max-w-[480px] flex flex-col">

          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow">
              <span className="material-symbols-outlined">
                neurology
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-on-surface">
              NeuroBrain
            </h2>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-on-surface mb-2">
              {title}
            </h1>

            <p className="text-on-surface-variant">
              {subtitle}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {children}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-on-surface-variant">
            {footer}
          </div>
        </div>
      </section>
    </main>
  );
}