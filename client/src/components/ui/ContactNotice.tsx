import { HiOutlineChatAlt2 } from "react-icons/hi";

const CHANNELS = ["Почта", "SMS", "MAX", "Telegram"];

/**
 * Уведомление перед формой контактов: брокер отвечает текстом, а не звонком.
 * Общий блок для последнего шага опроса и форм заявок на услуги. Рассчитан на
 * тёмный фон со скином `.wizard-skin`.
 */
export function ContactNotice({ className = "" }: { className?: string }) {
  return (
    <div className={`flex gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3.5 ${className}`} role="note">
      <HiOutlineChatAlt2 className="mt-0.5 shrink-0 text-gold" size={22} aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-silver md:text-[15px]">Отвечаем в текстовом формате</p>
        <p className="mt-1 text-sm leading-relaxed text-silver/85 md:text-[15px]">
          Клиенты часто не отвечают на звонок, поэтому мы пишем, а не звоним. Проверяйте, пожалуйста, почту, SMS и
          сообщения в мессенджерах.
        </p>
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {CHANNELS.map((c) => (
            <li key={c} className="rounded-full border border-gold/45 px-2.5 py-0.5 text-xs font-medium text-gold">
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
