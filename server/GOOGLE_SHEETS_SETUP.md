# Резервное сохранение заявок в Google Таблицу

Это третий, полностью независимый канал доставки заявок — вдобавок к Telegram
и Email. Если один из основных каналов временно откажет (SMTP, лимиты Telegram
API и т.п.), заявка всё равно сохранится здесь. Настройка бесплатная, без базы
данных, занимает 5–10 минут.

## Шаг 1. Создать таблицу

1. Откройте [Google Sheets](https://sheets.google.com) → «Создать таблицу».
2. Переименуйте её, например, «G.M. Broker — заявки (резерв)».
3. В первой строке (заголовки) впишите:

   ```
   Дата отправки | Тип клиента | Имя | E-mail | Сумма | Цель | Полная анкета (JSON)
   ```

## Шаг 2. Добавить Apps Script

1. В таблице: **Расширения → Apps Script**.
2. Удалите содержимое редактора и вставьте код ниже.
3. Замените `СЮДА_ВСТАВЬТЕ_СЕКРЕТ` на произвольную длинную строку (пароль) —
   она же пойдёт в `GOOGLE_SHEETS_WEBHOOK_SECRET` на сервере.

```javascript
const SECRET = "СЮДА_ВСТАВЬТЕ_СЕКРЕТ";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.secret !== SECRET) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: "invalid secret" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      data.submittedAt || new Date().toISOString(),
      data.clientType || "",
      data.name || "",
      data.contactInfo || "",
      data.loanAmount || "",
      data.loanPurpose || "",
      data.answersJson || "",
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Шаг 3. Опубликовать как Web App

1. Кнопка **Развернуть → Новое развёртывание** (Deploy → New deployment).
2. Тип: **Веб-приложение** (Web app).
3. «Выполнять как»: **От своего имени** (собственный Google-аккаунт).
4. «У кого есть доступ»: **Все** (Anyone) — это не даёт доступ к таблице
   напрямую, только к приёму POST-запросов; секрет из шага 2 защищает от
   постороннего мусора.
5. Нажмите **Развернуть**, разрешите доступ приложению (запросит подтверждение
   аккаунта), скопируйте выданный **URL веб-приложения** — он имеет вид
   `https://script.google.com/macros/s/XXXXXXX/exec`.

## Шаг 4. Прописать переменные на сервере

В `.env` на сервере (Timeweb):

```
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/XXXXXXX/exec
GOOGLE_SHEETS_WEBHOOK_SECRET=<та же строка, что в SECRET на шаге 2>
```

После перезапуска сервера каждая новая заявка будет параллельно уходить и в
эту таблицу. Если переменные не заданы — сервер продолжит работать как раньше
(Telegram + Email), просто без резервной копии.

## Проверка

Отправьте тестовую анкету на сайте — в логах сервера при удачной доставке
хотя бы в один канал ошибок быть не должно; при проблеме именно с Google
Sheets в логе появится строка вида:

```
[submit] sheets delivery failed: ...
```

Это не мешает работе сайта (заявка всё равно дойдёт по Telegram/Email), но
стоит проверить URL/секрет, если такие ошибки идут постоянно.
