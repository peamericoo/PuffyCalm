import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentPage,
  ContentSection,
} from "@/components/shared/content-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Returns & exchanges",
  description:
    "How returns and exchanges work at PuffyCalm — realistic windows and fair support.",
};

export default function ReturnsPage() {
  return (
    <ContentPage
      eyebrow="Policy"
      title="Returns & exchanges"
      description="We want you to feel good about every order. Here is how change-of-mind and defects work today."
      updated="Operational policy summary · last reviewed July 2026"
    >
      <ContentSection title="Our approach">
        <p>
          PuffyCalm is a direct-to-consumer store. Early on we prioritize fair,
          case-by-case support rather than unlimited free returns. If something
          arrives damaged or not as described, we will make it right.
        </p>
      </ContentSection>

      <ContentSection title="Damaged or incorrect items">
        <p>
          Contact us within <strong>7 days of delivery</strong> with your order
          number, photos of the issue, and packaging if relevant. Eligible
          cases may receive a replacement or refund after we review.
        </p>
        <p>
          Email{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>
            {siteConfig.supportEmail}
          </a>
          .
        </p>
      </ContentSection>

      <ContentSection title="Change of mind">
        <p>
          Unused items in original packaging may be considered for return
          within <strong>14 days of delivery</strong>, subject to approval.
          Return shipping is typically paid by the customer unless we state
          otherwise. Not every SKU is eligible (for example opened hygiene or
          personal-care adjacent products).
        </p>
        <p>
          <strong>Note:</strong> Free easy returns are not guaranteed at this
          stage. We review requests honestly and aim for a fair outcome.
        </p>
      </ContentSection>

      <ContentSection title="How to start a request">
        <ol>
          <li>
            Find your order id in the confirmation email or under{" "}
            <Link href="/account/orders">My orders</Link>.
          </li>
          <li>
            Email {siteConfig.supportEmail} with the reason and photos if
            needed.
          </li>
          <li>
            We reply with next steps (approval, return label if any, or refund
            plan).
          </li>
        </ol>
      </ContentSection>

      <ContentSection title="Refunds">
        <p>
          Approved refunds go back to the original payment method. Processing
          time depends on your bank or card issuer after we issue the refund.
        </p>
      </ContentSection>

      <ContentSection title="Related">
        <ul>
          <li>
            <Link href="/help">Help center</Link>
          </li>
          <li>
            <Link href="/terms">Terms of service</Link>
          </li>
        </ul>
      </ContentSection>
    </ContentPage>
  );
}
