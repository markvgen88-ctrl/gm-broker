import brokerPhoto from "@/assets/broker-photo.webp";
import { SectionHeading } from "@/components/ui/SectionHeading";

const PARAGRAPHS = [
  "Помогаю получить финансирование физлицам и бизнесу, когда банки не дают нужный результат: отказывают, одобряют слишком маленькие суммы или предлагают невыгодные условия.",
  "Перед началом работы детально анализирую ситуацию и оцениваю реальные перспективы. Моя задача — не просто отправить заявку, а подготовить вас так, чтобы банк увидел сильные стороны и принял положительное решение на лучших возможных условиях.",
  "Честно говорю о шансах. Если вижу, что получить финансирование невозможно, скажу об этом сразу и дам бесплатную рекомендацию. Большинство клиентов приходят ко мне после самостоятельных попыток или отказов в нескольких банках.",
];

export function About() {
  return (
    <section id="about" className="scroll-mt-16 pb-16 lg:pb-24">
      <div className="container-page grid items-center gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <figure className="mx-auto w-full max-w-sm lg:mx-0">
          <img
            src={brokerPhoto}
            alt="Геннадий Марков, основатель G.M. Broker"
            className="aspect-[4/5] w-full rounded-3xl object-cover object-top"
            width={360}
            height={450}
            loading="lazy"
          />
          <figcaption className="mt-3 text-sm text-muted">
            Геннадий Марков, ИП, основатель G.M. Broker
          </figcaption>
        </figure>
        <div>
          <SectionHeading title="Работаю от анализа до результата" />
          <div className="mt-6 flex flex-col gap-4">
            {PARAGRAPHS.map((p) => (
              <p key={p.slice(0, 20)} className="measure text-base leading-relaxed text-ink/85 md:text-lg">
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
