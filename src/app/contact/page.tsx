import SiteHeader from "../../components/marketing/site-header";
import SiteFooter from "../../components/marketing/site-footer";
import ContactFaq from "../../components/marketing/contact-faq";

export const metadata = {
  title: "Contact - NeuroBrain",
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader active="contact" />

      <main className="flex-grow pt-[80px]">
        {/* Hero */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-12 py-12 md:py-20 text-center">
          <h1 className="text-[28px] md:text-[48px] leading-[36px] md:leading-[56px] tracking-[-0.02em] font-bold text-primary mb-4">
            Contact Our Clinical Support Team
          </h1>
          <p className="text-base leading-6 text-on-surface-variant max-w-2xl mx-auto">
            We provide immediate, priority support for clinical partners and
            patients. Reach out for technical assistance, scan reviews, or
            general inquiries.
          </p>
        </section>

        {/* Contact Grid */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-12 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(37,99,235,0.05)] border border-outline-variant/30 p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <h2 className="text-2xl font-semibold text-primary mb-6">
              Send us a Message
            </h2>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium tracking-wide text-on-surface-variant mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Dr. Aminul Islam"
                    className="w-full h-10 rounded-lg border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all px-4 text-sm text-on-surface outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium tracking-wide text-on-surface-variant mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="aminul.islam@hospital.org"
                    className="w-full h-10 rounded-lg border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all px-4 text-sm text-on-surface outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium tracking-wide text-on-surface-variant mb-2">
                  Subject
                </label>
                <select className="w-full h-10 rounded-lg border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all px-4 text-sm text-on-surface outline-none appearance-none">
                  <option>Technical Support</option>
                  <option>Clinical Consultation</option>
                  <option>Partnership Inquiry</option>
                  <option>Billing Question</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium tracking-wide text-on-surface-variant mb-2">
                  Message
                </label>
                <textarea
                  placeholder="Describe your inquiry..."
                  className="w-full min-h-[150px] rounded-lg border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all p-4 text-sm text-on-surface outline-none resize-y"
                />
              </div>

              <button
                type="submit"
                className="bg-primary text-on-primary px-8 h-12 rounded-lg text-sm font-medium hover:bg-primary-container transition-colors w-full md:w-auto shadow-[0_4px_20px_rgba(37,99,235,0.05)] flex items-center justify-center gap-2"
              >
                <span>Send Message</span>
                <span className="material-symbols-outlined text-sm">
                  send
                </span>
              </button>
            </form>
          </div>

          {/* Info Cards */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(37,99,235,0.05)] border border-outline-variant/30 p-6 flex items-start gap-4 hover:shadow-[0_10px_30px_rgba(37,99,235,0.1)] transition-shadow group">
              <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary shrink-0 group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                <span className="material-symbols-outlined">mail</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-on-surface mb-1">
                  Email Support
                </h3>
                <p className="text-sm text-on-surface-variant mb-2">
                  For general inquiries and clinical support.
                </p>
                <a
                  href="mailto:support@NeuroBrain.ai"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  support@NeuroBrain.ai
                </a>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(37,99,235,0.05)] border border-outline-variant/30 p-6 flex items-start gap-4 hover:shadow-[0_10px_30px_rgba(37,99,235,0.1)] transition-shadow group">
              <div className="w-12 h-12 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary shrink-0 group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
                <span className="material-symbols-outlined">
                  phone_in_talk
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-on-surface mb-1">
                  Priority Phone
                </h3>
                <p className="text-sm text-on-surface-variant mb-2">
                  24/7 technical hotline for urgent scan issues.
                </p>
                <a
                  href="tel:+8801575461957"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  +8801575-461957
                </a>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(37,99,235,0.05)] border border-outline-variant/30 p-6 flex items-start gap-4 hover:shadow-[0_10px_30px_rgba(37,99,235,0.1)] transition-shadow group">
              <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span className="material-symbols-outlined">
                  location_on
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-on-surface mb-1">
                  Hospital HQ
                </h3>
                <p className="text-sm text-on-surface-variant mb-2">
                  NeuroBrainClinical Campus
                </p>
                <address className="text-sm text-on-surface not-italic">
                  Bangladesh University of Business and Technology (BUBT) <br />
                  <br />
                  Road 8, Block B, Rupnagar Residential Area <br />
                  Mirpur, Dhaka 1216 <br />
                  Bangladesh
                </address>
              </div>
            </div>
          </div>
        </section>

        {/* Location Map */}
        <section className="w-full bg-surface-container-low py-12 md:py-20">
          <div className="max-w-[1440px] mx-auto px-4 md:px-12">
            <h2 className="text-2xl md:text-[32px] font-semibold text-primary mb-8 text-center">
              Find Us
            </h2>

            <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(37,99,235,0.05)] border border-outline-variant/30 relative bg-surface-container-highest">
      
              <iframe
                title="NeuroBrain BUBT Campus Map"
                src="https://www.google.com/maps?q=Bangladesh%20University%20of%20Business%20and%20Technology%2C%20Road%208%2C%20Block%20B%2C%20Rupnagar%2C%20Mirpur%2C%20Dhaka%201216&output=embed"
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 bg-surface-container-lowest/90 backdrop-blur-md p-6 rounded-xl shadow-[0_4px_20px_rgba(37,99,235,0.05)] border border-outline-variant/20 max-w-sm pointer-events-none">
                <h3 className="text-lg font-semibold text-primary mb-2">
                  Dhaka Campus
                </h3>
                <p className="text-sm text-on-surface-variant mb-4">
                  Located in the heart of the medical innovation district,
                  offering state-of-the-art diagnostic facilities.
                </p>

                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Bangladesh+University+of+Business+and+Technology%2C+Road+8%2C+Block+B%2C+Rupnagar%2C+Mirpur%2C+Dhaka+1216"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary text-xs font-medium tracking-wide flex items-center gap-1 hover:underline pointer-events-auto"
                >
                Get Directions
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-[800px] mx-auto px-4 md:px-12 py-16 md:py-20">
        <h2 className="text-2xl md:text-[32px] font-semibold text-primary mb-2 text-center">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-sm text-on-surface-variant mb-10">
          Quick answers to common clinical and technical inquiries.
        </p>

        <ContactFaq />
      </section>
    </main >

      <SiteFooter />
    </>
  );
}
