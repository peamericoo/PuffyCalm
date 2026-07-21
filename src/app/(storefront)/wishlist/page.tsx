import { WishlistView } from "@/components/wishlist/wishlist-view";
import { getHomeProductRail } from "@/lib/catalog/service";

export const metadata = {
  title: "Calm list",
  description: "Your saved PuffyCalm pieces — pin, bag, or buy when ready.",
};

export default async function WishlistPage() {
  const suggestions = await getHomeProductRail(4);
  return <WishlistView suggestions={suggestions} />;
}
