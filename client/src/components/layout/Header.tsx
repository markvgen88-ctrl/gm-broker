import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiChevronDown, HiMenu, HiX } from "react-icons/hi";
import logo from "@/assets/logo.webp";
import { cn } from "@/lib/utils";
import { cta } from "@/lib/cta";
import { SurveyLink } from "@/components/ui/SurveyLink";
import { useSectionNavigate } from "@/hooks/useSectionNavigate";
import { GROUP_TITLES, servicesByGroup, type ServiceGroup } from "@/data/services";

const NAV_LINKS = [
  { id: "process", label: "Как проходит работа" },
  { id: "advantages", label: "Условия" },
  { id: "faq", label: "Вопросы" },
];

const GROUPS: ServiceGroup[] = ["person", "business"];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const goToSection = useSectionNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
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

  // Закрываем меню при смене страницы
  useEffect(() => {
    setMenuOpen(false);
    setServicesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!servicesOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setServicesOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setServicesOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [servicesOpen]);

  const handleLogoClick = () => {
    setMenuOpen(false);
    if (location.pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNav = (id: string) => {
    setMenuOpen(false);
    goToSection(id);
  };

  const linkCls = "text-[0.95rem] font-medium text-ink/75 transition-colors hover:text-pine";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-200",
        scrolled || menuOpen ? "border-line bg-paper/95 backdrop-blur" : "border-transparent bg-paper"
      )}
    >
      <div className="container-page flex h-[4.25rem] items-center justify-between gap-6">
        <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2.5" aria-label="G.M. Broker — на главную">
          <img src={logo} alt="" className="h-10 w-10" width={40} height={40} />
          <span className="font-display text-lg font-bold tracking-tight text-ink">G.M. Broker</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Основное меню">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className={cn(linkCls, "inline-flex items-center gap-1")}
              aria-expanded={servicesOpen}
              aria-haspopup="true"
              onClick={() => setServicesOpen((v) => !v)}
            >
              Виды кредитования
              <HiChevronDown className={cn("transition-transform", servicesOpen && "rotate-180")} />
            </button>
            {servicesOpen && (
              <div className="absolute left-1/2 top-full mt-4 w-[40rem] -translate-x-1/2 rounded-2xl border border-line bg-white p-6 shadow-[0_24px_60px_-24px_rgba(15,30,25,0.35)]">
                <div className="grid grid-cols-2 gap-8">
                  {GROUPS.map((g) => (
                    <div key={g}>
                      <p className="mb-3 text-sm font-semibold text-muted">{GROUP_TITLES[g]}</p>
                      <ul className="flex flex-col">
                        {servicesByGroup(g).map((s) => (
                          <li key={s.slug}>
                            <Link
                              to={`/services/${s.slug}`}
                              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[0.95rem] text-ink transition-colors hover:bg-mint"
                            >
                              <s.icon className="shrink-0 text-pine" size={18} />
                              {s.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {NAV_LINKS.map((l) => (
            <button key={l.id} type="button" onClick={() => handleNav(l.id)} className={linkCls}>
              {l.label}
            </button>
          ))}
          <Link to="/articles" className={linkCls}>
            Статьи
          </Link>
        </nav>

        <div className="hidden lg:block">
          <SurveyLink className={cta("solid")}>Пройти опрос</SurveyLink>
        </div>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-ink lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <HiX size={20} /> : <HiMenu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="max-h-[calc(100svh-4.25rem)] overflow-y-auto border-t border-line bg-paper lg:hidden">
          <nav className="container-page flex flex-col gap-6 pb-8 pt-5" aria-label="Мобильное меню">
            <SurveyLink className={cta("solid", "lg", "w-full")} onNavigate={() => setMenuOpen(false)}>
              Пройти опрос
            </SurveyLink>
            {GROUPS.map((g) => (
              <div key={g}>
                <p className="mb-2 text-sm font-semibold text-muted">{GROUP_TITLES[g]}</p>
                <ul className="flex flex-col">
                  {servicesByGroup(g).map((s) => (
                    <li key={s.slug}>
                      <Link
                        to={`/services/${s.slug}`}
                        className="flex items-center gap-3 border-b border-line py-3 text-base text-ink"
                      >
                        <s.icon className="shrink-0 text-pine" size={20} />
                        {s.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleNav(l.id)}
                  className="border-b border-line py-3 text-left text-base text-ink"
                >
                  {l.label}
                </button>
              ))}
              <Link to="/articles" className="border-b border-line py-3 text-base text-ink">
                Статьи
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
