import Link from "next/link";
import Image from "next/image";
import SiteHeader from "../../components/marketing/site-header";
import SiteFooter from "../../components/marketing/site-footer";

export const metadata = {
  title: "About - NeuroBrain",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader active="about" />

      <main className="flex-grow flex flex-col gap-8 pt-[80px]">
        {/* Hero */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-12 py-8 md:py-[80px] grid md:grid-cols-2 gap-6 items-center">
          <div className="flex flex-col gap-4">
            <h1 className="text-[36px] md:text-[48px] leading-[44px] md:leading-[56px] tracking-[-0.02em] font-bold text-on-surface">
              Empowering Clinicians with{" "}
              <span className="text-primary">NeuroBrainl Precision</span>
            </h1>
            <p className="text-base leading-6 text-on-surface-variant max-w-xl">
              NeuroBrainbridges the gap between raw radiological data and
              clinical insight. Our advanced artificial intelligence platform
              processes MRI scans in real-time, highlighting subtle anomalies
              to assist radiologists in delivering faster, more accurate
              diagnoses.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#vision"
                className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-container transition-colors shadow-sm"
              >
                Explore Technology
              </a>
              <Link
                href="/contact"
                className="border border-outline text-primary px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-surface-container-low transition-colors"
              >
                Request Demo
              </Link>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden shadow-lg h-[280px] md:h-[400px] bg-surface-container-high relative">
            <Image
              src="/about-hero-brain.jpg"
              alt="A luminous 3D brain illustration with glowing NeuroBrainl connection points, labeled About - NeuroBrain"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          </div>
        </section>

        {/* Vision */}
        <section id="vision" className="bg-surface-container-low py-8 md:py-[80px]">
          <div className="max-w-3xl mx-auto px-4 md:px-12 text-center">
            <h2 className="text-[28px] md:text-[32px] leading-[36px] md:leading-[40px] tracking-[-0.01em] font-semibold text-on-surface mb-4">
              The Future of AI-Assisted Diagnostics
            </h2>
            <p className="text-base leading-6 text-on-surface-variant">
              We envision a world where diagnostic delays are eliminated. By
              integrating deep learning directly into existing radiological
              workflows, we act as a tireless second pair of eyes, ensuring
              that critical neurological conditions are detected at their
              earliest, most treatable stages.
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-12 py-6 text-center border-t border-outline-variant/30 mt-8">
          <p className="text-xs font-medium tracking-wide text-on-surface-variant bg-surface-container py-1.5 px-4 rounded-full inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[16px]">
              info
            </span>
            This AI system is intended to assist medical professionals and
            should not replace clinical diagnosis.
          </p>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
