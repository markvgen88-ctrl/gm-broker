import type { QuestionnaireGraph } from "@/types/questionnaire";

/**
 * ГРАФ АНКЕТЫ
 * ------------------------------------------------------------------
 * Реконструирован из логической карты клиента (XMind, сценарий
 * "Тест для клиента"). Узлы связаны через "relationships" карты — переход
 * на следующий вопрос зависит от выбранного варианта ответа. Некоторые
 * вопросы в исходной карте дублируются (например, "Трудоустроены ли вы
 * официально?" встречается в нескольких ветках), потому что от ответа на
 * НИХ зависит разное продолжение — карта специально держит их разными
 * узлами, а не одним общим, и мы делаем так же.
 *
 * Общая логика веток:
 *  - Физлицо: если СЕЙЧАС есть просрочка либо была просрочка за последние
 *    12 месяцев — сценарий уходит в "усиленную" ветку (суффикс _2): там
 *    дополнительно проверяются арест на недвижимость и наличие авто, а при
 *    отсутствии дохода или подходящего залога анкета заканчивается отказом.
 *    Если просрочек не было вовсе — сценарий идёт по "чистой" ветке
 *    (суффикс _1) с более коротким набором вопросов по недвижимости.
 *  - ИП/ООО: сначала уточняется дата открытия/регистрации. Если бизнесу
 *    меньше требуемого срока (6 мес. для ИП, 12 мес. для ООО) — клиенту
 *    предлагается альтернатива (рассмотрение как физлицо / кредитование
 *    под залог); при отказе от альтернативы анкета заканчивается отказом.
 *
 * id узлов ниже — смысловые (для читаемости кода), но 1:1 соответствуют
 * структуре и порядку вопросов исходной карты.
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
    question: "Укажите ваш статус",
    hint: "Важно отвечать честно — это нужно для максимально точного ответа по вашей ситуации.",
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
    min: 20,
    max: 65,
    next: "f_bankruptcy",
  },

  f_bankruptcy: {
    id: "f_bankruptcy",
    kind: "choice",
    field: "hasBankruptcy",
    question: "Проходили ли вы процедуру банкротства физических лиц?",
    options: [
      { label: "Да", value: "yes", next: "f_bankruptcy_term" },
      { label: "Нет", value: "no", next: "f_registration_city" },
    ],
  },

  f_bankruptcy_term: {
    id: "f_bankruptcy_term",
    kind: "input",
    field: "bankruptcyTermPassed",
    inputType: "text",
    question: "Какой срок прошёл после завершения процедуры банкротства?",
    placeholder: "Например, 2 года 3 месяца",
    next: "f_registration_city",
  },

  f_registration_city: {
    id: "f_registration_city",
    kind: "input",
    field: "registrationCity",
    inputType: "text",
    question: "Город проживания по прописке",
    placeholder: "Например, Москва",
    next: "f_current_overdue",
  },

  f_current_overdue: {
    id: "f_current_overdue",
    kind: "choice",
    field: "hasCurrentOverdue",
    question: "У вас сейчас есть действующая просроченная задолженность?",
    options: [
      { label: "Нет", value: "no", next: "f_overdue_12m" },
      { label: "Да", value: "yes", next: "f_employed_2" },
    ],
  },

  f_overdue_12m: {
    id: "f_overdue_12m",
    kind: "choice",
    field: "hadOverdue12m",
    question: "Вы допускали просрочку ранее в течение последних 12 месяцев?",
    options: [
      { label: "Нет", value: "no", next: "f_employed_1" },
      { label: "Да", value: "yes", next: "f_employed_2" },
    ],
  },

  // ----------------------------------------------------------
  // «чистая» ветка (просрочек не было вовсе)
  // ----------------------------------------------------------
  f_employed_1: {
    id: "f_employed_1",
    kind: "choice",
    field: "isEmployed",
    question: "Трудоустроены ли вы официально?",
    options: [
      { label: "Да", value: "yes", next: "f_official_income_1" },
      { label: "Нет", value: "no", next: "f_unofficial_q_1a" },
    ],
  },

  f_official_income_1: {
    id: "f_official_income_1",
    kind: "input",
    field: "officialIncome",
    inputType: "number",
    question: "Напишите сумму вашего официального ежемесячного заработка",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_unofficial_q_1b",
  },

  // трудоустроены официально нет — доход только неофициальный, при его
  // отсутствии продолжать нечем
  f_unofficial_q_1a: {
    id: "f_unofficial_q_1a",
    kind: "choice",
    field: "hasUnofficialIncome",
    question: "Есть ли у вас неофициальный заработок?",
    options: [
      { label: "Да", value: "yes", next: "f_unofficial_income_1" },
      { label: "Нет", value: "no", next: "f_decline_no_income_1" },
    ],
  },

  // официальный доход уже есть — неофициальный лишь уточняется
  f_unofficial_q_1b: {
    id: "f_unofficial_q_1b",
    kind: "choice",
    field: "hasUnofficialIncome",
    question: "Есть ли у вас неофициальный заработок?",
    options: [
      { label: "Да", value: "yes", next: "f_unofficial_income_1" },
      { label: "Нет", value: "no", next: "f_active_loans_1" },
    ],
  },

  f_unofficial_income_1: {
    id: "f_unofficial_income_1",
    kind: "input",
    field: "unofficialIncome",
    inputType: "number",
    question: "Напишите сумму вашего неофициального заработка",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_mfo_1",
  },

  f_mfo_1: {
    id: "f_mfo_1",
    kind: "choice",
    field: "usesMFO",
    question: "Вы пользуетесь услугами микрофинансовых организаций?",
    options: [
      { label: "Да", value: "yes", next: "f_active_loans_1" },
      { label: "Нет", value: "no", next: "f_active_loans_1" },
    ],
  },

  f_active_loans_1: {
    id: "f_active_loans_1",
    kind: "choice",
    field: "hasActiveLoans",
    question: "Есть ли у вас действующие кредиты?",
    options: [
      { label: "Да", value: "yes", next: "f_loan_balance_1" },
      { label: "Нет", value: "no", next: "f_biggest_paid_loan_1" },
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
    question: "Напишите сумму самого крупного кредита, который вы выплатили полностью",
    placeholder: "Сумма в рублях (0, если не было)",
    suffix: "₽",
    next: "f_property_1",
  },

  f_property_1: {
    id: "f_property_1",
    kind: "choice",
    field: "hasProperty",
    question: "Есть ли у вас или у близких недвижимость в собственности?",
    options: [
      { label: "Да, у меня есть", value: "owns", next: "f_sole_owner_1" },
      { label: "У меня нет, но у близких есть", value: "relatives", next: "f_loan_amount_1" },
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

  f_minor_owners_1: {
    id: "f_minor_owners_1",
    kind: "choice",
    field: "hasMinorOwners",
    question: "Есть ли несовершеннолетние собственники в долях?",
    options: [
      { label: "Нет", value: "no", next: "f_pledged_1" },
      { label: "Да", value: "yes", next: "f_loan_amount_1" },
    ],
  },

  f_loan_amount_1: {
    id: "f_loan_amount_1",
    kind: "input",
    field: "loanAmount",
    inputType: "number",
    question: "Какая сумма кредита вас интересует?",
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
    next: "f_final_1",
  },

  f_final_1: {
    id: "f_final_1",
    kind: "final",
    field: "contactInfo",
    question: "Спасибо, что прошли опрос!",
    hint: "Оставьте удобный способ связи — телефон, e-mail или Telegram, — чтобы брокер мог дать вам ответ после анализа заявки.",
  },

  // ----------------------------------------------------------
  // «усиленная» ветка (есть текущая просрочка или была за 12 месяцев)
  // ----------------------------------------------------------
  f_employed_2: {
    id: "f_employed_2",
    kind: "choice",
    field: "isEmployed",
    question: "Трудоустроены ли вы официально?",
    options: [
      { label: "Да", value: "yes", next: "f_official_income_2" },
      { label: "Нет", value: "no", next: "f_unofficial_q_2a" },
    ],
  },

  f_official_income_2: {
    id: "f_official_income_2",
    kind: "input",
    field: "officialIncome",
    inputType: "number",
    question: "Напишите сумму вашего официального ежемесячного заработка",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_unofficial_q_2b",
  },

  f_unofficial_q_2a: {
    id: "f_unofficial_q_2a",
    kind: "choice",
    field: "hasUnofficialIncome",
    question: "Есть ли у вас неофициальный заработок?",
    options: [
      { label: "Да", value: "yes", next: "f_unofficial_income_2" },
      { label: "Нет", value: "no", next: "f_decline_no_income_2" },
    ],
  },

  // просрочка уже есть — значит, действующий кредит точно есть, поэтому
  // отдельный вопрос "есть ли действующие кредиты" здесь не задаём
  f_unofficial_q_2b: {
    id: "f_unofficial_q_2b",
    kind: "choice",
    field: "hasUnofficialIncome",
    question: "Есть ли у вас неофициальный заработок?",
    options: [
      { label: "Да", value: "yes", next: "f_unofficial_income_2" },
      { label: "Нет", value: "no", next: "f_loan_balance_2" },
    ],
  },

  f_unofficial_income_2: {
    id: "f_unofficial_income_2",
    kind: "input",
    field: "unofficialIncome",
    inputType: "number",
    question: "Напишите сумму вашего неофициального заработка",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_loan_balance_2",
  },

  f_loan_balance_2: {
    id: "f_loan_balance_2",
    kind: "input",
    field: "loanBalance",
    inputType: "number",
    question: "Напишите остаток задолженности по действующим кредитам",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_monthly_payments_2",
  },

  f_monthly_payments_2: {
    id: "f_monthly_payments_2",
    kind: "input",
    field: "monthlyPayments",
    inputType: "number",
    question: "Напишите общую сумму платежей в месяц по действующим кредитам",
    placeholder: "Сумма в рублях",
    suffix: "₽",
    next: "f_mfo_2",
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
    question: "Напишите сумму самого крупного кредита, который вы выплатили полностью",
    placeholder: "Сумма в рублях (0, если не было)",
    suffix: "₽",
    next: "f_property_2",
  },

  f_property_2: {
    id: "f_property_2",
    kind: "choice",
    field: "hasProperty",
    question: "Есть ли у вас или у близких недвижимость в собственности?",
    options: [
      { label: "Да, у меня есть", value: "owns", next: "f_sole_owner_2" },
      { label: "У меня нет, но у близких есть", value: "relatives", next: "f_relatives_pledge_consent" },
      { label: "Нет", value: "no", next: "f_car_2_strict" },
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
      { label: "Нет", value: "no", next: "f_arrest_2" },
      { label: "Да", value: "yes", next: "f_arrest_2" },
    ],
  },

  f_arrest_2: {
    id: "f_arrest_2",
    kind: "choice",
    field: "hasArrest",
    question: "Наложен ли арест на регистрационные действия с недвижимостью?",
    options: [
      { label: "Да", value: "yes", next: "f_car_2_lenient" },
      { label: "Нет", value: "no", next: "f_car_2_lenient" },
    ],
  },

  f_minor_owners_2: {
    id: "f_minor_owners_2",
    kind: "choice",
    field: "hasMinorOwners",
    question: "Есть ли несовершеннолетние собственники в долях?",
    options: [
      { label: "Нет", value: "no", next: "f_pledged_2" },
      { label: "Да", value: "yes", next: "f_car_2_strict" },
    ],
  },

  // недвижимости у клиента нет, но, возможно, согласятся дать в залог
  // близкие — тогда автомобиль не станет обязательным условием
  f_relatives_pledge_consent: {
    id: "f_relatives_pledge_consent",
    kind: "choice",
    field: "closeRelativesPledgeConsent",
    question: "Согласны ли будут близкие предоставить свою недвижимость в залог?",
    options: [
      { label: "Да", value: "yes", next: "f_car_2_lenient" },
      { label: "Возможно", value: "maybe", next: "f_car_2_lenient" },
      { label: "Нет", value: "no", next: "f_car_2_strict" },
    ],
  },

  // «мягкий» вопрос про авто — недвижимость (своя, под залогом у близких,
  // либо после проверки ареста) уже покрывает риски, поэтому ответ ни при
  // каком варианте не приводит к отказу
  f_car_2_lenient: {
    id: "f_car_2_lenient",
    kind: "choice",
    field: "hasCar",
    question: "Имеете ли в собственности автомобиль?",
    options: [
      { label: "Да", value: "yes", next: "f_loan_amount_2" },
      { label: "Нет", value: "no", next: "f_loan_amount_2" },
    ],
  },

  // «строгий» вопрос про авто — используется, когда подходящей недвижимости
  // в залог нет (нет своей, есть несовершеннолетние совладельцы, близкие
  // отказались закладывать своё жильё); без авто в такой ситуации предложить
  // клиенту нечего
  f_car_2_strict: {
    id: "f_car_2_strict",
    kind: "choice",
    field: "hasCar",
    question: "Имеете ли в собственности автомобиль?",
    options: [
      { label: "Да", value: "yes", next: "f_loan_amount_2" },
      { label: "Нет", value: "no", next: "f_decline_risk_profile" },
    ],
  },

  f_loan_amount_2: {
    id: "f_loan_amount_2",
    kind: "input",
    field: "loanAmount",
    inputType: "number",
    question: "Какая сумма кредита вас интересует?",
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
    next: "f_final_2",
  },

  f_final_2: {
    id: "f_final_2",
    kind: "final",
    field: "contactInfo",
    question: "Спасибо, что прошли опрос!",
    hint: "Оставьте удобный способ связи — телефон, e-mail или Telegram, — чтобы брокер мог дать вам ответ после анализа заявки.",
  },

  // ---- отказы по ветке «Физлицо» ----
  f_decline_no_income_1: {
    id: "f_decline_no_income_1",
    kind: "decline",
    message: "В вашем случае, поскольку у вас нет дохода, я вынужден отказать — не смогу вам помочь.",
    hint: "Обратитесь снова, когда у вас появится доход. Спасибо, что обратились!",
  },

  f_decline_no_income_2: {
    id: "f_decline_no_income_2",
    kind: "decline",
    message: "В вашем случае, поскольку у вас нет дохода, я не смогу вам помочь.",
    hint: "Обратитесь снова, когда у вас появится доход и не будет ни одного дня просрочки минимум 12 месяцев подряд. Спасибо, что обратились!",
  },

  f_decline_risk_profile: {
    id: "f_decline_risk_profile",
    kind: "decline",
    message: "К сожалению, с такими данными я пока не смогу вам помочь.",
    hint: "Рекомендация: не подавайте заявки на кредит в течение 1 года. Погасите просрочку и после этого не допускайте ни одного дня просрочки минимум 12 месяцев подряд. Спасибо, что обратились!",
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
    min: 20,
    max: 65,
    next: "ip_open_date",
  },

  ip_open_date: {
    id: "ip_open_date",
    kind: "input",
    field: "ipOpenDate",
    inputType: "date",
    question: "Укажите дату открытия ИП",
    hint: "Если с даты открытия прошло меньше 6 месяцев, кредитование по ИП пока недоступно — предложим альтернативу.",
    next: "ip_turnover",
    dateBranch: { minMonths: 6, belowNext: "ip_consent_individual" },
  },

  ip_consent_individual: {
    id: "ip_consent_individual",
    kind: "choice",
    field: "ipConsentToIndividual",
    question:
      "К сожалению, ИП кредитуют сроком от 6 месяцев с момента открытия и с оборотом по счетам от 100 000 ₽ в месяц. Для вас можем рассмотреть кредитование как для физлица. Вы согласны?",
    options: [
      { label: "Да", value: "yes", next: "f_registration_city" },
      { label: "Нет", value: "no", next: "ip_decline" },
    ],
  },

  ip_decline: {
    id: "ip_decline",
    kind: "decline",
    message: "В таком случае на данный момент я не смогу вам помочь.",
    hint: "Обратитесь снова, когда с момента открытия ИП пройдёт 6 месяцев, либо если будете готовы рассмотреть вариант кредитования как физлицо. Спасибо, что обратились!",
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
    question: "Напишите сумму чистой прибыли за месяц",
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
    next: "ip_loan_amount",
  },

  ip_loan_amount: {
    id: "ip_loan_amount",
    kind: "input",
    field: "loanAmount",
    inputType: "number",
    question: "Какая сумма кредита нужна?",
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
    next: "ip_final",
  },

  ip_final: {
    id: "ip_final",
    kind: "final",
    field: "contactInfo",
    question: "Спасибо, что прошли опрос!",
    hint: "Оставьте удобный способ связи — телефон, e-mail или Telegram, — чтобы брокер мог дать вам ответ после анализа заявки.",
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
    min: 20,
    max: 65,
    next: "llc_open_date",
  },

  llc_open_date: {
    id: "llc_open_date",
    kind: "input",
    field: "llcOpenDate",
    inputType: "date",
    question: "Укажите дату регистрации ООО",
    hint: "Если с даты регистрации прошло меньше 12 месяцев, потребуется залог — предложим варианты.",
    next: "llc_turnover",
    dateBranch: { minMonths: 12, belowNext: "llc_consent_collateral" },
  },

  llc_consent_collateral: {
    id: "llc_consent_collateral",
    kind: "choice",
    field: "llcConsentToCollateral",
    question:
      "К сожалению, ООО кредитуют сроком от 12 месяцев с момента регистрации и с оборотом по счетам от 800 000 ₽ в месяц. Для вас можем рассмотреть кредитование под залог недвижимости, оборудования или спецтехники. Вы согласны?",
    options: [
      { label: "Да", value: "yes", next: "llc_turnover" },
      { label: "Нет", value: "no", next: "llc_decline" },
    ],
  },

  llc_decline: {
    id: "llc_decline",
    kind: "decline",
    message: "В таком случае на данный момент я не смогу вам помочь.",
    hint: "Обратитесь снова, когда с момента регистрации ООО пройдёт 12 месяцев, либо если будете готовы рассмотреть вариант кредитования под залог. Спасибо, что обратились!",
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
    question: "Напишите сумму чистой прибыли за месяц",
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
    next: "llc_loan_amount",
  },

  llc_loan_amount: {
    id: "llc_loan_amount",
    kind: "input",
    field: "loanAmount",
    inputType: "number",
    question: "Какая сумма кредита нужна?",
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
    next: "llc_final",
  },

  llc_final: {
    id: "llc_final",
    kind: "final",
    field: "contactInfo",
    question: "Спасибо, что прошли опрос!",
    hint: "Оставьте удобный способ связи — телефон, e-mail или Telegram, — чтобы брокер мог дать вам ответ после анализа заявки.",
  },
};

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
  ipOpenDate: "Дата открытия ИП",
  ipConsentToIndividual: "Согласие на рассмотрение как физлицо",
  ipTurnover: "Оборот по счету в месяц",
  netProfit: "Чистая прибыль в месяц",
  inn: "ИНН",
  llcOpenDate: "Дата регистрации ООО",
  llcConsentToCollateral: "Согласие на кредитование под залог",
  orgTurnover: "Оборот по счету в месяц",
  name: "Имя",
  contactInfo: "Контакт для связи",
};
