import type { Metadata } from "next";
import { auth } from "@/auth";
import { AccountOrdersView } from "@/components/account/account-orders-view";
import {
  ApiError,
  listOrdersByEmail,
  type CustomerOrderListItem,
} from "@/lib/api/orders";

export const metadata: Metadata = {
  title: "My orders",
  description:
    "Track PuffyCalm orders with email + order code, or sign in with Google to see orders for your account email.",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ email?: string; code?: string }>;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const params = await searchParams;
  const sessionEmail = session?.user?.email?.trim() || null;
  const sessionName = session?.user?.name ?? null;

  let sessionOrders: CustomerOrderListItem[] | null = null;
  let sessionOrdersError: string | null = null;

  if (sessionEmail) {
    try {
      const list = await listOrdersByEmail(sessionEmail, {
        page: 1,
        pageSize: 50,
      });
      sessionOrders = list.items;
    } catch (e) {
      sessionOrders = null;
      if (e instanceof ApiError) {
        sessionOrdersError = e.message;
      } else {
        sessionOrdersError =
          "Something went wrong loading orders. Try the track form below.";
      }
    }
  }

  return (
    <AccountOrdersView
      sessionEmail={sessionEmail}
      sessionName={sessionName}
      sessionOrders={sessionOrders}
      sessionOrdersError={sessionOrdersError}
      prefillEmail={typeof params.email === "string" ? params.email : ""}
      prefillCode={typeof params.code === "string" ? params.code : ""}
    />
  );
}
