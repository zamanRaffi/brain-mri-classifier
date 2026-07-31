import { prisma } from "@/lib/prisma";
import BookAppointmentForm from "@/components/book-appointment-form";
import { PageHeader, Card } from "@/components/dashboard/ui";

export default async function BookAppointmentPage() {
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    select: { id: true, name: true, specialization: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      <PageHeader
        title=""
        subtitle="Schedule a consultation with one of our specialist neurologists."
      />
      <Card className="p-6 md:p-8">
        <BookAppointmentForm doctors={doctors} />
      </Card>
    </div>
  );
}
