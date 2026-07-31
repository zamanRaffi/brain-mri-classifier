"use client";

import { useState } from "react";

const FAQS = [
  {
    question: "How is patient data privacy handled?",
    answer:
      "All patient data is encrypted end-to-end and strictly complies with HIPAA regulations. Our AI models operate on anonymized data streams, ensuring complete confidentiality during the diagnostic process.",
  },
  {
    question: "What types of MRI scans does NeuroBrainsupport?",
    answer:
      "Our platform currently supports T1, T2, FLAIR, and DWI sequences for neuro-imaging. We specialize in detecting anomalies such as micro-hemorrhages, ischemic strokes, and tumor segmentations.",
  },
  {
    question: "How do I schedule a platform demo for my hospital?",
    answer:
      'You can request a dedicated demo by selecting "Partnership Inquiry" in the contact form above. One of our clinical integration specialists will reach out within 24 hours to schedule a session.',
  },
];

export default function ContactFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {FAQS.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={faq.question}
            className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full px-6 py-4 flex justify-between items-center text-left focus:outline-none"
              aria-expanded={isOpen}
            >
              <span className="text-base md:text-lg font-semibold text-on-surface">
                {faq.question}
              </span>
              <span
                className={`material-symbols-outlined text-primary transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                expand_more
              </span>
            </button>
            <div
              className="px-6 bg-surface-container-low/50 transition-all duration-300 ease-out overflow-hidden"
              style={{
                maxHeight: isOpen ? "500px" : "0px",
                opacity: isOpen ? 1 : 0,
                paddingTop: isOpen ? "0.5rem" : "0px",
                paddingBottom: isOpen ? "1rem" : "0px",
              }}
            >
              <p className="text-sm leading-5 text-on-surface-variant">
                {faq.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
