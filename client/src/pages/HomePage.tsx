import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Advantages } from "@/components/sections/Advantages";
import { Process } from "@/components/sections/Process";
import { Audience } from "@/components/sections/Audience";
import { Services } from "@/components/sections/Services";
import { Wizard } from "@/components/wizard/Wizard";
import { FAQ } from "@/components/sections/FAQ";
import { useSeo } from "@/hooks/useSeo";

export function HomePage() {
  const location = useLocation();

  useSeo({
    title: "G.M. Broker — кредитный брокер для частных лиц и бизнеса",
    description:
      "Помощь в одобрении кредитов для физлиц, ИП и ООО по всей России — от 100 000 ₽ до 1,5 млрд ₽. Индивидуальный подбор банка, работа по договору, оплата только после результата.",
    canonicalPath: "/",
  });

  useEffect(() => {
    if (location.hash) {
      // Небольшая задержка, чтобы секции успели отрендериться перед прокруткой
      const id = location.hash.replace("#", "");
      const timer = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.hash]);

  return (
    <main>
      <Hero />
      <About />
      <Advantages />
      <Process />
      <Audience />
      <Services />
      <Wizard />
      <FAQ />
    </main>
  );
}
