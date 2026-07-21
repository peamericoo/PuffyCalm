import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderDetailView } from "@/components/admin/order-detail-view";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order ${id.slice(0, 8)}… · Admin`,
    robots: { index: false, follow: false },
  };
}

/**
 * Phase G — order detail + status/notes PATCH via Phase F API.
 */
export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const role = session?.user?.role;
  const allowed = role === "admin" || role === "staff";

  if (!session?.user) {
    redirect("/admin");
  }
  if (!allowed) {
    redirect("/account");
  }

  return (
    <div className="min-h-full">
      <AdminPageHeader
        title="Order detail"
        description="Items, shipping, payment IDs, and allowed status transitions from the backend state machine."
        activePath="/admin/orders"
        backHref="/admin/orders"
        backLabel="All orders"
      />
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-5 sm:py-8">
        <OrderDetailView orderId={id} googleIdToken={session.googleIdToken} />
      </div>
    </div>
  );
}
