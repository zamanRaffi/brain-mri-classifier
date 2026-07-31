# MRI Prediction Platform

Next.js (App Router) + Prisma/PostgreSQL + Auth.js, with your trained brain
tumor MRI model running in-process via `@tensorflow/tfjs-node` — no separate
Python service needed.

## Structure

```
mri-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx, about/, contact/     # Marketing pages
│   │   ├── login/, signup/                # Auth pages
│   │   ├── patient/                       # Patient area (protected)
│   │   │   ├── dashboard/, predict-mri/, history/
│   │   │   ├── book-appointment/, chat/, profile/
│   │   ├── doctor/                        # Doctor area (protected)
│   │   │   ├── dashboard/, appointments/, patient-reports/
│   │   │   ├── chat/, profile/
│   │   └── api/                           # signup, predict, appointments, chat, profile
│   ├── auth.ts / auth.config.ts           # Auth.js config (Credentials + roles)
│   ├── middleware.ts                      # Role-based route protection
│   ├── lib/model.ts                       # Loads & runs the trained model
│   ├── lib/gradcam.ts                     # Grad-CAM heatmap overlay generator
│   ├── components/
│   └── lib/
├── prisma/schema.prisma                   # User, Prediction, Appointment, ChatMessage
└── ml-model/brain-tumor-model/            # Your trained model, TF.js format
    ├── model.json
    └── group1-shard*.bin
```

## 1. Setup

```bash
npm install
cp .env.example .env
# fill in DATABASE_URL, AUTH_SECRET (openssl rand -base64 32)

npx prisma generate
npx prisma migrate dev --name init

npm run dev
```

Visit http://localhost:3000 — sign up as either a Patient or a Doctor from
the same form (there's a role toggle).

## The MRI model

`src/lib/model.ts` loads `ml-model/brain-tumor-model/model.json` once (on
first prediction) and keeps it in memory. `src/app/api/predict/route.ts`
calls it directly — decode the uploaded image → resize to 224×224 → predict.

- **Classes**: `glioma`, `meningioma`, `notumor` (→ `NO_TUMOR`), `pituitary`
  — matches `CLASS_NAMES` from your training notebook, in the same order.
- **Preprocessing**: none needed beyond resizing — your model has
  `Rescaling` and `Normalization` baked in as its first layers.
- **Confidence threshold**: predictions under 60% confidence are stored as
  `INCONCLUSIVE` instead of the raw top class (see `CONFIDENCE_THRESHOLD` in
  `src/lib/model.ts`) — tune this to taste.
- The full 4-class probability breakdown is saved in `Prediction.probabilities`
  (JSON) for later use (e.g. a confidence breakdown chart or Grad-CAM overlay).

### Grad-CAM

`src/lib/gradcam.ts` produces a heatmap overlay showing which regions of the
scan drove the model's prediction. The model is a **dual-branch hybrid**
(EfficientNetB3 + MobileNetV2, each pooled separately then concatenated
through an attention gate), so standard single-branch Grad-CAM doesn't
directly apply. Instead:

1. Two small helper models are built that **reuse the original model's
   weights** (via `model.getLayer(name)`, no copying): one splits off each
   branch's last conv activation map (`top_activation` for EfficientNet,
   `out_relu` for MobileNet, both 7×7 for a 224×224 input), the other
   reconstructs everything from those activations to the final softmax.
2. `tf.grads` computes the gradient of the predicted class's score with
   respect to both activation maps.
3. Each branch gets its own Grad-CAM (channel-weighted, ReLU'd, normalized),
   the two are resized to 224×224 and averaged, then rendered as a jet-style
   heatmap composited over the original scan.

`/api/predict` calls this after every prediction and stores the resulting
PNG's path in `Prediction.gradCamUrl` (best-effort — a Grad-CAM failure never
blocks saving the prediction itself). It's shown in the "Predict MRI" result
card and in the expandable rows on the patient history / doctor reports
pages. Run `npx prisma migrate dev` after pulling this change to pick up the
new `gradCamUrl` column.

`@tensorflow/tfjs-node` has native bindings that download from
`storage.googleapis.com` during `npm install` — make sure that's reachable
on whatever machine/CI you install on (it is on a normal internet
connection; just flagging it in case you're behind a restrictive proxy).

## Auth & roles

- One `User` table with a `role` field (`PATIENT` | `DOCTOR`).
- `middleware.ts` blocks `/patient/*` from doctors and `/doctor/*` from
  patients, and redirects logged-out users to `/login`.
- Session/JWT carries `id` and `role` (see `src/types/next-auth.d.ts`).

## What's stubbed / needs a decision from you

- **Image storage**: `/api/predict` now saves uploaded scans to
  `public/uploads/<patientId>/...` on local disk. That's fine for a
  single-server deployment, but won't persist on serverless platforms
  (Vercel etc.) — swap in S3/Cloudinary there.
- **Chat**: uses simple polling (every 4s), not WebSockets — fine to start,
  swap for Pusher/Socket.io/Ably later if you want real-time push.
