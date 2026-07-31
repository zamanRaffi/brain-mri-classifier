"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

type ReportButtonProps = {
  result: string;
  confidence: number;
  gradCamUrl?: string | null;
  createdAt?: string | Date;
  /** Provided by the doctor's patient-report views, where the viewer isn't
   * the patient themselves — falls back to the logged-in user's name. */
  patientName?: string;
};

// Fetches an (same-origin) image URL and returns it as a base64 data URL,
// which is what jsPDF's addImage() needs.
async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function ReportButton({
  result,
  confidence,
  gradCamUrl,
  createdAt,
  patientName,
}: ReportButtonProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [doctorNote, setDoctorNote] = useState("");

  const displayName = patientName || session?.user?.name || "Patient";
  const date = createdAt ? new Date(createdAt) : new Date();
  const isAbnormal = !["NO_TUMOR", "NORMAL"].includes(result.toUpperCase());

  async function handleDownload() {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 48;
      let y = 56;

      // Header
      doc.setFillColor(0, 74, 198);
      doc.rect(0, 0, pageWidth, 6, "F");
      doc.setFontSize(18);
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.text("NeuroBrain — AI Prediction Report", margin, y);
      y += 28;

      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 28;

      // Patient details
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Patient Information", margin, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Name: ${displayName}`, margin, y);
      doc.text(`Age: ${age || "—"}`, margin + 220, y);
      doc.text(`Gender: ${gender || "—"}`, margin + 340, y);
      y += 32;

      // Prediction details
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Prediction Summary", margin, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Result: ${result.replace(/_/g, " ")}`, margin, y);
      y += 16;
      doc.text(`Confidence: ${(confidence * 100).toFixed(1)}%`, margin, y);
      y += 16;
      doc.text(`Date: ${date.toLocaleString()}`, margin, y);
      y += 16;
      doc.setTextColor(isAbnormal ? 186 : 0, isAbnormal ? 26 : 100, isAbnormal ? 26 : 66);
      doc.text(
        isAbnormal ? "Flag: Findings require clinical review" : "Flag: No abnormality detected",
        margin,
        y
      );
      doc.setTextColor(20, 20, 20);
      y += 28;

      // Heatmap
      if (gradCamUrl) {
        try {
          const dataUrl = await urlToDataUrl(gradCamUrl);
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text("Grad-CAM Heatmap", margin, y);
          y += 12;
          const imgWidth = pageWidth - margin * 2;
          const imgHeight = imgWidth * 0.6;
          doc.addImage(dataUrl, "PNG", margin, y + 8, imgWidth, imgHeight, undefined, "FAST");
          y += imgHeight + 28;
        } catch {
          // If the image can't be fetched (e.g. offline), skip it rather
          // than failing the whole report.
        }
      }

      // Doctor note
      if (y > 680) {
        doc.addPage();
        y = 56;
      }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Doctor's Note", margin, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const noteLines = doc.splitTextToSize(doctorNote || "No note added.", pageWidth - margin * 2);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 14 + 20;

      // Footer disclaimer
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      const disclaimer = doc.splitTextToSize(
        "This AI-assisted result is a preliminary screening aid only and does not replace a licensed radiologist's diagnosis.",
        pageWidth - margin * 2
      );
      doc.text(disclaimer, margin, 800);

      doc.save(`neurobrain-report-${date.toISOString().slice(0, 10)}.pdf`);
      setOpen(false);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
        Generate Report
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !generating && setOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 w-full max-w-md p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-on-surface">
              Prediction Report
            </h3>
            <p className="text-xs text-on-surface-variant -mt-2">
              A few details for the PDF — leave blank if not applicable.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs text-on-surface-variant">
                Age
                <input
                  type="number"
                  min={0}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface bg-surface-container-lowest input-focus"
                  placeholder="e.g. 42"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-on-surface-variant">
                Gender
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface bg-surface-container-lowest input-focus"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs text-on-surface-variant">
              Doctor Note (optional)
              <textarea
                value={doctorNote}
                onChange={(e) => setDoctorNote(e.target.value)}
                rows={3}
                className="rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface bg-surface-container-lowest input-focus resize-none"
                placeholder="Any clinical remarks to include..."
              />
            </label>

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={generating}
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={generating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {generating ? "hourglass_empty" : "download"}
                </span>
                {generating ? "Generating..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
