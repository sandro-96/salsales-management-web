import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Menu, Receipt } from "lucide-react";

import LanguageSwitcher from "@/components/common/LanguageSwitcher.jsx";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function LandingNav({ brand, t }) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#channels", label: t("pages.landing.nav.channels") },
    { href: "#features", label: t("pages.landing.nav.features") },
    { href: "#industries", label: t("pages.landing.nav.industries") },
    { href: "#workflow", label: t("pages.landing.nav.howItWorks") },
    { href: "#pricing", label: t("pages.landing.nav.pricing") },
    { href: "#faq", label: t("pages.landing.nav.faq") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link to="/landing" className="flex min-w-0 items-center gap-2.5">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500 text-primary-foreground shadow-lg shadow-primary/30">
            <Receipt className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="coiny-regular truncate text-lg text-blue-800 dark:text-blue-300 sm:text-xl">
            {brand}
          </span>
        </Link>

        <nav
          className="hidden items-center gap-0.5 lg:flex"
          aria-label="Main"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            asChild
          >
            <Link to="/login">{t("pages.landing.nav.login")}</Link>
          </Button>
          <Button size="sm" className="hidden gap-1 sm:inline-flex" asChild>
            <Link to="/register">
              {t("pages.landing.nav.register")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>

          {/* Mobile menu trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={t("pages.landing.nav.openMenu")}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88%] sm:w-80">
              <SheetHeader className="border-b border-border/60">
                <SheetTitle className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-emerald-500 text-primary-foreground">
                    <Receipt className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="coiny-regular text-blue-800 dark:text-blue-300">
                    {brand}
                  </span>
                </SheetTitle>
                <SheetDescription>
                  {t("pages.landing.nav.menuSubtitle")}
                </SheetDescription>
              </SheetHeader>
              <nav
                className="flex flex-1 flex-col gap-1 px-2"
                aria-label="Mobile"
              >
                {links.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <a
                      href={link.href}
                      className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {link.label}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </SheetClose>
                ))}
              </nav>
              <div className="space-y-2 border-t border-border/60 p-4">
                <SheetClose asChild>
                  <Button className="w-full gap-1" asChild>
                    <Link to="/register">
                      {t("pages.landing.nav.register")}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/login">{t("pages.landing.nav.login")}</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
