import { redirect } from "next/navigation";

// Deals live on the Listings page now; deal rooms remain at /deals/[id].
export default function DealsPage() {
  redirect("/listings");
}
