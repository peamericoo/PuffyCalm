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
    "PuffyCalm curates premium comfort & recovery for desk days, long sits, and tight shoulders — guest checkout, free shipping over $75.",
};

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="Our story"
      title="Comfort that ships. Recovery that works."
      description={siteConfig.description}
    >
      <ContentSection title="What we believe">
        <p>
          You should not have to live with the ache. We build a tight store of
          comfort, recovery, and everyday tools for people who sit long hours,
          commute hard, or finally want to wind down properly.
        </p>
        <p>
          Calm design. Premium feel. Products that actually help — without the
          noise of a giant marketplace.
        </p>
      </ContentSection>

      <ContentSection title="How we shop for you">
        <p>
          We hand-pick recovery tools, seating comfort, heat therapy, and
          desk-day upgrades so you spend less time comparing and more time
          feeling better.
        </p>
        <ul>
          <li>Tight catalog on purpose — quality over filler SKUs</li>
          <li>Clear product pages with honest specs</li>
          <li>Guest checkout anytime — no account required</li>
          <li>Free tracked shipping on orders $75+</li>
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
