import Link from "next/link";
import Image from "next/image";
import SiteHeader from "../components/marketing/site-header";
import SiteFooter from "../components/marketing/site-footer";

const stats = [
  { icon: "database", value: "500K+", label: "Total MRI Analyses" },
  { icon: "verified", value: "99.2%", label: "Model Accuracy" },
  { icon: "coronavirus", value: "15+", label: "Supported Diseases" },
  { icon: "timer", value: "< 2s", label: "Avg Response Time" },
];

const features = [
  {
    icon: "analytics",
    title: "AI Classification",
    desc: "Instantaneous processing of complex MRI data to identify anomalies with clinical-grade accuracy.",
  },
  {
    icon: "percent",
    title: "Confidence Score",
    desc: "Every classification is accompanied by a probability metric, providing transparent AI reasoning.",
  },
  {
    icon: "visibility",
    title: "Grad-CAM Visualization",
    desc: "Visual heatmaps overlaying the original scan, highlighting the precise regions that influenced the model's prediction.",
  },
  {
    icon: "history",
    title: "Prediction History",
    desc: "Secure, longitudinal tracking of patient scans to monitor disease progression or treatment efficacy over time.",
  },
  {
    icon: "calendar_month",
    title: "Appointment Booking",
    desc: "Seamlessly transition from analysis to action with integrated scheduling for patient follow-ups.",
  },
  {
    icon: "stethoscope",
    title: "Doctor Consultation",
    desc: "Facilitate secure sharing of reports and visualizations with specialist networks for second opinions.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader active="home" />

      <main className="flex-grow pt-[80px]">
        {/* Hero */}
        <section className="relative max-w-[1440px] mx-auto px-4 md:px-12 py-8 md:py-[120px] grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-6 z-10">
            <div className="inline-flex items-center gap-2 bg-surface-container-highest text-primary px-4 py-1 rounded-full w-fit text-xs font-medium tracking-wide">
              <span className="material-symbols-outlined text-[16px]">
                neurology
              </span>
              Advanced Clinical AI
            </div>

            <h1 className="text-[36px] md:text-[48px] leading-[44px] md:leading-[56px] tracking-[-0.02em] font-bold text-on-surface">
              AI-Powered Brain <br /> <span className="text-gradient">MRI Analysis</span>
            </h1>

            <p className="text-base leading-6 text-on-surface-variant max-w-lg">
              Upload your MRI image and receive an AI-assisted classification
              within seconds. Designed for clinical excellence, speed, and
              precision.
            </p>

            <div className="flex flex-wrap gap-4 mt-2">
              <Link
                href="/signup"
                className="bg-primary text-on-primary h-[48px] px-8 rounded-full text-sm font-medium tracking-wide flex items-center hover:bg-on-primary-fixed-variant transition-colors shadow-sm"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="border border-outline-variant text-on-surface bg-transparent h-[48px] px-8 rounded-full text-sm font-medium tracking-wide flex items-center hover:bg-surface-container-low transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="relative w-full h-[320px] md:h-[600px] rounded-xl overflow-hidden shadow-2xl z-10 border border-outline-variant/20">
            <Image
              src="/hero-brain-mri.png"
              alt="A luminous 3D holographic brain projection representing AI-powered NeuroBrainl analysis"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="object-cover"
            />
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-secondary/20 blur-2xl -z-10 rounded-full opacity-50" />
          </div>
        </section>

        {/* Stats */}
        <section className="bg-surface-container-low py-8">
          <div className="max-w-[1440px] mx-auto px-4 md:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/20 soft-shadow flex flex-col items-center justify-center text-center"
                >
                  <span className="material-symbols-outlined text-primary text-[32px] mb-2">
                    {s.icon}
                  </span>
                  <h3 className="text-2xl font-semibold text-on-surface">
                    {s.value}
                  </h3>
                  <p className="text-xs font-medium tracking-widest text-on-surface-variant uppercase mt-1">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-[1440px] mx-auto px-4 md:px-12 py-16 md:py-[120px]">
          <div className="text-center mb-8">
            <h2 className="text-[28px] md:text-[32px] leading-[36px] md:leading-[40px] tracking-[-0.01em] font-semibold text-on-surface mb-2">
              Advanced Diagnostic Tools
            </h2>
            <p className="text-base leading-6 text-on-surface-variant max-w-2xl mx-auto">
              Equipping clinicians with state-of-the-art computational
              analysis for rapid, confident decision-making.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/20 soft-shadow hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary">
                    {f.icon}
                  </span>
                </div>
                <h4 className="text-lg leading-7 font-semibold text-on-surface mb-2">
                  {f.title}
                </h4>
                <p className="text-sm leading-5 text-on-surface-variant">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-12 py-8 mb-8">
          <div className="bg-primary text-on-primary rounded-xl p-10 md:p-16 flex flex-col items-center text-center relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <h2 className="text-[28px] md:text-[32px] leading-[36px] md:leading-[40px] tracking-[-0.01em] font-semibold mb-4 relative z-10">
              Start your analysis now
            </h2>
            <p className="text-base leading-6 text-on-primary/80 mb-8 max-w-xl relative z-10">
              Join thousands of clinicians relying on NeuroBrainfor rapid,
              accurate neurological diagnostics.
            </p>
            <Link
              href="/signup"
              className="bg-surface-container-lowest text-primary h-[48px] px-8 rounded-full text-sm font-medium tracking-wide flex items-center hover:bg-surface-container-low transition-colors shadow-sm relative z-10"
            >
              Create Free Account
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
