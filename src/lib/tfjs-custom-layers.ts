// TensorFlow.js's layers runtime (`@tensorflow/tfjs-layers`, used by both
// `@tensorflow/tfjs` and `@tensorflow/tfjs-node`) does not implement Keras's
// `keras.layers.Normalization` preprocessing layer. Loading a model that
// contains one throws "Unknown layer: Normalization" before it ever gets to
// weight loading, which is why every /api/predict call was failing.
//
// This re-implements it (per-channel `(x - mean) / sqrt(variance + eps)`,
// using the `mean`/`variance` weights the model already ships from
// Keras's `adapt()` step) and registers it under the same class name so
// `tf.loadLayersModel` picks it up automatically. Import this module once,
// for its side effect, before the first `loadLayersModel` call.
import type * as tfjsNode from "@tensorflow/tfjs-node";

type TF = typeof tfjsNode;
type LayerArgs = ConstructorParameters<TF["layers"]["Layer"]>[0] & {
  axis?: number | number[];
  invert?: boolean;
};

export function registerNormalizationLayer(tf: TF) {
  // Avoid double-registration if this module is ever imported twice.
  try {
    tf.serialization.registerClass(
      class Normalization extends tf.layers.Layer {
        static className = "Normalization";

        axis: number | number[];
        invertNorm: boolean;
        mean!: ReturnType<TF["layers"]["Layer"]["prototype"]["addWeight"]>;
        variance!: ReturnType<TF["layers"]["Layer"]["prototype"]["addWeight"]>;

        constructor(args: LayerArgs) {
          super(args);
          this.axis = args.axis ?? -1;
          this.invertNorm = args.invert ?? false;
        }

        build(inputShape: number[] | number[][]) {
          const shape = Array.isArray(inputShape[0])
            ? (inputShape[0] as number[])
            : (inputShape as number[]);
          const depth = shape[shape.length - 1] as number;
          this.mean = this.addWeight(
            "mean",
            [depth],
            "float32",
            tf.initializers.zeros(),
            undefined,
            false
          );
          this.variance = this.addWeight(
            "variance",
            [depth],
            "float32",
            tf.initializers.ones(),
            undefined,
            false
          );
          // Not used at inference time, but Keras saves it as a weight, so
          // tfjs-layers' weight-loading step expects a matching variable.
          this.addWeight(
            "count",
            [],
            "int32",
            tf.initializers.zeros(),
            undefined,
            false
          );
          super.build(inputShape);
        }

        call(inputs: tfjsNode.Tensor | tfjsNode.Tensor[]) {
          return tf.tidy(() => {
            const input = Array.isArray(inputs) ? inputs[0] : inputs;
            const std = tf.sqrt(tf.add(this.variance.read(), 1e-7));
            return this.invertNorm
              ? tf.add(tf.mul(input, std), this.mean.read())
              : tf.div(tf.sub(input, this.mean.read()), std);
          });
        }

        computeOutputShape(inputShape: number[]) {
          return inputShape;
        }

        getConfig() {
          const config = super.getConfig();
          Object.assign(config, { axis: this.axis, invert: this.invertNorm });
          return config;
        }
      }
    );
  } catch (err) {
    // "already registered" on hot-reload in dev — safe to ignore.
    if (
      !(err instanceof Error) ||
      !err.message.includes("already registered")
    ) {
      throw err;
    }
  }
}
