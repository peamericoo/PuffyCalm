import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentPage,
  ContentSection,
} from "@/components/shared/content-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description:
    "PuffyCalm is a curated store for comfort, recovery, and everyday essentials that make life lighter.",
};

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="Our story"
      title="About PuffyCalm"
      description={siteConfig.description}
    >
      <ContentSection title="What we believe">
        <p>
          Everyday life should feel a little lighter. We curate comfort,
          recovery, and practical essentials for people who spend long hours at
          desks, on the road, or winding down at home.
        </p>
        <p>
          Our focus is simple: products that look calm, feel premium, and
          actually help — without the noise of a giant marketplace.
        </p>
      </ContentSection>

      <ContentSection title="How we shop for you">
        <p>
          We hand-pick a tight catalog — recovery tools, seating comfort, heat
          therapy, and desk-day upgrades — so you spend less time comparing and
          more time feeling better.
        </p>
        <ul>
          <li>Curated assortment, not endless inventory</li>
          <li>Clear product pages with honest specs</li>
          <li>Guest checkout anytime — no account required</li>
        </ul>
      </ContentSection>

      <ContentSection title="Where we ship">
        <p>
          We primarily serve customers in the United States, United Kingdom,
          Australia, and Canada. Shipping details and timing live in our{" "}
          <Link href="/help#shipping">Help center</Link>.
        </p>
      </ContentSection>

      <ContentSection title="Talk to us">
        <p>
          Questions about an order or a product? Email{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>
            {siteConfig.supportEmail}
          </a>{" "}
          or visit the <Link href="/help">Help center</Link>. We aim to reply
          within one to two business days.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
