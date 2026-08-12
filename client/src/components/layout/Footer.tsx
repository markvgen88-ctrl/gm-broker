import { Link, useLocation } from "react-router-dom";
import { HiOutlineMail } from "react-icons/hi";
import logo from "@/assets/logo.webp";
import { useSectionNavigate } from "@/hooks/useSectionNavigate";

const EMAIL = "info-gm-broker@bk.ru";

export function Footer() {
  const year = new Date().getFullYear();
  const goToSection = useSectionNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="relative border-t border-white/8 bg-graphite/40">
      <div className="hairline" />
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-3">
            <img src={logo} alt="G.M. Broker" className="h-11 w-11" width={44} height={44} loading="lazy" />
            <span className="font-display text-lg font-bold text-silver">
              G.M. <span className="text-gold-gradient">Broker</span>
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-metal">
            Профессиональные кредитные решения для частных лиц и бизнеса.
            Индивидуальный подбор финансирования и сопровождение сделки на
            каждом этапе — по всей России.
          </p>
        </div>

        <div>
          <h3 className="eyebrow mb-5">Навигация</h3>
          <ul className="flex flex-col gap-3 text-sm text-metal">
            <li><button onClick={() => goToSection("about")} className="transition-colors hover:text-gold">О компании</button></li>
            <li><button onClick={() => goToSection("advantages")} className="transition-colors hover:text-gold">Преимущества</button></li>
            <li><button onClick={() => goToSection("services")} className="transition-colors hover:text-gold">Услуги</button></li>
            <li><button onClick={() => goToSection("wizard")} className="transition-colors hover:text-gold">Проверить шансы</button></li>
            <li><button onClick={() => goToSection("faq")} className="transition-colors hover:text-gold">Вопросы и ответы</button></li>
            <li><Link to="/articles" className="transition-colors hover:text-gold">Статьи</Link></li>
            <li><Link to="/privacy-policy" className="transition-colors hover:text-gold">Политика конфиденциальности</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-5">Контакты</h3>
          <ul className="flex flex-col gap-3 text-sm text-metal">
            <li>
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-2 transition-colors hover:text-gold"
              >
                <HiOutlineMail className="shrink-0 text-gold" /> {EMAIL}
              </a>
            </li>
            <li className="pt-2 text-xs leading-relaxed text-metal/70">
              Работаю удалённо по всей России, кроме Республики Крым и
              Северного Кавказа.
            </li>
            <li className="pt-2 text-xs leading-relaxed text-metal/70">
              ИП Марков Геннадий Владимирович
              <br />
              ИНН 380602950496
              <br />
              ОГРНИП 326385000064002
            </li>
          </ul>
        </div>
      </div>

      <div className="hairline" />
      <div className="container-page flex flex-col gap-3 py-6 text-xs text-metal/60 md:flex-row md:items-center md:justify-between">
        <p className="flex flex-wrap items-center gap-x-3">
          <span>© {year} ИП Марков Г.В. Все права защищены.</span>
          <Link to="/privacy-policy" className="underline-offset-2 transition-colors hover:text-gold hover:underline">
            Политика конфиденциальности
          </Link>
        </p>
        <p className="max-w-2xl md:text-right">
          Информация на сайте не является публичной офертой. Услуги оказываются
          на основании договора. Итоговые условия кредитования определяются
          банком-партнёром индивидуально.
        </p>
      </div>
    </footer>
  );
}
