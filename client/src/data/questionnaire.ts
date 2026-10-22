import type { QuestionnaireGraph } from "@/types/questionnaire";

/**
 * ГРАФ АНКЕТЫ
 * ------------------------------------------------------------------
 * Полностью пересобран под новую логическую карту клиента (XMind,
 * сценарий «сайт - Тест для клиента», версия — переосмысленная схема,
 * заменяет прежний граф на 67 узлов). Как и раньше, узлы связаны через
 * "relationships" карты, а не через дерево — переход на следующий вопрос
 * зависит от выбранного варианта ответа. Карта заново обильно дублирует
 * визуально одинаковые вопросы в разных ветках (например, «Имеете ли в
 * собственности автомобиль?» встречается 8 раз, «Напишите цель
 * кредитования» — 7 раз) — как и раньше, мы держим их разными узлами
 * 1:1 с исходными узлами карты, а не сводим в один, чтобы при следующей
 * точечной правке карты можно было один в один сопоставить узлы.
 *
 * Что изменилось по сравнению с прежней схемой:
 *  - Физлицо: порядок вопросов пересобран — сначала возраст, город,
 *    банкротство, трудоустройство и доход (официальный/неофициальный),
 *    и только ПОСЛЕ этого спрашиваются действующие кредиты и
 *    просрочки — раньше было наоборот. Просрочка проверяется в двух
 *    местах: сразу после действующих кредитов (f_current_overdue_1) и,
 *    если действующих кредитов нет, отдельным вопросом про просрочку за
 *    последние 12 месяцев (f_overdue_12m_2, ветка f_active_loans_1 →
 *    «Нет»). Клиенты без действующей просрочки и без такой просрочки в
 *    прошлом идут по «лёгкой» цепочке вопросов о недвижимости (без
 *    проверки ареста и автомобиля); с текущей просрочкой, с просрочкой
 *    за последние 12 месяцев либо вовсе без дохода — по «усиленной»
 *    цепочке (вопросы про арест и автомобиль). С версии карты «без
 *    отказов по физикам» (11.10.2026) в ветке физлица отказов НЕТ:
 *    арест «Да» и отсутствие авто больше не ведут на экран отказа,
 *    клиент в любом случае доходит до суммы, цели, соглашения и формы
 *    контактов (ответы попадают в анкету, решение принимает брокер).
 *    Отказные экраны остались только в ветках ИП и ООО.
 *  - Добавлен новый терминальный узел «Как проходит работа с брокером»
 *    (kind "agreement") — экран-соглашение с чекбоксом подтверждения
 *    перед формой контактов; вставлен в каждую ветку по карте. В версии
 *    от 11.10.2026 в него добавлена строка о комиссии брокера (15%) и
 *    слова «ознакомлен(а) с комиссией» в тексте чекбокса.
 *  - Версия карты от 13.10.2026: (1) в начале ветки физлица после города по
 *    прописке добавлены «Фактический адрес проживания? (Город-район)»
 *    (f_actual_address) и «Карты каких банков у вас уже открыты?»
 *    (f_bank_cards) — до вопроса о банкротстве; их же проходит ИП,
 *    согласившийся на рассмотрение как физлицо. (2) В ветке ИП после ИНН
 *    добавлена цепочка: доход официальный/неофициальный → деятельность →
 *    основной банк по тратам → карты банков → фактический адрес → сумма
 *    кредита (ip_income_type, ip_activity, ip_main_bank, ip_bank_cards,
 *    ip_actual_address). Все семь вопросов — текстовые поля без ветвления.
 *  - Версия карты от 22.10.2026: (1) во всех трёх ветках добавлена цепочка
 *    «задолженность по налогам → блокировка по 115-ФЗ → блокировка счетов
 *    приставами» (поля taxDebt, block115, bailiffBlock): у физлица — после
 *    «самого большого выплаченного кредита» и перед недвижимостью (5 копий,
 *    f_tax_N / f_115fz_N / f_bailiffs_N), у ИП и ООО — после карт/счетов
 *    банков и перед суммой кредита. (2) Физлицо: после вопроса про МФО
 *    (ветки «текущая просрочка» и «просрочка за 12 мес.») сразу идёт «самый
 *    большой кредит» — вопросы об остатке и платежах там убраны (узлы
 *    f_loan_balance_2 / f_monthly_payments_2 удалены); «нет кредитов и нет
 *    просрочки за 12 мес.» теперь тоже ведёт на «самый большой кредит», а
 *    не сразу на недвижимость. (3) ИП: порядок — возраст → город по
 *    прописке → фактический адрес → дата открытия; вопрос «доход
 *    официальный/неофициальный» убран, ИНН ведёт сразу на «деятельность»;
 *    после карт банков — цепочка налоги/115-ФЗ/приставы. (4) ООО: после ИНН
 *    добавлены «деятельность → основной банк по тратам → счета каких банков
 *    открыты (bankAccounts)» и цепочка налоги/115-ФЗ/приставы.
 *  - ИП (срок <6 мес.): после согласия на рассмотрение как физлицо анкета
 *    переходит сразу на вопрос «Карты каких банков у вас уже открыты?»
 *    (f_bank_cards), т.к. город и адрес ИП уже указал.
 *  - Главное окно (start): текст приведён к карте — «Проверьте свои шансы на
 *    одобрение, пройдя наш специальный опрос. Важно отвечать честно … Чтобы
 *    начать, укажите ваш статус». Первая фраза выведена над карточкой
 *    (components/wizard/Wizard.tsx), остальное — в карточке (question + hint).
 *    Пояснение в скобках из карты (про временную анкету для брокера) —
 *    служебное, клиенту не показывается.
 *  - ИП/ООО: логика согласований (дата открытия/регистрации, альтернатива
 *    при недостаточном сроке) не изменилась.
 *
 * id узлов — смысловые (для читаемости кода): {ветка}_{вопрос}[_{номер}],
 * номер добавляется, только если в ветке несколько экземпляров одного и
 * того же вопроса (как в исходной карте).
 */
export const START_NODE_ID = "start";

export const questionnaireGraph: QuestionnaireGraph = {
  // ==========================================================
  // СТАРТ
  // ==========================================================
  start: {
    id: "start",
    kind: "choice",
    field: "clientType",
    question: "Важно отвечать честно для максимально точного ответа по вашей ситуации.",
    hint: "Чтобы начать, укажите ваш статус.",
    options: [
      { label: "Физлицо", value: "individual", next: "f_age" },
      { label: "ИП", value: "entrepreneur", next: "ip_age" },
      { label: "ООО", value: "legal_entity", next: "llc_age" },
    ],
  },


  // ==========================================================
  // ВЕТКА «ФИЗЛИЦО»
  // ==========================================================

  f_age: {
    id: "f_age",
    kind: "input",
    field: "age",
    inputType: "number",
    question: "Сколько вам лет?",
    placeholder: "Например, 35",
    min: 18,
    max: 75,
    next: "f_registration_city",
  },

  f_registration_city: {
    id: "f_registration_city",
    kind: "input",
    field: "registrationCity",
    inputType: "text",
    question: "Город проживания по прописке",
    placeholder: "Например, Москва",
    next: "f_actual_address",
  },

  f_actual_address: {
    id: "f_actual_address",
    kind: "input",
    field: "actualAddress",
    inputType: "text",
    question: "Фактический адрес проживания? (Город-район)",
    placeholder: "Например, Москва, Хамовники",
    next: "f_bank_cards",
  },

  f_bank_cards: {
    id: "f_bank_cards",
    kind: "input",
    field: "bankCards",
    inputType: "text",
    question: "Карты каких банков у вас уже открыты?",
    placeholder: "Например, Сбербанк, Т-Банк, Альфа-Банк",
    next: "f_bankruptcy",
  },

  f_bankruptcy: {
    id: "f_bankruptcy",
    kind: "choice",
    field: "hasBankruptcy",
    question: "Проходили ли вы процедуру банкротства физических лиц?",
    options: [
      { label: "Нет", value: "no", next: "f_employed" },
      { label: "Да", value: "yes", next: "f_bankruptcy_term" },
    ],
  },

  f_employed: {
    id: "f_employed",
    kind: "choice",
    field: "isEmployed",
    question: "Трудоустроены ли вы официально?",
    options: [
      { label: "Да", value: "yes", next: "f_official_income" },
      { label: "Нет", value: "no", next: "f_unofficial_q_2" },
    ],
  },

  f_official_income: {
    id: "f_official_income",
    kind: "input",
    field: "officialIncome",
    inputType: "number",
    question: "Напишите сумму вашего официального ежемесячного заработка",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_unofficial_q_1",
  },

  f_unofficial_q_1: {
    id: "f_unofficial_q_1",
    kind: "choice",
    field: "hasUnofficialIncome",
    question: "Есть ли у вас неофициальный заработок?",
    options: [
      { label: "Да", value: "yes", next: "f_unofficial_income" },
      { label: "Нет", value: "no", next: "f_active_loans_1" },
    ],
  },

  f_unofficial_income: {
    id: "f_unofficial_income",
    kind: "input",
    field: "unofficialIncome",
    inputType: "number",
    question: "Напишите сумму вашего неофициального заработка",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_active_loans_1",
  },

  f_active_loans_1: {
    id: "f_active_loans_1",
    kind: "choice",
    field: "hasActiveLoans",
    question: "Есть ли у вас действующие кредиты?",
    options: [
      { label: "Да", value: "yes", next: "f_current_overdue_1" },
      { label: "Нет", value: "no", next: "f_overdue_12m_2" },
    ],
  },

  f_current_overdue_1: {
    id: "f_current_overdue_1",
    kind: "choice",
    field: "hasCurrentOverdue",
    question: "У вас сейчас есть действующая просроченная задолженность?",
    options: [
      { label: "Нет", value: "no", next: "f_overdue_12m_1" },
      { label: "Да", value: "yes", next: "f_mfo_2" },
    ],
  },

  f_overdue_12m_1: {
    id: "f_overdue_12m_1",
    kind: "choice",
    field: "hadOverdue12m",
    question: "Вы допускали просрочку ранее в течение последних 12 месяцев?",
    options: [
      { label: "Нет", value: "no", next: "f_mfo_1" },
      { label: "Да", value: "yes", next: "f_mfo_1" },
    ],
  },

  f_mfo_1: {
    id: "f_mfo_1",
    kind: "choice",
    field: "usesMFO",
    question: "Вы пользуетесь услугами микрофинансовых организаций?",
    options: [
      { label: "Да", value: "yes", next: "f_loan_balance_1" },
      { label: "Нет", value: "no", next: "f_loan_balance_1" },
    ],
  },

  f_loan_balance_1: {
    id: "f_loan_balance_1",
    kind: "input",
    field: "loanBalance",
    inputType: "number",
    question: "Напишите остаток задолженности по действующим кредитам",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_monthly_payments_1",
  },

  f_monthly_payments_1: {
    id: "f_monthly_payments_1",
    kind: "input",
    field: "monthlyPayments",
    inputType: "number",
    question: "Напишите общую сумму платежей в месяц по действующим кредитам",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_biggest_paid_loan_1",
  },

  f_biggest_paid_loan_1: {
    id: "f_biggest_paid_loan_1",
    kind: "input",
    field: "biggestPaidLoan",
    inputType: "number",
    question: "Напишите сумму самого большого кредита который вы выплатили полностью",
    placeholder: "Сумма в рублях (0, если не было)",
    suffix: "₽",
    next: "f_tax_1",
  },

  f_tax_1: {
    id: "f_tax_1",
    kind: "input",
    field: "taxDebt",
    inputType: "text",
    question: "Есть ли задолженность по налогам? Если да, укажите сумму.",
    placeholder: "Например: нет, или 50 000 ₽",
    next: "f_115fz_1",
  },

  f_115fz_1: {
    id: "f_115fz_1",
    kind: "input",
    field: "block115",
    inputType: "text",
    question: "Есть ли блокировка по 115-ФЗ? Если есть, укажите по какому банку.",
    placeholder: "Например: нет, или Сбербанк",
    next: "f_bailiffs_1",
  },

  f_bailiffs_1: {
    id: "f_bailiffs_1",
    kind: "input",
    field: "bailiffBlock",
    inputType: "text",
    question: "Есть ли блокировка банковских счетов судебными приставами?",
    placeholder: "Например: нет, или да, в Сбербанке",
    next: "f_property_1",
  },

  f_property_1: {
    id: "f_property_1",
    kind: "choice",
    field: "hasProperty",
    question: "Есть ли у вас или близких недвижимость в собственности?",
    options: [
      { label: "Да, у меня есть", value: "owns", next: "f_sole_owner_1" },
      { label: "У меня нет, но у близких есть", value: "relatives", next: "f_relatives_pledge_1" },
      { label: "Нет", value: "no", next: "f_loan_amount_1" },
    ],
  },

  f_sole_owner_1: {
    id: "f_sole_owner_1",
    kind: "choice",
    field: "isSoleOwner",
    question: "Вы единственный собственник?",
    options: [
      { label: "Да", value: "yes", next: "f_pledged_1" },
      { label: "Нет", value: "no", next: "f_minor_owners_1" },
    ],
  },

  f_pledged_1: {
    id: "f_pledged_1",
    kind: "choice",
    field: "isPledged",
    question: "Находится ли ваша недвижимость в залоге у банка, например невыплаченная ипотека?",
    options: [
      { label: "Да", value: "yes", next: "f_loan_amount_1" },
      { label: "Нет", value: "no", next: "f_loan_amount_1" },
    ],
  },

  f_loan_amount_1: {
    id: "f_loan_amount_1",
    kind: "input",
    field: "loanAmount",
    inputType: "number",
    question: "Напишите какая сумма кредита вас интересует?",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_loan_purpose_1",
  },

  f_loan_purpose_1: {
    id: "f_loan_purpose_1",
    kind: "input",
    field: "loanPurpose",
    inputType: "text",
    question: "Напишите цель кредитования",
    placeholder: "Например: развитие бизнеса, покупка недвижимости, рефинансирование",
    next: "f_agreement_1",
  },

  f_agreement_1: {
    id: "f_agreement_1",
    kind: "agreement",
    field: "brokerAgreementConfirmed",
    question: "Как проходит работа с брокером",
    body: [
      "После заявки мы свяжемся с вами в течение 24 часов.",
      "Для предварительного анализа и подбора банка потребуется кредитная история из трёх бюро — пришлём прямые ссылки и инструкцию на вашу эл. почту, весь процесс занимает 10–15 минут.",
      "После анализа кредитных историй брокер сообщит, сможет вам помочь или нет; если нет — даст рекомендации для улучшения ситуации и дальнейшего сотрудничества.",
      "В случае положительного решения брокер может запросить дополнительные документы для заключения договора оказания услуги.",
      "После подписания договора брокер приступает к работе по привлечению для вас кредитных средств.",
      "Комиссия брокера составляет 15% от суммы одобренного кредита.",
    ],
    checkboxLabel: "Прочитал(а) и понимаю, как проходит работа с брокером, ознакомлен(а) с комиссией, в том числе необходимость предоставить кредитную историю из трёх бюро.",
    buttonLabel: "Понятно, продолжить",
    next: "f_final_1",
  },

  f_final_1: {
    id: "f_final_1",
    kind: "final",
    field: "contactInfo",
    question: "Спасибо, что прошли опрос!",
    hint: "Оставьте ваш актуальный адрес электронной почты — на него брокер пришлёт ответ после анализа заявки.",
  },

  f_minor_owners_1: {
    id: "f_minor_owners_1",
    kind: "choice",
    field: "hasMinorOwners",
    question: "Есть ли несовершеннолетние собственники в долях?",
    options: [
      { label: "Нет", value: "no", next: "f_loan_amount_1" },
      { label: "Да", value: "yes", next: "f_loan_amount_1" },
    ],
  },

  f_relatives_pledge_1: {
    id: "f_relatives_pledge_1",
    kind: "choice",
    field: "closeRelativesPledgeConsent",
    question: "Согласны ли будут близкие предоставить залог, если это потребуется?",
    options: [
      { label: "Да", value: "yes", next: "f_loan_amount_1" },
      { label: "Возможно", value: "maybe", next: "f_loan_amount_1" },
      { label: "Нет", value: "no", next: "f_loan_amount_1" },
    ],
  },

  f_mfo_2: {
    id: "f_mfo_2",
    kind: "choice",
    field: "usesMFO",
    question: "Вы пользуетесь услугами микрофинансовых организаций?",
    options: [
      { label: "Нет", value: "no", next: "f_biggest_paid_loan_2" },
      { label: "Да", value: "yes", next: "f_biggest_paid_loan_2" },
    ],
  },

  f_biggest_paid_loan_2: {
    id: "f_biggest_paid_loan_2",
    kind: "input",
    field: "biggestPaidLoan",
    inputType: "number",
    question: "Напишите сумму самого большого кредита который вы выплатили полностью",
    placeholder: "Сумма в рублях (0, если не было)",
    suffix: "₽",
    next: "f_tax_2",
  },

  f_tax_2: {
    id: "f_tax_2",
    kind: "input",
    field: "taxDebt",
    inputType: "text",
    question: "Есть ли задолженность по налогам? Если да, укажите сумму.",
    placeholder: "Например: нет, или 50 000 ₽",
    next: "f_115fz_2",
  },

  f_115fz_2: {
    id: "f_115fz_2",
    kind: "input",
    field: "block115",
    inputType: "text",
    question: "Есть ли блокировка по 115-ФЗ? Если есть, укажите по какому банку.",
    placeholder: "Например: нет, или Сбербанк",
    next: "f_bailiffs_2",
  },

  f_bailiffs_2: {
    id: "f_bailiffs_2",
    kind: "input",
    field: "bailiffBlock",
    inputType: "text",
    question: "Есть ли блокировка банковских счетов судебными приставами?",
    placeholder: "Например: нет, или да, в Сбербанке",
    next: "f_property_2",
  },

  f_property_2: {
    id: "f_property_2",
    kind: "choice",
    field: "hasProperty",
    question: "Есть ли у вас или близких недвижимость в собственности?",
    options: [
      { label: "Да, у меня есть", value: "owns", next: "f_sole_owner_2" },
      { label: "У меня нет, но у близких есть", value: "relatives", next: "f_relatives_pledge_2" },
      { label: "Нет", value: "no", next: "f_car_2" },
    ],
  },

  f_sole_owner_2: {
    id: "f_sole_owner_2",
    kind: "choice",
    field: "isSoleOwner",
    question: "Вы единственный собственник?",
    options: [
      { label: "Да", value: "yes", next: "f_pledged_2" },
      { label: "Нет", value: "no", next: "f_minor_owners_2" },
    ],
  },

  f_pledged_2: {
    id: "f_pledged_2",
    kind: "choice",
    field: "isPledged",
    question: "Находится ли ваша недвижимость в залоге у банка, например невыплаченная ипотека?",
    options: [
      { label: "Нет", value: "no", next: "f_arrest_1" },
      { label: "Да", value: "yes", next: "f_car_2" },
    ],
  },

  f_arrest_1: {
    id: "f_arrest_1",
    kind: "choice",
    field: "hasArrest",
    question: "Наложен ли арест на регистрационные действия с недвижимостью?",
    options: [
      { label: "Нет", value: "no", next: "f_car_1" },
      { label: "Да", value: "yes", next: "f_loan_amount_2" },
    ],
  },

  f_car_1: {
    id: "f_car_1",
    kind: "choice",
    field: "hasCar",
    question: "Имеете ли в собственности автомобиль?",
    options: [
      { label: "Да", value: "yes", next: "f_loan_amount_2" },
      { label: "Нет", value: "no", next: "f_loan_amount_2" },
    ],
  },

  f_loan_amount_2: {
    id: "f_loan_amount_2",
    kind: "input",
    field: "loanAmount",
    inputType: "number",
    question: "Напишите какая сумма кредита вас интересует?",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_loan_purpose_2",
  },

  f_loan_purpose_2: {
    id: "f_loan_purpose_2",
    kind: "input",
    field: "loanPurpose",
    inputType: "text",
    question: "Напишите цель кредитования",
    placeholder: "Например: развитие бизнеса, покупка недвижимости, рефинансирование",
    next: "f_agreement_2",
  },

  f_agreement_2: {
    id: "f_agreement_2",
    kind: "agreement",
    field: "brokerAgreementConfirmed",
    question: "Как проходит работа с брокером",
    body: [
      "После заявки мы свяжемся с вами в течение 24 часов.",
      "Для предварительного анализа и подбора банка потребуется кредитная история из трёх бюро — пришлём прямые ссылки и инструкцию на вашу эл. почту, весь процесс занимает 10–15 минут.",
      "После анализа кредитных историй брокер сообщит, сможет вам помочь или нет; если нет — даст рекомендации для улучшения ситуации и дальнейшего сотрудничества.",
      "В случае положительного решения брокер может запросить дополнительные документы для заключения договора оказания услуги.",
      "После подписания договора брокер приступает к работе по привлечению для вас кредитных средств.",
      "Комиссия брокера составляет 15% от суммы одобренного кредита.",
    ],
    checkboxLabel: "Прочитал(а) и понимаю, как проходит работа с брокером, ознакомлен(а) с комиссией, в том числе необходимость предоставить кредитную историю из трёх бюро.",
    buttonLabel: "Понятно, продолжить",
    next: "f_final_2",
  },

  f_final_2: {
    id: "f_final_2",
    kind: "final",
    field: "contactInfo",
    question: "Спасибо, что прошли опрос!",
    hint: "Оставьте ваш актуальный адрес электронной почты — на него брокер пришлёт ответ после анализа заявки.",
  },

  f_car_2: {
    id: "f_car_2",
    kind: "choice",
    field: "hasCar",
    question: "Имеете ли в собственности автомобиль?",
    options: [
      { label: "Да", value: "yes", next: "f_loan_amount_2" },
      { label: "Нет", value: "no", next: "f_loan_amount_2" },
    ],
  },

  f_minor_owners_2: {
    id: "f_minor_owners_2",
    kind: "choice",
    field: "hasMinorOwners",
    question: "Есть ли несовершеннолетние собственники в долях?",
    options: [
      { label: "Нет", value: "no", next: "f_pledged_2" },
      { label: "Да", value: "yes", next: "f_car_2" },
    ],
  },

  f_relatives_pledge_2: {
    id: "f_relatives_pledge_2",
    kind: "choice",
    field: "closeRelativesPledgeConsent",
    question: "Согласны ли будут близкие предоставить залог, если это потребуется?",
    options: [
      { label: "Да", value: "yes", next: "f_car_1" },
      { label: "Нет", value: "no", next: "f_car_2" },
    ],
  },

  f_overdue_12m_2: {
    id: "f_overdue_12m_2",
    kind: "choice",
    field: "hadOverdue12m",
    question: "Вы допускали просрочку ранее в течение последних 12 месяцев?",
    options: [
      { label: "Нет", value: "no", next: "f_biggest_paid_loan_1" },
      { label: "Да", value: "yes", next: "f_mfo_2" },
    ],
  },

  f_unofficial_q_2: {
    id: "f_unofficial_q_2",
    kind: "choice",
    field: "hasUnofficialIncome",
    question: "Есть ли у вас неофициальный заработок?",
    options: [
      { label: "Да", value: "yes", next: "f_unofficial_income" },
      { label: "Нет", value: "no", next: "f_active_loans_2" },
    ],
  },

  f_active_loans_2: {
    id: "f_active_loans_2",
    kind: "choice",
    field: "hasActiveLoans",
    question: "Есть ли у вас действующие кредиты?",
    options: [
      { label: "Да", value: "yes", next: "f_current_overdue_2" },
      { label: "Нет", value: "no", next: "f_overdue_12m_4" },
    ],
  },

  f_current_overdue_2: {
    id: "f_current_overdue_2",
    kind: "choice",
    field: "hasCurrentOverdue",
    question: "У вас сейчас есть действующая просроченная задолженность?",
    options: [
      { label: "Да", value: "yes", next: "f_mfo_3" },
      { label: "Нет", value: "no", next: "f_overdue_12m_3" },
    ],
  },

  f_mfo_3: {
    id: "f_mfo_3",
    kind: "choice",
    field: "usesMFO",
    question: "Вы пользуетесь услугами микрофинансовых организаций?",
    options: [
      { label: "Нет", value: "no", next: "f_loan_balance_3" },
      { label: "Да", value: "yes", next: "f_loan_balance_3" },
    ],
  },

  f_loan_balance_3: {
    id: "f_loan_balance_3",
    kind: "input",
    field: "loanBalance",
    inputType: "number",
    question: "Напишите остаток задолженности по действующим кредитам",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_monthly_payments_3",
  },

  f_monthly_payments_3: {
    id: "f_monthly_payments_3",
    kind: "input",
    field: "monthlyPayments",
    inputType: "number",
    question: "Напишите общую сумму платежей в месяц по действующим кредитам",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_biggest_paid_loan_3",
  },

  f_biggest_paid_loan_3: {
    id: "f_biggest_paid_loan_3",
    kind: "input",
    field: "biggestPaidLoan",
    inputType: "number",
    question: "Напишите сумму самого большого кредита который вы выплатили полностью",
    placeholder: "Сумма в рублях (0, если не было)",
    suffix: "₽",
    next: "f_tax_3",
  },

  f_tax_3: {
    id: "f_tax_3",
    kind: "input",
    field: "taxDebt",
    inputType: "text",
    question: "Есть ли задолженность по налогам? Если да, укажите сумму.",
    placeholder: "Например: нет, или 50 000 ₽",
    next: "f_115fz_3",
  },

  f_115fz_3: {
    id: "f_115fz_3",
    kind: "input",
    field: "block115",
    inputType: "text",
    question: "Есть ли блокировка по 115-ФЗ? Если есть, укажите по какому банку.",
    placeholder: "Например: нет, или Сбербанк",
    next: "f_bailiffs_3",
  },

  f_bailiffs_3: {
    id: "f_bailiffs_3",
    kind: "input",
    field: "bailiffBlock",
    inputType: "text",
    question: "Есть ли блокировка банковских счетов судебными приставами?",
    placeholder: "Например: нет, или да, в Сбербанке",
    next: "f_property_3",
  },

  f_property_3: {
    id: "f_property_3",
    kind: "choice",
    field: "hasProperty",
    question: "Есть ли у вас или близких недвижимость в собственности?",
    options: [
      { label: "Нет", value: "no", next: "f_car_3" },
      { label: "У меня нет, но у близких есть", value: "relatives", next: "f_relatives_pledge_3" },
      { label: "Да, у меня есть", value: "owns", next: "f_sole_owner_3" },
    ],
  },

  f_car_3: {
    id: "f_car_3",
    kind: "choice",
    field: "hasCar",
    question: "Имеете ли в собственности автомобиль?",
    options: [
      { label: "Нет", value: "no", next: "f_loan_amount_3" },
      { label: "Да", value: "yes", next: "f_loan_amount_3" },
    ],
  },

  f_loan_amount_3: {
    id: "f_loan_amount_3",
    kind: "input",
    field: "loanAmount",
    inputType: "number",
    question: "Напишите какая сумма кредита вас интересует?",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_loan_purpose_3",
  },

  f_loan_purpose_3: {
    id: "f_loan_purpose_3",
    kind: "input",
    field: "loanPurpose",
    inputType: "text",
    question: "Напишите цель кредитования",
    placeholder: "Например: развитие бизнеса, покупка недвижимости, рефинансирование",
    next: "f_agreement_3",
  },

  f_agreement_3: {
    id: "f_agreement_3",
    kind: "agreement",
    field: "brokerAgreementConfirmed",
    question: "Как проходит работа с брокером",
    body: [
      "После заявки мы свяжемся с вами в течение 24 часов.",
      "Для предварительного анализа и подбора банка потребуется кредитная история из трёх бюро — пришлём прямые ссылки и инструкцию на вашу эл. почту, весь процесс занимает 10–15 минут.",
      "После анализа кредитных историй брокер сообщит, сможет вам помочь или нет; если нет — даст рекомендации для улучшения ситуации и дальнейшего сотрудничества.",
      "В случае положительного решения брокер может запросить дополнительные документы для заключения договора оказания услуги.",
      "После подписания договора брокер приступает к работе по привлечению для вас кредитных средств.",
      "Комиссия брокера составляет 15% от суммы одобренного кредита.",
    ],
    checkboxLabel: "Прочитал(а) и понимаю, как проходит работа с брокером, ознакомлен(а) с комиссией, в том числе необходимость предоставить кредитную историю из трёх бюро.",
    buttonLabel: "Понятно, продолжить",
    next: "f_final_3",
  },

  f_final_3: {
    id: "f_final_3",
    kind: "final",
    field: "contactInfo",
    question: "Спасибо, что прошли опрос!",
    hint: "Оставьте ваш актуальный адрес электронной почты — на него брокер пришлёт ответ после анализа заявки.",
  },

  f_relatives_pledge_3: {
    id: "f_relatives_pledge_3",
    kind: "choice",
    field: "closeRelativesPledgeConsent",
    question: "Согласны ли будут близкие предоставить залог, если это потребуется?",
    options: [
      { label: "Нет", value: "no", next: "f_car_3" },
      { label: "Да", value: "yes", next: "f_car_4" },
    ],
  },

  f_car_4: {
    id: "f_car_4",
    kind: "choice",
    field: "hasCar",
    question: "Имеете ли в собственности автомобиль?",
    options: [
      { label: "Да", value: "yes", next: "f_loan_amount_3" },
      { label: "Нет", value: "no", next: "f_loan_amount_3" },
    ],
  },

  f_sole_owner_3: {
    id: "f_sole_owner_3",
    kind: "choice",
    field: "isSoleOwner",
    question: "Вы единственный собственник?",
    options: [
      { label: "Нет", value: "no", next: "f_minor_owners_3" },
      { label: "Да", value: "yes", next: "f_pledged_3" },
    ],
  },

  f_minor_owners_3: {
    id: "f_minor_owners_3",
    kind: "choice",
    field: "hasMinorOwners",
    question: "Есть ли несовершеннолетние собственники в долях?",
    options: [
      { label: "Да", value: "yes", next: "f_car_3" },
      { label: "Нет", value: "no", next: "f_pledged_3" },
    ],
  },

  f_pledged_3: {
    id: "f_pledged_3",
    kind: "choice",
    field: "isPledged",
    question: "Находится ли ваша недвижимость в залоге у банка, например невыплаченная ипотека?",
    options: [
      { label: "Да", value: "yes", next: "f_car_3" },
      { label: "Нет", value: "no", next: "f_arrest_2" },
    ],
  },

  f_arrest_2: {
    id: "f_arrest_2",
    kind: "choice",
    field: "hasArrest",
    question: "Наложен ли арест на регистрационные действия с недвижимостью?",
    options: [
      { label: "Да", value: "yes", next: "f_loan_amount_3" },
      { label: "Нет", value: "no", next: "f_car_4" },
    ],
  },

  f_overdue_12m_3: {
    id: "f_overdue_12m_3",
    kind: "choice",
    field: "hadOverdue12m",
    question: "Вы допускали просрочку ранее в течение последних 12 месяцев?",
    options: [
      { label: "Да", value: "yes", next: "f_mfo_3" },
      { label: "Нет", value: "no", next: "f_mfo_4" },
    ],
  },

  f_mfo_4: {
    id: "f_mfo_4",
    kind: "choice",
    field: "usesMFO",
    question: "Вы пользуетесь услугами микрофинансовых организаций?",
    options: [
      { label: "Нет", value: "no", next: "f_loan_balance_4" },
      { label: "Да", value: "yes", next: "f_loan_balance_4" },
    ],
  },

  f_loan_balance_4: {
    id: "f_loan_balance_4",
    kind: "input",
    field: "loanBalance",
    inputType: "number",
    question: "Напишите остаток задолженности по действующим кредитам",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_monthly_payments_4",
  },

  f_monthly_payments_4: {
    id: "f_monthly_payments_4",
    kind: "input",
    field: "monthlyPayments",
    inputType: "number",
    question: "Напишите общую сумму платежей в месяц по действующим кредитам",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_biggest_paid_loan_4",
  },

  f_biggest_paid_loan_4: {
    id: "f_biggest_paid_loan_4",
    kind: "input",
    field: "biggestPaidLoan",
    inputType: "number",
    question: "Напишите сумму самого большого кредита который вы выплатили полностью",
    placeholder: "Сумма в рублях (0, если не было)",
    suffix: "₽",
    next: "f_tax_4",
  },

  f_tax_4: {
    id: "f_tax_4",
    kind: "input",
    field: "taxDebt",
    inputType: "text",
    question: "Есть ли задолженность по налогам? Если да, укажите сумму.",
    placeholder: "Например: нет, или 50 000 ₽",
    next: "f_115fz_4",
  },

  f_115fz_4: {
    id: "f_115fz_4",
    kind: "input",
    field: "block115",
    inputType: "text",
    question: "Есть ли блокировка по 115-ФЗ? Если есть, укажите по какому банку.",
    placeholder: "Например: нет, или Сбербанк",
    next: "f_bailiffs_4",
  },

  f_bailiffs_4: {
    id: "f_bailiffs_4",
    kind: "input",
    field: "bailiffBlock",
    inputType: "text",
    question: "Есть ли блокировка банковских счетов судебными приставами?",
    placeholder: "Например: нет, или да, в Сбербанке",
    next: "f_property_4",
  },

  f_property_4: {
    id: "f_property_4",
    kind: "choice",
    field: "hasProperty",
    question: "Есть ли у вас или близких недвижимость в собственности?",
    options: [
      { label: "Нет", value: "no", next: "f_car_5" },
      { label: "У меня нет, но у близких есть", value: "relatives", next: "f_relatives_pledge_4" },
      { label: "Да, у меня есть", value: "owns", next: "f_sole_owner_4" },
    ],
  },

  f_car_5: {
    id: "f_car_5",
    kind: "choice",
    field: "hasCar",
    question: "Имеете ли в собственности автомобиль?",
    options: [
      { label: "Нет", value: "no", next: "f_loan_amount_4" },
      { label: "Да", value: "yes", next: "f_loan_amount_4" },
    ],
  },

  f_loan_amount_4: {
    id: "f_loan_amount_4",
    kind: "input",
    field: "loanAmount",
    inputType: "number",
    question: "Напишите какая сумма кредита вас интересует?",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_loan_purpose_4",
  },

  f_loan_purpose_4: {
    id: "f_loan_purpose_4",
    kind: "input",
    field: "loanPurpose",
    inputType: "text",
    question: "Напишите цель кредитования",
    placeholder: "Например: развитие бизнеса, покупка недвижимости, рефинансирование",
    next: "f_agreement_4",
  },

  f_agreement_4: {
    id: "f_agreement_4",
    kind: "agreement",
    field: "brokerAgreementConfirmed",
    question: "Как проходит работа с брокером",
    body: [
      "После заявки мы свяжемся с вами в течение 24 часов.",
      "Для предварительного анализа и подбора банка потребуется кредитная история из трёх бюро — пришлём прямые ссылки и инструкцию на вашу эл. почту, весь процесс занимает 10–15 минут.",
      "После анализа кредитных историй брокер сообщит, сможет вам помочь или нет; если нет — даст рекомендации для улучшения ситуации и дальнейшего сотрудничества.",
      "В случае положительного решения брокер может запросить дополнительные документы для заключения договора оказания услуги.",
      "После подписания договора брокер приступает к работе по привлечению для вас кредитных средств.",
      "Комиссия брокера составляет 15% от суммы одобренного кредита.",
    ],
    checkboxLabel: "Прочитал(а) и понимаю, как проходит работа с брокером, ознакомлен(а) с комиссией, в том числе необходимость предоставить кредитную историю из трёх бюро.",
    buttonLabel: "Понятно, продолжить",
    next: "f_final_4",
  },

  f_final_4: {
    id: "f_final_4",
    kind: "final",
    field: "contactInfo",
    question: "Спасибо, что прошли опрос!",
    hint: "Оставьте ваш актуальный адрес электронной почты — на него брокер пришлёт ответ после анализа заявки.",
  },

  f_relatives_pledge_4: {
    id: "f_relatives_pledge_4",
    kind: "choice",
    field: "closeRelativesPledgeConsent",
    question: "Согласны ли будут близкие предоставить залог, если это потребуется?",
    options: [
      { label: "Нет", value: "no", next: "f_car_5" },
      { label: "Да", value: "yes", next: "f_car_6" },
    ],
  },

  f_car_6: {
    id: "f_car_6",
    kind: "choice",
    field: "hasCar",
    question: "Имеете ли в собственности автомобиль?",
    options: [
      { label: "Да", value: "yes", next: "f_loan_amount_4" },
      { label: "Нет", value: "no", next: "f_loan_amount_4" },
    ],
  },

  f_sole_owner_4: {
    id: "f_sole_owner_4",
    kind: "choice",
    field: "isSoleOwner",
    question: "Вы единственный собственник?",
    options: [
      { label: "Нет", value: "no", next: "f_minor_owners_4" },
      { label: "Да", value: "yes", next: "f_pledged_4" },
    ],
  },

  f_minor_owners_4: {
    id: "f_minor_owners_4",
    kind: "choice",
    field: "hasMinorOwners",
    question: "Есть ли несовершеннолетние собственники в долях?",
    options: [
      { label: "Да", value: "yes", next: "f_car_5" },
      { label: "Нет", value: "no", next: "f_pledged_4" },
    ],
  },

  f_pledged_4: {
    id: "f_pledged_4",
    kind: "choice",
    field: "isPledged",
    question: "Находится ли ваша недвижимость в залоге у банка, например невыплаченная ипотека?",
    options: [
      { label: "Да", value: "yes", next: "f_car_5" },
      { label: "Нет", value: "no", next: "f_arrest_3" },
    ],
  },

  f_arrest_3: {
    id: "f_arrest_3",
    kind: "choice",
    field: "hasArrest",
    question: "Наложен ли арест на регистрационные действия с недвижимостью?",
    options: [
      { label: "Да", value: "yes", next: "f_loan_amount_4" },
      { label: "Нет", value: "no", next: "f_car_6" },
    ],
  },

  f_overdue_12m_4: {
    id: "f_overdue_12m_4",
    kind: "choice",
    field: "hadOverdue12m",
    question: "Вы допускали просрочку ранее в течение последних 12 месяцев?",
    options: [
      { label: "Да", value: "yes", next: "f_biggest_paid_loan_5" },
      { label: "Нет", value: "no", next: "f_biggest_paid_loan_5" },
    ],
  },

  f_biggest_paid_loan_5: {
    id: "f_biggest_paid_loan_5",
    kind: "input",
    field: "biggestPaidLoan",
    inputType: "number",
    question: "Напишите сумму самого большого кредита который вы выплатили полностью",
    placeholder: "Сумма в рублях (0, если не было)",
    suffix: "₽",
    next: "f_tax_5",
  },

  f_tax_5: {
    id: "f_tax_5",
    kind: "input",
    field: "taxDebt",
    inputType: "text",
    question: "Есть ли задолженность по налогам? Если да, укажите сумму.",
    placeholder: "Например: нет, или 50 000 ₽",
    next: "f_115fz_5",
  },

  f_115fz_5: {
    id: "f_115fz_5",
    kind: "input",
    field: "block115",
    inputType: "text",
    question: "Есть ли блокировка по 115-ФЗ? Если есть, укажите по какому банку.",
    placeholder: "Например: нет, или Сбербанк",
    next: "f_bailiffs_5",
  },

  f_bailiffs_5: {
    id: "f_bailiffs_5",
    kind: "input",
    field: "bailiffBlock",
    inputType: "text",
    question: "Есть ли блокировка банковских счетов судебными приставами?",
    placeholder: "Например: нет, или да, в Сбербанке",
    next: "f_property_5",
  },

  f_property_5: {
    id: "f_property_5",
    kind: "choice",
    field: "hasProperty",
    question: "Есть ли у вас или близких недвижимость в собственности?",
    options: [
      { label: "Нет", value: "no", next: "f_car_7" },
      { label: "У меня нет, но у близких есть", value: "relatives", next: "f_relatives_pledge_5" },
      { label: "Да, у меня есть", value: "owns", next: "f_sole_owner_5" },
    ],
  },

  f_car_7: {
    id: "f_car_7",
    kind: "choice",
    field: "hasCar",
    question: "Имеете ли в собственности автомобиль?",
    options: [
      { label: "Нет", value: "no", next: "f_loan_amount_5" },
      { label: "Да", value: "yes", next: "f_loan_amount_5" },
    ],
  },

  f_loan_amount_5: {
    id: "f_loan_amount_5",
    kind: "input",
    field: "loanAmount",
    inputType: "number",
    question: "Напишите какая сумма кредита вас интересует?",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_loan_purpose_5",
  },

  f_loan_purpose_5: {
    id: "f_loan_purpose_5",
    kind: "input",
    field: "loanPurpose",
    inputType: "text",
    question: "Напишите цель кредитования",
    placeholder: "Например: развитие бизнеса, покупка недвижимости, рефинансирование",
    next: "f_agreement_5",
  },

  f_agreement_5: {
    id: "f_agreement_5",
    kind: "agreement",
    field: "brokerAgreementConfirmed",
    question: "Как проходит работа с брокером",
    body: [
      "После заявки мы свяжемся с вами в течение 24 часов.",
      "Для предварительного анализа и подбора банка потребуется кредитная история из трёх бюро — пришлём прямые ссылки и инструкцию на вашу эл. почту, весь процесс занимает 10–15 минут.",
      "После анализа кредитных историй брокер сообщит, сможет вам помочь или нет; если нет — даст рекомендации для улучшения ситуации и дальнейшего сотрудничества.",
      "В случае положительного решения брокер может запросить дополнительные документы для заключения договора оказания услуги.",
      "После подписания договора брокер приступает к работе по привлечению для вас кредитных средств.",
      "Комиссия брокера составляет 15% от суммы одобренного кредита.",
    ],
    checkboxLabel: "Прочитал(а) и понимаю, как проходит работа с брокером, ознакомлен(а) с комиссией, в том числе необходимость предоставить кредитную историю из трёх бюро.",
    buttonLabel: "Понятно, продолжить",
    next: "f_final_5",
  },

  f_final_5: {
    id: "f_final_5",
    kind: "final",
    field: "contactInfo",
    question: "Спасибо, что прошли опрос!",
    hint: "Оставьте ваш актуальный адрес электронной почты — на него брокер пришлёт ответ после анализа заявки.",
  },

  f_relatives_pledge_5: {
    id: "f_relatives_pledge_5",
    kind: "choice",
    field: "closeRelativesPledgeConsent",
    question: "Согласны ли будут близкие предоставить залог, если это потребуется?",
    options: [
      { label: "Нет", value: "no", next: "f_car_7" },
      { label: "Да", value: "yes", next: "f_car_8" },
    ],
  },

  f_car_8: {
    id: "f_car_8",
    kind: "choice",
    field: "hasCar",
    question: "Имеете ли в собственности автомобиль?",
    options: [
      { label: "Да", value: "yes", next: "f_loan_amount_5" },
      { label: "Нет", value: "no", next: "f_loan_amount_5" },
    ],
  },

  f_sole_owner_5: {
    id: "f_sole_owner_5",
    kind: "choice",
    field: "isSoleOwner",
    question: "Вы единственный собственник?",
    options: [
      { label: "Нет", value: "no", next: "f_minor_owners_5" },
      { label: "Да", value: "yes", next: "f_pledged_5" },
    ],
  },

  f_minor_owners_5: {
    id: "f_minor_owners_5",
    kind: "choice",
    field: "hasMinorOwners",
    question: "Есть ли несовершеннолетние собственники в долях?",
    options: [
      { label: "Да", value: "yes", next: "f_car_7" },
      { label: "Нет", value: "no", next: "f_pledged_5" },
    ],
  },

  f_pledged_5: {
    id: "f_pledged_5",
    kind: "choice",
    field: "isPledged",
    question: "Находится ли ваша недвижимость в залоге у банка, например невыплаченная ипотека?",
    options: [
      { label: "Да", value: "yes", next: "f_car_7" },
      { label: "Нет", value: "no", next: "f_arrest_4" },
    ],
  },

  f_arrest_4: {
    id: "f_arrest_4",
    kind: "choice",
    field: "hasArrest",
    question: "Наложен ли арест на регистрационные действия с недвижимостью?",
    options: [
      { label: "Да", value: "yes", next: "f_loan_amount_5" },
      { label: "Нет", value: "no", next: "f_car_8" },
    ],
  },

  f_bankruptcy_term: {
    id: "f_bankruptcy_term",
    kind: "input",
    field: "bankruptcyTermPassed",
    inputType: "text",
    question: "Какой срок прошёл после завершения процедуры БФЛ?",
    placeholder: "Например, 2 года 3 месяца",
    next: "f_employed",
  },

  // ==========================================================
  // ВЕТКА «ИП»
  // ==========================================================

  ip_age: {
    id: "ip_age",
    kind: "input",
    field: "age",
    inputType: "number",
    question: "Сколько вам лет?",
    placeholder: "Например, 35",
    min: 18,
    max: 75,
    next: "ip_registration_city",
  },

  ip_registration_city: {
    id: "ip_registration_city",
    kind: "input",
    field: "registrationCity",
    inputType: "text",
    question: "Город проживания по прописке",
    placeholder: "Например, Москва",
    next: "ip_actual_address",
  },

  ip_actual_address: {
    id: "ip_actual_address",
    kind: "input",
    field: "actualAddress",
    inputType: "text",
    question: "Фактический адрес проживания? (Город-район)",
    placeholder: "Например, Москва, Хамовники",
    next: "ip_open_date",
  },

  ip_open_date: {
    id: "ip_open_date",
    kind: "input",
    field: "ipOpenDate",
    inputType: "date",
    question: "Укажите дату открытия ИП",
    next: "ip_turnover",
    dateBranch: { minMonths: 6, belowNext: "ip_consent_individual" },
  },

  ip_consent_individual: {
    id: "ip_consent_individual",
    kind: "choice",
    field: "ipConsentToIndividual",
    question: "К сожалению ИП кредитуют сроком от 6 месяцев и с оборотом по счетам от 100 000 в месяц. Для вас можем рассмотреть кредитование как для физлица. Вы согласны?",
    options: [
      { label: "Да", value: "yes", next: "f_bank_cards" },
      { label: "Нет", value: "no", next: "ip_decline" },
    ],
  },

  ip_decline: {
    id: "ip_decline",
    kind: "decline",
    message: "К сожалению с такими данными я пока не могу вам помочь.",
    hint: "Спасибо, что обратились!",
  },

  ip_turnover: {
    id: "ip_turnover",
    kind: "input",
    field: "ipTurnover",
    inputType: "number",
    question: "Напишите сумму оборотов по счёту за месяц",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "ip_net_profit",
  },

  ip_net_profit: {
    id: "ip_net_profit",
    kind: "input",
    field: "netProfit",
    inputType: "number",
    question: "Напишите сумму чистого дохода за месяц",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "ip_inn",
  },

  ip_inn: {
    id: "ip_inn",
    kind: "input",
    field: "inn",
    inputType: "text",
    question: "Напишите ИНН",
    placeholder: "12 цифр",
    next: "ip_activity",
  },

  ip_activity: {
    id: "ip_activity",
    kind: "input",
    field: "activityType",
    inputType: "text",
    question: "С какой деятельности зарабатываете деньги, что делаете?",
    placeholder: "Например: грузоперевозки, розничная торговля",
    next: "ip_main_bank",
  },

  ip_main_bank: {
    id: "ip_main_bank",
    kind: "input",
    field: "mainSpendingBank",
    inputType: "text",
    question: "Какой банк основной по тратам?",
    placeholder: "Например, Сбербанк",
    next: "ip_bank_cards",
  },

  ip_bank_cards: {
    id: "ip_bank_cards",
    kind: "input",
    field: "bankCards",
    inputType: "text",
    question: "Карты каких банков у вас уже открыты?",
    placeholder: "Например, Сбербанк, Т-Банк, Альфа-Банк",
    next: "ip_tax",
  },

  ip_tax: {
    id: "ip_tax",
    kind: "input",
    field: "taxDebt",
    inputType: "text",
    question: "Есть ли задолженность по налогам? Если да, укажите сумму.",
    placeholder: "Например: нет, или 50 000 ₽",
    next: "ip_115fz",
  },

  ip_115fz: {
    id: "ip_115fz",
    kind: "input",
    field: "block115",
    inputType: "text",
    question: "Есть ли блокировка по 115-ФЗ? Если есть, укажите по какому банку.",
    placeholder: "Например: нет, или Сбербанк",
    next: "ip_bailiffs",
  },

  ip_bailiffs: {
    id: "ip_bailiffs",
    kind: "input",
    field: "bailiffBlock",
    inputType: "text",
    question: "Есть ли блокировка банковских счетов судебными приставами?",
    placeholder: "Например: нет, или да, в Сбербанке",
    next: "ip_loan_amount",
  },

  ip_loan_amount: {
    id: "ip_loan_amount",
    kind: "input",
    field: "loanAmount",
    inputType: "number",
    question: "Напишите какая сумма кредита нужна?",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "ip_loan_purpose",
  },

  ip_loan_purpose: {
    id: "ip_loan_purpose",
    kind: "input",
    field: "loanPurpose",
    inputType: "text",
    question: "Напишите цель кредитования",
    placeholder: "Например: пополнение оборотных средств, расширение бизнеса",
    next: "ip_agreement",
  },

  ip_agreement: {
    id: "ip_agreement",
    kind: "agreement",
    field: "brokerAgreementConfirmed",
    question: "Как проходит работа с брокером",
    body: [
      "После заявки мы свяжемся с вами в течение 24 часов.",
      "Для предварительного анализа и подбора банка потребуется кредитная история из трёх бюро — пришлём прямые ссылки и инструкцию на вашу эл. почту, весь процесс занимает 10–15 минут.",
      "После анализа кредитных историй брокер сообщит, сможет вам помочь или нет; если нет — даст рекомендации для улучшения ситуации и дальнейшего сотрудничества.",
      "В случае положительного решения брокер может запросить дополнительные документы для заключения договора оказания услуги.",
      "После подписания договора брокер приступает к работе по привлечению для вас кредитных средств.",
      "Комиссия брокера составляет 15% от суммы одобренного кредита.",
    ],
    checkboxLabel: "Прочитал(а) и понимаю, как проходит работа с брокером, ознакомлен(а) с комиссией, в том числе необходимость предоставить кредитную историю из трёх бюро.",
    buttonLabel: "Понятно, продолжить",
    next: "ip_final",
  },

  ip_final: {
    id: "ip_final",
    kind: "final",
    field: "contactInfo",
    question: "Спасибо, что прошли опрос!",
    hint: "Оставьте ваш актуальный адрес электронной почты — на него брокер пришлёт ответ после анализа заявки.",
  },

  // ==========================================================
  // ВЕТКА «ООО»
  // ==========================================================

  llc_age: {
    id: "llc_age",
    kind: "input",
    field: "age",
    inputType: "number",
    question: "Сколько вам лет?",
    placeholder: "Например, 35",
    min: 18,
    max: 75,
    next: "llc_open_date",
  },

  llc_open_date: {
    id: "llc_open_date",
    kind: "input",
    field: "llcOpenDate",
    inputType: "date",
    question: "Укажите дату открытия ООО",
    next: "llc_turnover",
    dateBranch: { minMonths: 12, belowNext: "llc_consent_collateral" },
  },

  llc_consent_collateral: {
    id: "llc_consent_collateral",
    kind: "choice",
    field: "llcConsentToCollateral",
    question: "К сожалению ООО кредитуют сроком от 12 месяцев и с оборотом по счетам от 800 000 в месяц. Для вас можем рассмотреть кредитование под залог недвижимости, оборудования или спецтехники. Вы согласны?",
    options: [
      { label: "Нет", value: "no", next: "llc_decline" },
      { label: "Да", value: "yes", next: "llc_turnover" },
    ],
  },

  llc_decline: {
    id: "llc_decline",
    kind: "decline",
    message: "В таком случае я вам в настоящее время не смогу ничем помочь.",
    hint: "Спасибо, что обратились!",
  },

  llc_turnover: {
    id: "llc_turnover",
    kind: "input",
    field: "orgTurnover",
    inputType: "number",
    question: "Напишите сумму оборотов по счёту за месяц",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "llc_net_profit",
  },

  llc_net_profit: {
    id: "llc_net_profit",
    kind: "input",
    field: "netProfit",
    inputType: "number",
    question: "Напишите сумму чистого дохода за месяц",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "llc_inn",
  },

  llc_inn: {
    id: "llc_inn",
    kind: "input",
    field: "inn",
    inputType: "text",
    question: "Напишите ИНН",
    placeholder: "10 цифр",
    next: "llc_activity",
  },

  llc_activity: {
    id: "llc_activity",
    kind: "input",
    field: "activityType",
    inputType: "text",
    question: "С какой деятельности зарабатываете деньги, что делаете?",
    placeholder: "Например: грузоперевозки, розничная торговля",
    next: "llc_main_bank",
  },

  llc_main_bank: {
    id: "llc_main_bank",
    kind: "input",
    field: "mainSpendingBank",
    inputType: "text",
    question: "Какой банк основной по тратам?",
    placeholder: "Например, Сбербанк",
    next: "llc_bank_accounts",
  },

  llc_bank_accounts: {
    id: "llc_bank_accounts",
    kind: "input",
    field: "bankAccounts",
    inputType: "text",
    question: "Счета каких банков у вас уже открыты?",
    placeholder: "Например, Сбербанк, Т-Банк, Альфа-Банк",
    next: "llc_tax",
  },

  llc_tax: {
    id: "llc_tax",
    kind: "input",
    field: "taxDebt",
    inputType: "text",
    question: "Есть ли задолженность по налогам? Если да, укажите сумму.",
    placeholder: "Например: нет, или 50 000 ₽",
    next: "llc_115fz",
  },

  llc_115fz: {
    id: "llc_115fz",
    kind: "input",
    field: "block115",
    inputType: "text",
    question: "Есть ли блокировка по 115-ФЗ? Если есть, укажите по какому банку.",
    placeholder: "Например: нет, или Сбербанк",
    next: "llc_bailiffs",
  },

  llc_bailiffs: {
    id: "llc_bailiffs",
    kind: "input",
    field: "bailiffBlock",
    inputType: "text",
    question: "Есть ли блокировка банковских счетов судебными приставами?",
    placeholder: "Например: нет, или да, в Сбербанке",
    next: "llc_loan_amount",
  },

  llc_loan_amount: {
    id: "llc_loan_amount",
    kind: "input",
    field: "loanAmount",
    inputType: "number",
    question: "Напишите какая сумма кредита нужна?",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "llc_loan_purpose",
  },

  llc_loan_purpose: {
    id: "llc_loan_purpose",
    kind: "input",
    field: "loanPurpose",
    inputType: "text",
    question: "Напишите цель кредитования",
    placeholder: "Например: пополнение оборотных средств, расширение бизнеса",
    next: "llc_agreement",
  },

  llc_agreement: {
    id: "llc_agreement",
    kind: "agreement",
    field: "brokerAgreementConfirmed",
    question: "Как проходит работа с брокером",
    body: [
      "После заявки мы свяжемся с вами в течение 24 часов.",
      "Для предварительного анализа и подбора банка потребуется кредитная история из трёх бюро — пришлём прямые ссылки и инструкцию на вашу эл. почту, весь процесс занимает 10–15 минут.",
      "После анализа кредитных историй брокер сообщит, сможет вам помочь или нет; если нет — даст рекомендации для улучшения ситуации и дальнейшего сотрудничества.",
      "В случае положительного решения брокер может запросить дополнительные документы для заключения договора оказания услуги.",
      "После подписания договора брокер приступает к работе по привлечению для вас кредитных средств.",
      "Комиссия брокера составляет 15% от суммы одобренного кредита.",
    ],
    checkboxLabel: "Прочитал(а) и понимаю, как проходит работа с брокером, ознакомлен(а) с комиссией, в том числе необходимость предоставить кредитную историю из трёх бюро.",
    buttonLabel: "Понятно, продолжить",
    next: "llc_final",
  },

  llc_final: {
    id: "llc_final",
    kind: "final",
    field: "contactInfo",
    question: "Спасибо, что прошли опрос!",
    hint: "Оставьте ваш актуальный адрес электронной почты — на него брокер пришлёт ответ после анализа заявки.",
  },};

/** Человекочитаемые подписи полей — используются при сборке HTML-отчёта. */
export const FIELD_LABELS: Record<string, string> = {
  clientType: "Тип клиента",
  age: "Возраст",
  hasBankruptcy: "Процедура банкротства физлиц",
  bankruptcyTermPassed: "Срок с момента завершения процедуры БФЛ",
  registrationCity: "Город проживания по прописке",
  hasCurrentOverdue: "Действующая просроченная задолженность",
  hadOverdue12m: "Просрочка за последние 12 месяцев",
  isEmployed: "Официальное трудоустройство",
  officialIncome: "Официальный ежемесячный доход",
  hasUnofficialIncome: "Неофициальный заработок",
  unofficialIncome: "Сумма неофициального заработка",
  usesMFO: "Пользуется услугами МФО",
  hasActiveLoans: "Действующие кредиты",
  loanBalance: "Остаток задолженности",
  monthlyPayments: "Платежи в месяц по кредитам",
  biggestPaidLoan: "Крупнейший выплаченный кредит",
  hasProperty: "Недвижимость в собственности",
  isSoleOwner: "Единственный собственник",
  isPledged: "Недвижимость в залоге у банка",
  hasMinorOwners: "Несовершеннолетние собственники в долях",
  hasArrest: "Арест на регистрационные действия",
  closeRelativesPledgeConsent: "Готовность близких дать залог",
  hasCar: "Автомобиль в собственности",
  loanAmount: "Интересующая сумма кредита",
  loanPurpose: "Цель кредитования",
  brokerAgreementConfirmed: "Ознакомлен с порядком работы брокера",
  ipOpenDate: "Дата открытия ИП",
  ipConsentToIndividual: "Согласие на рассмотрение как физлицо",
  ipTurnover: "Оборот по счету в месяц",
  netProfit: "Чистая прибыль в месяц",
  inn: "ИНН",
  llcOpenDate: "Дата регистрации ООО",
  llcConsentToCollateral: "Согласие на кредитование под залог",
  orgTurnover: "Оборот по счету в месяц",
  name: "Имя",
  phone: "Телефон",
  contactInfo: "E-mail",
};
