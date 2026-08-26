import { Link } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi";
import { Reveal } from "@/components/ui/Reveal";
import { useSeo } from "@/hooks/useSeo";

const UPDATED_AT = "2 августа 2026";

export function PrivacyPolicyPage() {
  useSeo({
    title: "Политика конфиденциальности — G.M. Broker",
    description:
      "Какие данные собирает сайт G.M. Broker при заполнении анкеты, зачем они нужны и как обрабатываются.",
    canonicalPath: "/privacy-policy",
  });

  return (
    <main className="pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-metal transition-colors hover:text-gold"
            >
              <HiArrowLeft /> На главную
            </Link>
          </Reveal>

          <Reveal delay={0.06}>
            <span className="eyebrow mt-8 block">Юридическая информация</span>
            <h1 className="mt-3 font-display text-3xl font-bold leading-[1.15] text-silver sm:text-4xl md:text-[2.6rem]">
              Политика конфиденциальности
            </h1>
            <p className="mt-5 text-sm text-metal/70">Обновлено: {UPDATED_AT}</p>
          </Reveal>

          <div className="hairline my-10" />

          <Reveal delay={0.1}>
            <div className="prose-policy flex flex-col gap-8 text-metal">
              <section>
                <p className="leading-relaxed">
                  Настоящая политика определяет порядок обработки персональных данных
                  посетителей сайта{" "}
                  <a href="https://gm-broker.ru" className="text-gold hover:text-gold-deep">
                    gm-broker.ru
                  </a>{" "}
                  (далее — «Сайт»). Оператором персональных данных является{" "}
                  <strong className="text-silver">ИП Марков Геннадий Владимирович</strong>{" "}
                  (ИНН 380602950496, ОГРНИП 326385000064002), далее — «Оператор». Используя
                  Сайт и заполняя анкету, вы соглашаетесь с условиями, изложенными ниже.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-silver">
                  1. Какие данные собираются
                </h2>
                <p className="mt-3 leading-relaxed">
                  При заполнении анкеты «Проверка шансов на кредит» Сайт запрашивает
                  сведения, необходимые для оценки вашей ситуации: тип обращения (физлицо,
                  ИП или ООО), возраст, город проживания по прописке, сведения о доходах и
                  действующих обязательствах, ИНН (для ИП и ООО), желаемую сумму и цель
                  кредитования, а также имя и удобный способ связи (телефон, e-mail или
                  Telegram). Набор вопросов зависит от выбранной ветки анкеты — вы всегда
                  видите и заполняете только то, что относится именно к вашей ситуации.
                </p>
                <p className="mt-3 leading-relaxed">
                  Дополнительно Сайт использует Яндекс.Метрику для анализа посещаемости —
                  подробнее об этом в разделе 5.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-silver">
                  2. Зачем нужны эти данные
                </h2>
                <p className="mt-3 leading-relaxed">
                  Данные используются исключительно для того, чтобы честно оценить ваши
                  реальные шансы на получение финансирования, подобрать подходящий вариант
                  и связаться с вами по указанному контакту для обсуждения деталей. Данные
                  не используются для автоматического принятия решений и не передаются
                  в банки без вашего отдельного, явно выраженного согласия на конкретном
                  этапе работы.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-silver">
                  3. Как обрабатываются и хранятся данные
                </h2>
                <p className="mt-3 leading-relaxed">
                  Это важный момент, и мы предпочитаем объяснить его максимально прямо.
                  Данные, которые вы указываете в анкете, передаются с вашего браузера на
                  сервер по защищённому зашифрованному соединению (HTTPS) и сразу
                  пересылаются Оператору — на электронную почту и, если доступно, в
                  Telegram. <strong className="text-silver">
                    Сервер Сайта не сохраняет анкеты в базе данных
                  </strong>{" "}
                  — после отправки письма и уведомления сами данные на сервере не
                  остаются. Единственное место их дальнейшего хранения — почтовый ящик и
                  Telegram-чат Оператора, доступ к которым имеет только он лично.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-silver">
                  4. Кому передаются данные
                </h2>
                <p className="mt-3 leading-relaxed">
                  Данные не продаются, не передаются в рекламных целях и не публикуются.
                  Если по итогам рассмотрения вашей заявки принимается решение о
                  дальнейшей работе с конкретным банком-партнёром, передача данных в этот
                  банк происходит отдельно, только с вашего согласия и в рамках заключаемого
                  договора — это уже следующий этап, не связанный напрямую с формой на Сайте.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-silver">
                  5. Файлы cookie и аналитика
                </h2>
                <p className="mt-3 leading-relaxed">
                  Сайт использует сервис Яндекс.Метрика для анализа посещаемости и оценки
                  эффективности рекламы. Метрика устанавливает файлы cookie в вашем
                  браузере и собирает обезличенную статистику (какие страницы вы посещаете,
                  откуда пришли на Сайт). Эти данные не связываются напрямую с содержимым
                  вашей анкеты. Подробнее о том, как обрабатывает данные сама Яндекс.Метрика,
                  можно узнать в{" "}
                  <a
                    href="https://yandex.ru/legal/confidential/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:text-gold-deep"
                  >
                    политике конфиденциальности Яндекса
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-silver">
                  6. Ваши права
                </h2>
                <p className="mt-3 leading-relaxed">
                  Вы вправе в любой момент запросить у Оператора информацию о том, какие
                  ваши данные обрабатывались, потребовать их удаления или отозвать согласие
                  на обработку. Для этого достаточно написать на{" "}
                  <a href="mailto:info-gm-broker@bk.ru" className="text-gold hover:text-gold-deep">
                    info-gm-broker@bk.ru
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-silver">
                  7. Изменения политики
                </h2>
                <p className="mt-3 leading-relaxed">
                  Оператор может обновлять эту политику — например, при изменении состава
                  запрашиваемых данных или используемых сервисов. Актуальная версия всегда
                  доступна на этой странице с указанием даты обновления вверху.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-silver">
                  8. Контакты Оператора
                </h2>
                <p className="mt-3 leading-relaxed">
                  ИП Марков Геннадий Владимирович
                  <br />
                  ИНН 380602950496
                  <br />
                  ОГРНИП 326385000064002
                  <br />
                  E-mail:{" "}
                  <a href="mailto:info-gm-broker@bk.ru" className="text-gold hover:text-gold-deep">
                    info-gm-broker@bk.ru
                  </a>
                </p>
              </section>
            </div>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
