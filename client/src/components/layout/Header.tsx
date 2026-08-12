import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { HiMenu, HiX } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import logo from "@/assets/logo.webp";
import { cn } from "@/lib/utils";
import { useSectionNavigate } from "@/hooks/useSectionNavigate";

const NAV_LINKS = [
  { id: "about", label: "О нас" },
  { id: "advantages", label: "Преимущества" },
  { id: "process", label: "Как проходит работа" },
  { id: "services", label: "Услуги" },
  { id: "faq", label: "FAQ" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const goToSection = useSectionNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    setMenuOpen(false);
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const scrollToForm = () => {
    setMenuOpen(false);
    goToSection("wizard");
  };

  const handleNavClick = (id: string) => {
    setMenuOpen(false);
    goToSection(id);
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "bg-bg/85 backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.8)]" : "bg-transparent"
      )}
    >
      <div className={cn("hairline absolute bottom-0 left-0 right-0 opacity-0 transition-opacity duration-500", scrolled && "opacity-100")} />
      <div className="container-page flex h-20 items-center justify-between">
        <Link to="/" onClick={handleLogoClick} className="flex items-center gap-3" aria-label="G.M. Broker — на главную">
          <img src={logo} alt="G.M. Broker" className="h-11 w-11 select-none" width={44} height={44} />
          <span className="font-display text-lg font-bold tracking-wide text-silver">
            G.M. <span className="text-gold-gradient animate-shimmer">Broker</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className="text-sm font-medium text-metal transition-colors duration-300 hover:text-gold"
            >
              {link.label}
            </button>
          ))}
          <Link
            to="/articles"
            className="text-sm font-medium text-metal transition-colors duration-300 hover:text-gold"
          >
            Статьи
          </Link>
        </nav>

        <div className="hidden lg:block">
          <Button onClick={scrollToForm}>Проверить шансы</Button>
        </div>

        <button
          className="grid h-11 w-11 place-items-center rounded-full metal-border text-silver lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <HiX size={20} /> : <HiMenu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden bg-bg/98 backdrop-blur-xl lg:hidden"
          >
            <nav className="container-page flex flex-col gap-1 pb-8 pt-2">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className="rounded-lg px-3 py-3 text-left text-base font-medium text-metal transition-colors hover:bg-graphite hover:text-gold"
                >
                  {link.label}
                </button>
              ))}
              <Link
                to="/articles"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-left text-base font-medium text-metal transition-colors hover:bg-graphite hover:text-gold"
              >
                Статьи
              </Link>
              <Button className="mt-3 w-full" onClick={scrollToForm}>
                Проверить шансы
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
