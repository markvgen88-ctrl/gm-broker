import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HiArrowLeft, HiOutlineArrowRight } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import { isValidInn, expectedInnLength } from "@/lib/innValidator";
import { fullMonthsSince } from "@/lib/utils";
import type { InputNode } from "@/types/questionnaire";

const TODAY_ISO = new Date().toISOString().slice(0, 10);
const MIN_DATE_ISO = "1950-01-01";

interface InputStepProps {
  node: InputNode;
  defaultValue?: string | number;
  onAnswer: (value: string | number, next: string) => void;
  onBack: () => void;
  canGoBack: boolean;
}

function buildSchema(node: InputNode) {
  if (node.field === "inn") {
    const length = expectedInnLength(node.id);
    return z.object({
      value: z
        .string()
        .trim()
        .regex(/^\d+$/, "ИНН должен состоять только из цифр")
        .length(length, `ИНН должен содержать ровно ${length} цифр`)
        .refine(isValidInn, "Похоже, в ИНН опечатка — проверьте цифры"),
    });
  }

  if (node.inputType === "number") {
    const toNumber = (v: string) => Number(v.replace(/\s/g, ""));

    return z.object({
      value: z
        .string()
        .min(1, "Заполните поле")
        .refine((v) => !Number.isNaN(toNumber(v)), "Введите число")
        .refine((v) => toNumber(v) >= 0, "Значение не может быть отрицательным")
        .refine((v) => node.min === undefined || toNumber(v) >= node.min, `Минимум — ${node.min}`)
        .refine((v) => node.max === undefined || toNumber(v) <= node.max, `Максимум — ${node.max}`),
    });
  }

  if (node.inputType === "date") {
    return z.object({
      value: z
        .string()
        .min(1, "Укажите дату")
        .refine((v) => v <= TODAY_ISO, "Дата не может быть в будущем")
        .refine((v) => v >= MIN_DATE_ISO, "Проверьте правильность даты"),
    });
  }

  return z.object({
    value: z.string().trim().min(2, "Заполните поле подробнее"),
  });
}

export function InputStep({ node, defaultValue, onAnswer, onBack, canGoBack }: InputStepProps) {
  const schema = buildSchema(node);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ value: string }>({
    resolver: zodResolver(schema),
    defaultValues: { value: defaultValue !== undefined ? String(defaultValue) : "" },
  });

  useEffect(() => {
    reset({ value: defaultValue !== undefined ? String(defaultValue) : "" });
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id]);

  const onSubmit = handleSubmit((data) => {
    const raw = node.inputType === "number" ? Number(data.value.replace(/\s/g, "")) : data.value.trim();

    let nextId = node.next;
    if (node.dateBranch && node.inputType === "date") {
      const monthsPassed = fullMonthsSince(data.value);
      if (monthsPassed < node.dateBranch.minMonths) {
        nextId = node.dateBranch.belowNext;
      }
    }

    onAnswer(raw, nextId);
  });

  const { ref: rhfRef, ...rest } = register("value");

  return (
    <form onSubmit={onSubmit}>
      <h3 className="font-display text-xl font-semibold leading-snug text-silver md:text-2xl">
        {node.question}
      </h3>
      {node.hint && <p className="mt-3 text-sm leading-relaxed text-metal md:text-base">{node.hint}</p>}

      <div className="mt-8">
        <div className="relative">
          <input
            {...rest}
            ref={(el) => {
              rhfRef(el);
              inputRef.current = el;
            }}
            type={node.inputType === "date" ? "date" : "text"}
            inputMode={node.inputType === "number" || node.field === "inn" ? "numeric" : "text"}
            maxLength={node.field === "inn" ? expectedInnLength(node.id) : undefined}
            min={node.inputType === "date" ? MIN_DATE_ISO : undefined}
            max={node.inputType === "date" ? TODAY_ISO : undefined}
            placeholder={node.placeholder}
            autoComplete="off"
            className="w-full rounded-xl border border-white/12 bg-graphite/60 px-5 py-4 pr-16 text-base text-silver placeholder:text-metal/50 transition-colors duration-250 focus:border-gold/60 focus:outline-none md:text-lg [color-scheme:dark]"
          />
          {node.suffix && (
            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-gold">
              {node.suffix}
            </span>
          )}
        </div>
        {errors.value && <p className="mt-2 text-sm text-[#e5a3a3]">{errors.value.message}</p>}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-metal transition-colors hover:text-gold"
          >
            <HiArrowLeft /> Назад
          </button>
        ) : (
          <span />
        )}
        <Button type="submit">
          Далее
          <HiOutlineArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
        </Button>
      </div>
    </form>
  );
}