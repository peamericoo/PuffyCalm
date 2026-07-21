import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentPage,
  ContentSection,
} from "@/components/shared/content-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Help center",
  description:
    "Shipping, orders, returns, and contact support for PuffyCalm.",
};

export default function HelpPage() {
  return (
    <ContentPage
      eyebrow="Support"
      title="Help center"
      description="Quick answers for orders, shipping, and shopping with PuffyCalm."
    >
      <ContentSection id="orders" title="Orders & tracking">
        <p>
          After checkout you receive an order confirmation by email. When your
          package ships, we send tracking details to the same address.
        </p>
        <ul>
          <li>
            <strong>Signed-in customers:</strong> see history under{" "}
            <Link href="/account/orders">My orders</Link>.
          </li>
          <li>
            <strong>Guest checkout:</strong> use the track form on{" "}
            <Link href="/account/orders">My orders</Link> with your order id
            and email.
          </li>
        </ul>
      </ContentSection>

      <ContentSection id="shipping" title="Shipping">
        <p>
          We ship to the United States, United Kingdom, Australia, Canada, and
          other destinations as available at checkout. Delivery windows depend
          on destination and carrier capacity.
        </p>
        <ul>
          <li>Estimated shipping cost and timing appear at checkout</li>
          <li>Most orders are prepared within a few business days</li>
          <li>
            Transit is typically several business days to a few weeks for
            international routes
          </li>
        </ul>
        <p>
          If tracking stalls for an extended period, contact{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>
            {siteConfig.supportEmail}
          </a>{" "}
          with your order number.
        </p>
      </ContentSection>

      <ContentSection id="payments" title="Payments">
        <p>
          We accept major cards and digital wallets via Stripe (including Apple
          Pay and Google Pay where available). Guest checkout is always
          supported — you never need an account to buy.
        </p>
      </ContentSection>

      <ContentSection id="returns" title="Returns">
        <p>
          See our full <Link href="/returns">Returns & exchanges</Link> page for
          eligibility, windows, and how to start a request.
        </p>
      </ContentSection>

      <ContentSection id="contact" title="Contact">
        <p>
          Email{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>
            {siteConfig.supportEmail}
          </a>
          . Include your order number when you have one. We typically respond
          within 1–2 business days.
        </p>
        <p>
          Brand inquiries:{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
        </p>
      </ContentSection>

      <ContentSection title="More policies">
        <ul>
          <li>
            <Link href="/privacy">Privacy policy</Link>
          </li>
          <li>
            <Link href="/terms">Terms of service</Link>
          </li>
          <li>
            <Link href="/about">About PuffyCalm</Link>
          </li>
        </ul>
      </ContentSection>
    </ContentPage>
  );
}
