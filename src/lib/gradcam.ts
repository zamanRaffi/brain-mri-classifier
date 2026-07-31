import { getTf, getModel, CLASS_NAMES, IMAGE_SIZE, type TumorClass } from "./model";

type Tensor = import("@tensorflow/tfjs-node").Tensor;
type Tensor3D = import("@tensorflow/tfjs-node").Tensor3D;
type LayersModel = import("@tensorflow/tfjs-node").LayersModel;
type SymbolicTensor = import("@tensorflow/tfjs-node").SymbolicTensor;

// The model is a two-branch hybrid: an EfficientNetB3 branch and a
// MobileNetV2 branch, each pooled to a 256-d vector, concatenated, passed
// through a squeeze/excite-style attention gate, then a small classifier
// head. Grad-CAM needs a spatial (H x W x C) feature map, so we hook the
// last conv activation of *each* branch — both happen to output a 7x7 map
// for a 224x224 input — and fuse the two resulting saliency maps.
const EFFNET_ACT_LAYER = "top_activation"; // EfficientNetB3 branch, [1,7,7,1536]
const MOBILENET_ACT_LAYER = "out_relu"; // MobileNetV2 branch, [1,7,7,1280]

// Layers that sit between each branch's conv activation and the point where
// the two branches are concatenated ("merge"), in forward order. Taken
// directly from the model's graph config (model.json).
const EFFNET_HEAD_LAYERS = [
  "gap_effnet",
  "dense_effnet",
  "batch_normalization_3",
  "dropout_4",
];
const MOBILENET_HEAD_LAYERS = [
  "gap_mobilenet",
  "dense_mobilenet",
  "batch_normalization_4",
  "dropout_5",
];
// Layers from the merged vector to the final softmax output.
const CLASSIFIER_HEAD_LAYERS = [
  "dense_2",
  "batch_normalization_5",
  "dropout_6",
  "dense_3",
  "dropout_7",
  "output",
];

let backboneModelPromise: Promise<LayersModel> | null = null;
let headModelPromise: Promise<LayersModel> | null = null;

/**
 * Lazily builds two small helper models that share weights with the main
 * classifier (via `model.getLayer(name)`, no weights are copied):
 *  - backboneModel: image -> [effnet activation map, mobilenet activation map]
 *  - headModel: [effnet activation map, mobilenet activation map] -> class probabilities
 * Splitting the graph this way lets us take gradients of the class score
 * with respect to the two spatial activation maps, which is exactly what
 * Grad-CAM needs.
 */
async function getGradCamModels(): Promise<{
  tf: Awaited<ReturnType<typeof getTf>>;
  backboneModel: LayersModel;
  headModel: LayersModel;
}> {
  const tf = await getTf();
  const model = await getModel();

  if (!backboneModelPromise) {
    backboneModelPromise = (async () => {
      const effAct = model.getLayer(EFFNET_ACT_LAYER).output as SymbolicTensor;
      const mobAct = model.getLayer(MOBILENET_ACT_LAYER).output as SymbolicTensor;
      return tf.model({ inputs: model.inputs, outputs: [effAct, mobAct] });
    })();
  }

  if (!headModelPromise) {
    headModelPromise = (async () => {
      const effChannels = 1536;
      const mobChannels = 1280;
      const spatial = IMAGE_SIZE / 32; // 7 for a 224px input, matches both branches

      const effInput = tf.input({ shape: [spatial, spatial, effChannels] });
      const mobInput = tf.input({ shape: [spatial, spatial, mobChannels] });

      // The Layers API's typings for `apply()` don't cleanly express
      // "SymbolicTensor in, SymbolicTensor out" across a chain of calls, so
      // we use `any` for these intermediate graph nodes; the actual runtime
      // values are always SymbolicTensors here.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let e: any = effInput;
      for (const name of EFFNET_HEAD_LAYERS) {
        e = model.getLayer(name).apply(e);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let m: any = mobInput;
      for (const name of MOBILENET_HEAD_LAYERS) {
        m = model.getLayer(name).apply(m);
      }

      const merged = model.getLayer("merge").apply([e, m]) as SymbolicTensor;
      const attnSqueeze = model
        .getLayer("attn_squeeze")
        .apply(merged) as SymbolicTensor;
      const attnExcite = model
        .getLayer("attn_excite")
        .apply(attnSqueeze) as SymbolicTensor;
      const attended = model
        .getLayer("attended")
        .apply([merged, attnExcite]) as SymbolicTensor;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let out: any = attended;
      for (const name of CLASSIFIER_HEAD_LAYERS) {
        out = model.getLayer(name).apply(out);
      }

      return tf.model({ inputs: [effInput, mobInput], outputs: out });
    })();
  }

  const [backboneModel, headModel] = await Promise.all([
    backboneModelPromise,
    headModelPromise,
  ]);
  return { tf, backboneModel, headModel };
}

/**
 * Runs Grad-CAM for `targetClass` on the given MRI image and returns a PNG
 * (as a Buffer) showing the original scan with a heatmap overlay of the
 * regions that most influenced the model's decision.
 */
export async function generateGradCamPng(
  imageBuffer: Buffer,
  targetClass: TumorClass
): Promise<Buffer> {
  const { tf, backboneModel, headModel } = await getGradCamModels();
  const targetClassIdx = CLASS_NAMES.indexOf(targetClass);

  // Decode + resize once. `batched` (fed to the model) is scaled to [0,1]
  // to match how the model was actually trained (see model.ts for why);
  // `displayImage` stays 0-255 raw since it's just the base image for the
  // visual overlay.
  const { batched, displayImage } = tf.tidy(() => {
    const decoded = tf.node.decodeImage(imageBuffer, 3) as Tensor3D;
    const resized = tf.image.resizeBilinear(decoded, [IMAGE_SIZE, IMAGE_SIZE]);
    return {
      batched: tf.keep(resized.toFloat().div(255).expandDims(0)),
      displayImage: tf.keep(resized.toFloat()),
    };
  });

  const [effActRaw, mobActRaw] = backboneModel.predict(batched) as Tensor[];
  const effAct = tf.keep(effActRaw);
  const mobAct = tf.keep(mobActRaw);
  const targetIdx = tf.tensor1d([targetClassIdx], "int32");

  // tf.grads records every op run inside this function and differentiates
  // the (scalar) class score with respect to both activation maps.
  const gradFn = tf.grads((e: Tensor, m: Tensor) => {
    const preds = headModel.apply([e, m]) as Tensor; // [1, numClasses]
    return preds.gather(targetIdx, 1).sum();
  });
  const [effGrad, mobGrad] = gradFn([effAct, mobAct]);

  const heatmap = tf.tidy(() => {
    const camFromBranch = (activation: Tensor, grad: Tensor) => {
      // Global-average-pool the gradient over H,W to get one importance
      // weight per channel, then take a weighted sum of the activation map
      // over channels — the standard Grad-CAM recipe.
      const weights = grad.mean([1, 2]); // [1, C]
      const weighted = activation.mul(weights.reshape([1, 1, 1, -1]));
      const cam = weighted.sum(-1).squeeze([0]).relu(); // [H, W]
      const min = cam.min();
      const max = cam.max();
      return cam.sub(min).div(max.sub(min).add(1e-8)); // normalized to [0, 1]
    };

    const camEff = camFromBranch(effAct, effGrad);
    const camMob = camFromBranch(mobAct, mobGrad);

    const camEffResized = tf.image.resizeBilinear(camEff.expandDims(-1) as Tensor3D, [
      IMAGE_SIZE,
      IMAGE_SIZE,
    ]);
    const camMobResized = tf.image.resizeBilinear(camMob.expandDims(-1) as Tensor3D, [
      IMAGE_SIZE,
      IMAGE_SIZE,
    ]);

    // Both branches see the same input and produce a same-size saliency
    // map, so we fuse them with a simple average.
    return camEffResized.add(camMobResized).div(2).squeeze([-1]) as import("@tensorflow/tfjs-node").Tensor2D;
  });

  const overlayImage = tf.tidy(() => {
    // Cheap jet-style colormap: red/green/blue triangle waves over the 0..1
    // heatmap value, so low activation reads blue and high activation reads
    // red, with green in the middle.
    const toChannel = (center: number) =>
      heatmap.mul(4).sub(center).abs().mul(-1).add(1.5).clipByValue(0, 1);
    const heatColor = tf
      .stack([toChannel(3), toChannel(2), toChannel(1)], -1)
      .mul(255); // [224, 224, 3]

    const alpha = 0.45;
    const overlay = heatColor.mul(alpha).add(displayImage.mul(1 - alpha));
    return overlay.clipByValue(0, 255).toInt() as Tensor3D;
  });

  const pngBytes = await tf.node.encodePng(overlayImage);

  tf.dispose([
    batched,
    displayImage,
    effAct,
    mobAct,
    effGrad,
    mobGrad,
    heatmap,
    overlayImage,
    targetIdx,
  ]);

  return Buffer.from(pngBytes);
}
