import PredictForm from "@/components/predict-form";
import { PageHeader, Card } from "@/components/dashboard/ui";

export default function PredictMriPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      <PageHeader
        title=""
        subtitle="Upload a brain MRI scan and NeuroBrain model will analyze it for anomalies within seconds."
      />
      <Card className="p-6 md:p-8">
        <PredictForm />
      </Card>
    </div>
  );
}
