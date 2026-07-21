import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentPage,
  ContentSection,
} from "@/components/shared/content-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "Terms for using the PuffyCalm storefront and placing orders.",
};

/**
 * Honest D2C operational terms — not multi-jurisdiction counsel draft.
 * Placeholder until formal legal review (Phase N).
 */
export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Terms of service"
      description="These terms govern use of the PuffyCalm website and purchases made through it."
      updated="Operational summary · last reviewed July 2026 · not a substitute for formal legal counsel"
    >
      <ContentSection title="Agreement">
        <p>
          By browsing or placing an order on {siteConfig.name}, you agree to
          these terms and our <Link href="/privacy">Privacy policy</Link>. If
          you do not agree, please do not use the site.
        </p>
      </ContentSection>

      <ContentSection title="The store">
        <p>
          We sell curated comfort, recovery, and everyday products online.
          Product images and descriptions aim to be accurate; minor variations
          in color or packaging can occur. Prices are shown in the currency
          displayed at checkout and may change without notice before you
          complete payment.
        </p>
      </ContentSection>

      <ContentSection title="Orders & payment">
        <ul>
          <li>
            An order is an offer to buy; we may decline or cancel orders for
            stock, pricing, fraud, or operational reasons
          </li>
          <li>
            Payment is collected via our payment providers (e.g. Stripe). You
            authorize the charge for the order total including shipping and tax
            where applicable
          </li>
          <li>Guest checkout is available; accounts are optional</li>
        </ul>
      </ContentSection>

      <ContentSection title="Shipping & risk">
        <p>
          Delivery estimates are not guarantees. Title and risk of loss pass
          according to the shipping arrangement and destination rules. See{" "}
          <Link href="/help#shipping">Shipping help</Link> for practical
          details.
        </p>
      </ContentSection>

      <ContentSection title="Returns">
        <p>
          Returns and exchanges are described on our{" "}
          <Link href="/returns">Returns policy</Link> page and form part of
          these terms for purchases.
        </p>
      </ContentSection>

      <ContentSection title="Acceptable use">
        <p>
          You agree not to misuse the site (including fraud, scraping that
          harms service, or interfering with security). We may suspend access
          that threatens the store or other customers.
        </p>
      </ContentSection>

      <ContentSection title="Disclaimer">
        <p>
          Products are sold for personal use as described. To the fullest
          extent permitted by law, the site and products are provided “as is”
          without warranties beyond those required by applicable consumer law.
          Nothing here limits rights you cannot waive under your local law.
        </p>
      </ContentSection>

      <ContentSection title="Limitation of liability">
        <p>
          To the extent permitted by law, {siteConfig.name} is not liable for
          indirect or consequential damages arising from use of the site or
          products. Our total liability for a purchase is generally limited to
          the amount you paid for that order.
        </p>
      </ContentSection>

      <ContentSection title="Contact">
        <p>
          Questions about these terms:{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>
            {siteConfig.supportEmail}
          </a>
          .
        </p>
      </ContentSection>
    </ContentPage>
  );
}
