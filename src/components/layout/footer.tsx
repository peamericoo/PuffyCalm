import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { footerNav, siteConfig } from "@/lib/mock/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-white">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-5 lg:col-span-4">
            <Logo />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {siteConfig.description}
            </p>
            <form className="flex max-w-md flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                placeholder="Email for product drops"
                aria-label="Email for newsletter"
                className="flex-1"
              />
              <Button type="button" variant="default" className="shrink-0">
                Subscribe
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8 lg:pl-8">
            <FooterColumn title="Shop" links={footerNav.shop} />
            <FooterColumn title="Help" links={footerNav.help} />
            <FooterColumn title="Company" links={footerNav.company} />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} {siteConfig.name}. Products that make everyday life better.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
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
