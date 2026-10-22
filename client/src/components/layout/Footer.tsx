import { Link, useLocation } from "react-router-dom";
import { HiOutlineMail } from "react-icons/hi";
import logo from "@/assets/logo.webp";
import { CONTACT_EMAIL as EMAIL } from "@/data/contact";
import { ServiceLink } from "@/components/ui/ServiceLink";
import { useSectionNavigate } from "@/hooks/useSectionNavigate";
import { GROUP_TITLES, servicesByGroup, type ServiceGroup } from "@/data/services";

const GROUPS: ServiceGroup[] = ["person", "business", "extra"];
const linkCls = "text-sm text-white/65 transition-colors hover:text-white";

export function Footer() {
  const year = new Date().getFullYear();
  const goToSection = useSectionNavigate();
  const location = useLocation();

  return (
    <footer className="bg-ink text-white">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
        <div>
          <Link
            to="/"
            onClick={() => location.pathname === "/" && window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5"
          >
            <img src={logo} alt="" className="h-10 w-10" width={40} height={40} loading="lazy" />
            <span className="font-display text-lg font-bold">G.M. Broker</span>
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">
            Кредитный брокер для частных лиц и бизнеса. Подбираю банк, готовлю заявку и сопровождаю сделку по всей
            России.
          </p>
          <a href={`mailto:${EMAIL}`} className="mt-5 inline-flex items-center gap-2 text-sm text-white hover:text-pine-bright">
            <HiOutlineMail className="text-pine-bright" /> {EMAIL}
          </a>
        </div>

        {GROUPS.map((g) => (
          <div key={g}>
            <h3 className="mb-4 text-sm font-semibold text-white">{GROUP_TITLES[g]}</h3>
            <ul className="flex flex-col gap-2.5">
              {servicesByGroup(g).map((s) => (
                <li key={s.slug}>
                  <ServiceLink service={s} className={linkCls}>
                    {s.title}
                    {s.comingSoon && <span className="ml-2 text-xs text-pine-bright">скоро</span>}
                  </ServiceLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="mb-4 text-sm font-semibold text-white">Сайт</h3>
          <ul className="flex flex-col gap-2.5">
            <li>
              <button type="button" onClick={() => goToSection("debts")} className={linkCls}>
                Юридическая помощь
              </button>
            </li>
            <li>
              <button type="button" onClick={() => goToSection("wizard")} className={linkCls}>
                Пройти опрос
              </button>
            </li>
            <li>
              <button type="button" onClick={() => goToSection("process")} className={linkCls}>
                Процесс работы
              </button>
            </li>
            <li>
              <button type="button" onClick={() => goToSection("faq")} className={linkCls}>
                Вопросы и ответы
              </button>
            </li>
            <li>
              <Link to="/articles" className={linkCls}>
                Статьи
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy" className={linkCls}>
                Политика конфиденциальности
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page grid gap-4 py-6 text-xs leading-relaxed text-white/50 md:grid-cols-2">
          <div>
            <p>© {year} ИП Марков Г.В. Все права защищены.</p>
            <p className="mt-1">ИП Марков Геннадий Владимирович · ИНН 380602950496 · ОГРНИП 326385000064002</p>
            <p className="mt-1">Работаю удалённо по всей России, кроме Республики Крым и Северного Кавказа.</p>
          </div>
          <p className="md:text-right">
            Информация на сайте не является публичной офертой. Услуги оказываются на основании договора. Итоговые
            условия кредитования определяются банком-партнёром индивидуально.
          </p>
        </div>
      </div>
    </footer>
  );
}
