import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentPage,
  ContentSection,
} from "@/components/shared/content-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How PuffyCalm collects, uses, and protects information when you shop with us.",
};

/**
 * Honest D2C operational privacy summary — not a jurisdiction-specific legal brief.
 * Placeholder until counsel review (Phase N).
 */
export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Privacy policy"
      description="A plain-language summary of how we handle information on puffycalm.com and related services."
      updated="Operational summary · last reviewed July 2026 · not a substitute for formal legal counsel"
    >
      <ContentSection title="Who we are">
        <p>
          {siteConfig.name} (“we”, “us”) operates this online store. Contact:{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>
            {siteConfig.supportEmail}
          </a>
          .
        </p>
      </ContentSection>

      <ContentSection title="Information we collect">
        <ul>
          <li>
            <strong>Order details</strong> — name, email, shipping address,
            phone when provided, and items purchased
          </li>
          <li>
            <strong>Payment data</strong> — processed by Stripe (and other
            processors we enable); we do not store full card numbers on our
            servers
          </li>
          <li>
            <strong>Account data</strong> — if you sign in with Google, we
            receive basic profile info (name, email, image) from the provider
          </li>
          <li>
            <strong>Technical data</strong> — device/browser info, cookies or
            similar tech needed for cart, session, and security
          </li>
        </ul>
      </ContentSection>

      <ContentSection title="How we use information">
        <ul>
          <li>Fulfill orders, shipping, and customer support</li>
          <li>Send order and tracking emails</li>
          <li>Prevent fraud and keep the store secure</li>
          <li>Improve the site and product experience</li>
        </ul>
        <p>
          We do not sell your personal information. We may share data with
          service providers who help us operate (payments, hosting, email,
          logistics) under appropriate safeguards.
        </p>
      </ContentSection>

      <ContentSection title="Cookies & similar tech">
        <p>
          We use essential cookies for cart, checkout, and signed-in sessions.
          Analytics or marketing cookies, if added later, will be described
          here and controlled where required by law.
        </p>
      </ContentSection>

      <ContentSection title="Retention">
        <p>
          We keep order records as needed for business, tax, and support
          purposes. Account profile data remains while your account is active
          or as required by law.
        </p>
      </ContentSection>

      <ContentSection title="Your choices">
        <p>
          You can request access or correction of personal data we hold, or ask
          questions about this policy, by emailing{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>
            {siteConfig.supportEmail}
          </a>
          . Depending on your location, additional rights may apply.
        </p>
      </ContentSection>

      <ContentSection title="Updates">
        <p>
          We may update this page as the store grows. The “last reviewed” date
          above will change when we do. Continued use of the site after updates
          means you accept the revised summary.
        </p>
      </ContentSection>

      <ContentSection title="Related">
        <ul>
          <li>
            <Link href="/terms">Terms of service</Link>
          </li>
          <li>
            <Link href="/help">Help center</Link>
          </li>
        </ul>
      </ContentSection>
    </ContentPage>
  );
}
