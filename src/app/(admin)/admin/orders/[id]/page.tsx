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
    title: `Pedido ${id.slice(0, 8)} · Admin`,
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
        title="Detalhe do pedido"
        description="Itens, entrega, pagamento e atualizacao de status."
        activePath="/admin/orders"
        backHref="/admin/orders"
        backLabel="Todos os pedidos"
      />
      <div className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <OrderDetailView orderId={id} googleIdToken={session.googleIdToken} />
      </div>
    </div>
  );
}
