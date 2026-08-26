import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { createContract, downloadContract } from "@/lib/adminApi";
import type { ContractSummary } from "@/lib/adminApi";
import { CONTRACT_CLIENT_TYPES, getContractSteps } from "@/data/contractQuestionnaire";
import type { ContractClientType, ContractFieldDef } from "@/data/contractQuestionnaire";

interface ContractWizardModalProps {
  applicationId: number;
  onClose: () => void;
  onCreated: (contract: ContractSummary) => void;
}

/**
 * Мастер "Заполнить договор". Проходит по сценарию из
 * data/contractQuestionnaire.ts — сначала выбор типа заказчика, затем один
 * вопрос за шаг (реквизиты + условия), в конце — сводка и отправка на
 * сервер. Раньше эти же вопросы задавал отдельный Telegram-бот.
 */
export function ContractWizardModal({ applicationId, onClose, onCreated }: ContractWizardModalProps) {
  const [clientType, setClientType] = useState<ContractClientType | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const steps: ContractFieldDef[] = clientType ? getContractSteps(clientType) : [];
  const isSummary = clientType !== null && stepIndex >= steps.length;
  const currentField = !isSummary ? steps[stepIndex] : undefined;

  const handleClose = () => {
    if (clientType) {
      const sure = window.confirm("Закрыть без сохранения? Введённые данные не сохранятся.");
      if (!sure) return;
    }
    onClose();
  };

  const pickClientType = (type: ContractClientType) => {
    setClientType(type);
    setStepIndex(0);
    setValues({});
    setInputValue("");
    setFieldError(null);
  };

  const goBack = () => {
    setFieldError(null);
    setSubmitError(null);
    if (isSummary) {
      const lastField = steps[steps.length - 1];
      setStepIndex(steps.length - 1);
      setInputValue(values[lastField.key] ?? "");
      return;
    }
    if (stepIndex === 0) {
      setClientType(null);
      return;
    }
    const prevField = steps[stepIndex - 1];
    setStepIndex(stepIndex - 1);
    setInputValue(values[prevField.key] ?? "");
  };

  const goNext = () => {
    if (!currentField) return;
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setFieldError("Поле не может быть пустым");
      return;
    }
    if (currentField.pattern && !currentField.pattern.test(trimmed)) {
      setFieldError(currentField.patternMessage ?? "Неверный формат");
      return;
    }
    const nextValues = { ...values, [currentField.key]: trimmed };
    const nextIndex = stepIndex + 1;
    setValues(nextValues);
    setFieldError(null);
    setStepIndex(nextIndex);
    setInputValue(nextIndex < steps.length ? (nextValues[steps[nextIndex].key] ?? "") : "");
  };

  const handleSubmit = async () => {
    if (!clientType) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const contract = await createContract(applicationId, clientType, values);
      onCreated(contract);
      try {
        await downloadContract(contract.id);
      } catch {
        // Договор уже создан и попал в историю — скачать можно будет оттуда.
      }
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Не удалось создать договор");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <h2 className="font-display text-lg font-semibold text-silver">Заполнить договор</h2>
          <button type="button" onClick={handleClose} className="text-metal hover:text-gold" aria-label="Закрыть">
            ✕
          </button>
        </div>

        {!clientType && (
          <div>
            <p className="mb-4 text-sm text-metal">Выберите тип заказчика:</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {CONTRACT_CLIENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => pickClientType(t.value)}
                  className="metal-border rounded-xl px-4 py-3 text-sm text-silver transition-colors hover:border-gold/60 hover:text-gold"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {clientType && !isSummary && currentField && (
          <div>
            <p className="mb-1 text-xs text-metal">
              Шаг {stepIndex + 1} из {steps.length}
            </p>
            <label className="mb-2 block text-sm text-silver" htmlFor="contract-field-input">
              {currentField.label}
            </label>
            <input
              id="contract-field-input"
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setFieldError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && goNext()}
              placeholder={currentField.placeholder}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-silver outline-none focus:border-gold/60"
            />
            {fieldError && <p className="mt-2 text-xs text-rose-400">{fieldError}</p>}

            <div className="mt-6 flex justify-between">
              <Button variant="ghost" size="md" onClick={goBack}>
                Назад
              </Button>
              <Button variant="primary" size="md" onClick={goNext}>
                Далее
              </Button>
            </div>
          </div>
        )}

        {isSummary && clientType && (
          <div>
            <p className="mb-4 text-sm text-metal">Проверьте данные перед созданием договора:</p>
            <dl className="mb-4 max-h-80 space-y-2 overflow-y-auto pr-1">
              <div>
                <dt className="text-xs text-metal">Тип заказчика</dt>
                <dd className="text-silver">{CONTRACT_CLIENT_TYPES.find((t) => t.value === clientType)?.label}</dd>
              </div>
              {steps.map((f) => (
                <div key={f.key}>
                  <dt className="text-xs text-metal">{f.label}</dt>
                  <dd className="whitespace-pre-wrap text-silver">{values[f.key]}</dd>
                </div>
              ))}
            </dl>

            {submitError && <p className="mb-3 text-sm text-rose-400">{submitError}</p>}

            <div className="flex justify-between">
              <Button variant="ghost" size="md" onClick={goBack} disabled={submitting}>
                Назад
              </Button>
              <Button variant="primary" size="md" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Создаём…" : "Создать и скачать"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
