import Link from "next/link";
import {
  Mail,
  ShieldCheck,
  Truck,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { footerNav, siteConfig } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/70 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbff_100%)]">
      <Container className="max-w-[1500px] py-10 sm:py-12 lg:py-14">
        <div className="mb-10 grid gap-4 rounded-[1.35rem] border border-brand/15 bg-white/70 p-4 shadow-[0_18px_44px_-34px_rgb(26_35_50/0.22)] backdrop-blur-md sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.8fr)] lg:items-center lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Logo className="shrink-0" />
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {siteConfig.description}
            </p>
          </div>

          <form className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            <Input
              type="email"
              placeholder="Email for product drops"
              aria-label="Email for newsletter"
              className="h-11 flex-1 rounded-full bg-white/90 sm:min-w-[260px]"
            />
            <Button type="button" variant="default" className="h-11 shrink-0">
              <Mail className="h-4 w-4" />
              Subscribe
            </Button>
          </form>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
              PuffyCalm promises
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <FooterPromise icon={Truck} label="Tracked shipping over $75" />
              <FooterPromise icon={UserRoundCheck} label="Guest checkout in minutes" />
              <FooterPromise icon={ShieldCheck} label="Secure Stripe payments" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-10">
            <FooterColumn title="Shop" links={footerNav.shop} />
            <FooterColumn title="Help" links={footerNav.help} />
            <FooterColumn title="Company" links={footerNav.company} />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} {siteConfig.name}. Products that make everyday life better.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Create account
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/returns" className="hover:text-foreground">
              Returns
            </Link>
            <a
              href={siteConfig.social.tiktok}
              className="hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              TikTok
            </a>
            <a
              href={siteConfig.social.instagram}
              className="hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              transitionTypes={
                link.href.startsWith("/category/") ? ["catalog"] : undefined
              }
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterPromise({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <span className="inline-flex h-10 items-center gap-2 rounded-full border border-brand/15 bg-white/75 px-3 text-sm font-semibold text-brand-deep shadow-sm">
      <Icon className="h-4 w-4" strokeWidth={2.25} />
      {label}
    </span>
  );
}
