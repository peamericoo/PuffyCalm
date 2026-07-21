import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrdersListView } from "@/components/admin/orders-list-view";

export const metadata: Metadata = {
  title: "Orders · Admin",
  robots: { index: false, follow: false },
};

/**
 * Phase G — real admin order list (GET /api/v1/admin/orders).
 * Auth.js gates UX; FastAPI cookies from Phase E gate data.
 */
export default async function AdminOrdersPage() {
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
        title="Orders"
        description="Live data from the API — no invented metrics. Filter by status, open a row for fulfillment."
        activePath="/admin/orders"
      />
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-5 sm:py-8">
        <OrdersListView googleIdToken={session.googleIdToken} />
      </div>
    </div>
  );
}
