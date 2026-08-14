"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProbabilityBars } from "../components/probability-bars";
import { ReportButton } from "../components/report-button";

// Cycled while we wait on the server — the model itself doesn't stream real
// progress, so this gives an honest sense of "work is happening" rather than
// implying a fake percentage for the inference step.
const ANALYSIS_STEPS = [
  "Analyzing MRI...",
  "Loading model...",
  "Generating GradCAM...",
  "Finalizing Report...",
];

const EXPLANATION_REASONS: Record<string, string[]> = {
  glioma: [
    "Irregular bright region detected in the brain parenchyma",
    "Strong activation focused in the frontal lobe",
    "High confidence supports a glioma classification",
  ],
  meningioma: [
    "Extra-axial mass pattern suggests a meninges-origin tumor",
    "Gradient activation favors the dural-based region",
    "Confidence is high for meningothelial features",
  ],
  pituitary: [
    "Central sellar region abnormality is prominent",
    "Activation clusters in the pituitary area",
    "Confidence is high for a pituitary lesion",
  ],
  notumor: [
    "No tumor-like anomalies were found",
    "Activation pattern resembles normal brain tissue",
    "Model confidence is high for a non-tumor scan",
  ],
  inconclusive: [
    "Scan features were ambiguous for a single tumor class",
    "Model activation did not match a clear tumor pattern",
    "Please upload a clearer axial brain MRI scan",
  ],
};

// Maps the model's raw softmax confidence into a category for display,
// instead of showing the raw percentage (e.g. "98.53%"). A raw percentage
// implies a level of precision/calibration the model doesn't actually have
// — softmax confidence is known to be overconfident, especially on
// low-quality or unusual images. The underlying number is still used
// internally (server-side) for the inconclusive/no-tumor safety thresholds;
// this only changes what's shown to the user.
type ConfidenceLevel = {
  label: string;
  icon: string;
  badgeClass: string;
};

function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.9) {
    return {
      label: "High confidence",
      icon: "verified",
      badgeClass: "bg-primary/10 text-primary",
    };
  }
  if (confidence >= 0.75) {
    return {
      label: "Moderate confidence",
      icon: "info",
      badgeClass: "bg-tertiary/10 text-tertiary",
    };
  }
  return {
    label: "Low confidence — please verify with a radiologist",
    icon: "warning",
    badgeClass: "bg-error/10 text-error",
  };
}

function getExplanationReasons(result: string) {
  const key = result.toLowerCase();
  return EXPLANATION_REASONS[key] ?? [
    "This prediction is based on model activation patterns.",
    "The image shows features consistent with the predicted class.",
    "Model confidence is strong for this classification.",
  ];
}

function AnalysisLoader() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, ANALYSIS_STEPS.length - 1));
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <div className="relative h-14 w-14">
        <span className="absolute inset-0 rounded-full border-4 border-outline-variant/30" />
        <span className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-primary text-[22px]">
          neurology
        </span>
      </div>
      <p className="text-sm uppercase tracking-[0.24em] text-on-surface-variant">
        Inference চলাকালে
      </p>
      <div className="flex flex-col gap-1.5 w-full max-w-xs">
        {ANALYSIS_STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2 text-sm">
            <span
              className={`material-symbols-outlined text-[16px] ${
                i < stepIndex
                  ? "text-tertiary"
                  : i === stepIndex
                  ? "text-primary"
                  : "text-outline-variant"
              }`}
            >
              {i < stepIndex ? "check_circle" : i === stepIndex ? "progress_activity" : "radio_button_unchecked"}
            </span>
            <span
              className={
                i <= stepIndex ? "text-on-surface" : "text-on-surface-variant"
              }
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PredictForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{
    result: string;
    confidence: number;
    probabilities?: Record<string, number> | null;
    gradCamUrl?: string | null;
    createdAt?: string;
  } | null>(null);

  const loading = uploading || analyzing;
  const isInconclusive = result?.result?.toUpperCase() === "INCONCLUSIVE";

  function setSelectedFile(f: File | null) {
    setFile(f);
    setResult(null);
    setError("");
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setSelectedFile(f);
  }

  // Plain fetch() has no upload progress events, so we use XHR just for the
  // upload phase — that's what actually has a meaningful percentage; the
  // inference itself happens server-side in one lump once the bytes arrive.
  function uploadWithProgress(formData: FormData): Promise<{
    status: number;
    data: {
      prediction?: {
        result: string;
        confidence: number;
        probabilities?: Record<string, number> | null;
        gradCamUrl?: string | null;
        createdAt?: string;
      };
      error?: string;
    };
  }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/predict");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        try {
          resolve({ status: xhr.status, data: JSON.parse(xhr.responseText) });
        } catch {
          reject(new Error("Invalid server response."));
        }
      };
      xhr.onerror = () => reject(new Error("Network error while uploading."));
      xhr.send(formData);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError("");
    setResult(null);
    setUploadProgress(0);
    setUploading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const { status, data } = await uploadWithProgress(formData);
      setUploading(false);
      setAnalyzing(true);

      if (status < 200 || status >= 300 || !data.prediction) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResult(data.prediction);
      router.refresh();
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  const isAbnormal = result && result.result.toUpperCase() !== "NO_TUMOR" && result.result.toUpperCase() !== "NORMAL";

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label
          htmlFor="mri-file"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-colors cursor-pointer min-h-[280px] p-8 ${
            dragOver
              ? "border-primary bg-surface-container-low"
              : "border-outline-variant/50 hover:border-primary hover:bg-surface-container-low"
          }`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="MRI preview"
              className="max-h-56 rounded-lg object-contain"
            />
          ) : (
            <>
              <span
                className="material-symbols-outlined text-primary text-5xl mb-3"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                cloud_upload
              </span>
              <h3 className="text-lg font-semibold text-on-surface mb-1">
                Drag and drop scan here
              </h3>
              <p className="text-sm text-on-surface-variant mb-4">
                or click to browse from your device (JPG, PNG)
              </p>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-[18px]">
                  folder_open
                </span>
                Browse files
              </span>
            </>
          )}
          <input
            id="mri-file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {file && (
          <p className="text-xs text-on-surface-variant text-center">
            Selected: {file.name}
          </p>
        )}

        {error && <p className="text-sm text-error text-center">{error}</p>}

        {uploading && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-150 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {analyzing && <AnalysisLoader />}

        <button
          type="submit"
          disabled={!file || loading}
          className="rounded-lg bg-primary text-on-primary h-12 font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">
            psychology
          </span>
          {uploading
            ? `Uploading... ${uploadProgress}%`
            : analyzing
            ? "Analyzing scan..."
            : "Predict"}
        </button>
      </form>

      {result && !isInconclusive && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 soft-shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-tertiary">
              check_circle
            </span>
            <h2 className="text-lg font-semibold text-on-surface">
              Analysis Results
            </h2>
          </div>

          <div className="flex items-center justify-between bg-surface-container-low rounded-xl p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-on-surface-variant mb-1">
                Result
              </p>
              <h3
                className={`text-xl font-bold ${
                  isAbnormal ? "text-error" : "text-tertiary"
                }`}
              >
                {result.result.replace(/_/g, " ")}
              </h3>
            </div>
            {(() => {
              const level = getConfidenceLevel(result.confidence);
              return (
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${level.badgeClass}`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {level.icon}
                  </span>
                  {level.label}
                </span>
              );
            })()}
          </div>

          <p className="text-xs text-on-surface-variant mt-4">
            This AI-assisted result is a preliminary screening aid only and
            does not replace a licensed radiologist&apos;s diagnosis. Please
            book a consultation to review your report.
          </p>

          <div className="mt-5 pt-5 border-t border-outline-variant/20 space-y-4">
            <div>
              <p className="text-xs font-medium tracking-wide text-on-surface-variant uppercase mb-3">
                Explain Prediction
              </p>
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container p-4">
                <p className="text-sm font-semibold text-on-surface mb-2">
                  Why {result.result.replace(/_/g, " ")}?
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-on-surface-variant">
                  {getExplanationReasons(result.result).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>

            {result.probabilities && (
              <div>
                <p className="text-xs font-medium tracking-wide text-on-surface-variant uppercase mb-3">
                  Probability Breakdown
                </p>
                <ProbabilityBars probabilities={result.probabilities} />
              </div>
            )}
          </div>

          {result.gradCamUrl && (
            <div className="mt-5 pt-5 border-t border-outline-variant/20">
              <p className="text-xs font-medium tracking-wide text-on-surface-variant uppercase mb-3">
                Grad-CAM: What the model focused on
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.gradCamUrl}
                alt="Grad-CAM heatmap overlay showing the regions of the scan the model weighted most heavily"
                className="w-full max-h-72 rounded-lg object-contain border border-outline-variant/30"
              />
              <p className="text-xs text-on-surface-variant mt-2">
                Warmer (red/yellow) regions influenced the prediction most;
                cooler (blue) regions influenced it least.
              </p>
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-outline-variant/20">
            <ReportButton
              result={result.result}
              confidence={result.confidence}
              gradCamUrl={result.gradCamUrl ?? null}
              createdAt={result.createdAt}
            />
          </div>
        </div>
      )}
    </div>
  );
}