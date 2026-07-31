import path from "path";
import nodeUtil from "util";
import { registerNormalizationLayer } from "./tfjs-custom-layers";

// @tensorflow/tfjs-node's native backend (nodejs_kernel_backend.js) still
// calls the long-deprecated `util.isNullOrUndefined` / `util.isArray` from
// Node's built-in `util` module on almost every op (e.g. via
// createTensorsTypeOpAttr). Recent Node.js versions finally dropped those
// deprecated (DEP0013) methods, so every op throws
// "TypeError: (0 , util_1.isNullOrUndefined) is not a function" — this
// isn't specific to our model, it breaks tfjs-node's native backend
// entirely on newer Node. Patch them back before tfjs-node is imported,
// since it grabs the same cached `util` module instance via require("util").
type NodeUtilWithLegacy = typeof nodeUtil & {
  isNullOrUndefined?: (v: unknown) => boolean;
  isArray?: (v: unknown) => boolean;
};
const legacyUtil = nodeUtil as NodeUtilWithLegacy;
if (typeof legacyUtil.isNullOrUndefined !== "function") {
  legacyUtil.isNullOrUndefined = (v: unknown) => v === null || v === undefined;
}
if (typeof legacyUtil.isArray !== "function") {
  legacyUtil.isArray = (v: unknown) => Array.isArray(v);
}

// Lazily import @tensorflow/tfjs-node — it has native bindings, so we only
// want to pay that cost on the server, on first actual prediction.
type TFNamespace = typeof import("@tensorflow/tfjs-node");

export const CLASS_NAMES = [
  "glioma",
  "meningioma",
  "notumor",
  "pituitary",
] as const;

export type TumorClass = (typeof CLASS_NAMES)[number];

// Below this confidence, we report INCONCLUSIVE instead of the raw top
// class — safer default for a clinical-facing tool.
const CONFIDENCE_THRESHOLD = 0.6;

// For the "no tumor" class, require an extremely strong signal before
// committing to NO_TUMOR. Many non-brain or poor-quality images can still
// resemble the background/no-tumor category, so only very high-confidence,
// high-margin no-tumor predictions are accepted.
const NO_TUMOR_MIN_CONFIDENCE = 0.98;
const NO_TUMOR_MIN_MARGIN = 0.35;
const NO_TUMOR_MIN_PROBABILITY = 0.97;

// If the uploaded image is likely a color photo or contains a strong color
// signal, classify it as inconclusive instead of no tumor.
const COLOR_PHOTO_SATURATION_THRESHOLD = 0.12;
const COLOR_PHOTO_DIFF_THRESHOLD = 0.10;

export const IMAGE_SIZE = 224;

const MODEL_PATH = path.join(
  process.cwd(),
  "ml-model",
  "brain-tumor-model",
  "model.json"
);

let tfPromise: Promise<TFNamespace> | null = null;
// Exported so other server-only modules (e.g. lib/gradcam.ts) can reuse the
// same tfjs-node import instead of paying the native-binding load cost twice.
export function getTf(): Promise<TFNamespace> {
  if (!tfPromise) {
    tfPromise = import("@tensorflow/tfjs-node").then((tf) => {
      // model.json contains a Keras `Normalization` layer, which tfjs-layers
      // doesn't implement out of the box — register our polyfill before
      // anything tries to load the model.
      registerNormalizationLayer(tf);
      return tf;
    });
  }
  return tfPromise;
}

let modelPromise: Promise<import("@tensorflow/tfjs-node").LayersModel> | null =
  null;
// Exported so lib/gradcam.ts can reuse the already-loaded hybrid model
// instead of loading a second copy of the weights into memory.
export async function getModel() {
  if (!modelPromise) {
    const tf = await getTf();
    modelPromise = tf.loadLayersModel(`file://${MODEL_PATH}`);
  }
  return modelPromise;
}

export type PredictionOutcome = {
  /** Raw top class from the model, before the confidence-threshold override */
  topClass: TumorClass;
  /** Final label to store/show — may be "inconclusive" if confidence is low */
  label: TumorClass | "inconclusive";
  confidence: number;
  probabilities: Record<TumorClass, number>;
};

function getImageColorMetrics(
  tf: TFNamespace,
  decodedImage: import("@tensorflow/tfjs-node").Tensor3D
) {
  const floatImg = decodedImage.toFloat().div(255);
  const maxRGB = floatImg.max(2);
  const minRGB = floatImg.min(2);
  const delta = maxRGB.sub(minRGB);
  const saturation = tf.where(
    maxRGB.greater(0),
    delta.div(maxRGB),
    tf.zerosLike(delta)
  );
  const meanSaturation = saturation.mean();

  const gray = floatImg.mean(2);
  const colorDiff = floatImg.sub(gray.expandDims(2)).abs().mean();

  return { meanSaturation, meanColorDiff: colorDiff };
}

/**
 * Runs the trained hybrid EfficientNetB3 + MobileNetV2 model on an uploaded
 * MRI image buffer. The model has Rescaling/Normalization baked in as its
 * first layers, so we only need to resize to 224x224 RGB — no manual /255
 * normalization here.
 */
export async function predictMri(imageBuffer: Buffer): Promise<PredictionOutcome> {
  const tf = await getTf();
  const model = await getModel();

  const { prediction, meanSaturation, meanColorDiff } = tf.tidy(() => {
    const decoded = tf.node.decodeImage(imageBuffer, 3) as import("@tensorflow/tfjs-node").Tensor3D;
    const colorMetrics = getImageColorMetrics(tf, decoded);
    const resized = tf.image.resizeBilinear(decoded, [IMAGE_SIZE, IMAGE_SIZE]);
    const batched = resized.toFloat().div(255).expandDims(0);
    return {
      prediction: model.predict(batched) as import("@tensorflow/tfjs-node").Tensor,
      meanSaturation: colorMetrics.meanSaturation,
      meanColorDiff: colorMetrics.meanColorDiff,
    };
  });

  const [probsArray, saturationArray, colorDiffArray] = await Promise.all([
    prediction.data(),
    meanSaturation.data(),
    meanColorDiff.data(),
  ]);
  prediction.dispose();
  meanSaturation.dispose();
  meanColorDiff.dispose();

  const meanSaturationValue = saturationArray[0];
  const meanColorDiffValue = colorDiffArray[0];
  const isLikelyColorPhoto =
    meanSaturationValue > COLOR_PHOTO_SATURATION_THRESHOLD ||
    meanColorDiffValue > COLOR_PHOTO_DIFF_THRESHOLD;

  const probabilities = Object.fromEntries(
    CLASS_NAMES.map((name, i) => [name, probsArray[i]])
  ) as Record<TumorClass, number>;

  let topIdx = 0;
  for (let i = 1; i < probsArray.length; i++) {
    if (probsArray[i] > probsArray[topIdx]) topIdx = i;
  }
  const topClass = CLASS_NAMES[topIdx];
  const confidence = probsArray[topIdx];
  const secondBestConfidence = probsArray
    .filter((_, i) => i !== topIdx)
    .sort((a, b) => b - a)[0] ?? 0;
  const margin = confidence - secondBestConfidence;

  const shouldReturnInconclusive =
    confidence < CONFIDENCE_THRESHOLD ||
    (topClass === "notumor" &&
      (confidence < NO_TUMOR_MIN_CONFIDENCE ||
        margin < NO_TUMOR_MIN_MARGIN ||
        probabilities.notumor < NO_TUMOR_MIN_PROBABILITY)) ||
    isLikelyColorPhoto;

  const label: TumorClass | "inconclusive" =
    shouldReturnInconclusive ? "inconclusive" : topClass;

  return { topClass, label, confidence, probabilities };
}
