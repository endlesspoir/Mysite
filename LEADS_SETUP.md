# Подключение формы заявок NovEspoir

Форма на сайте уже готова: валидация, honeypot, rate limit на стороне функции, UTM/TikTok
click ID, русский и английский языки, fallback на email. Осталось один раз создать базу и
функцию в Appwrite, затем указать домен функции в `assets/config.js`.

Публичного Telegram-бота нет. Telegram в этой схеме — **необязательный приватный канал
уведомлений для владельца сайта**. На сайте ссылки на него нет.

## Самый быстрый вариант: заявки на email

Если база не нужна, проще всего получать заявки прямо на `romanetsmaks0@gmail.com` через
Web3Forms. Это бесплатно до 250 заявок в месяц и не требует Appwrite Function.

1. Откройте https://web3forms.com/#start и введите `romanetsmaks0@gmail.com`.
2. Скопируйте access key из письма.
3. Вставьте его в `assets/config.js`:

```js
window.NOVESPOIR_CONFIG = {
  leadEndpoint: "",
  web3formsKey: "ваш-access-key",
  email: "romanetsmaks0@gmail.com",
  botUrl: "",
  siteUrl: "https://novespoir.tech"
};
```

4. Запушьте в `main` и отправьте тестовую заявку с сайта.

В этом режиме заявка уходит на почту, а не в базу. Если позже понадобится база, история
заявок и Appwrite, вернитесь к инструкции ниже и заполните `leadEndpoint`.

## Схема

```
Браузер → Appwrite Function (/lead) → Appwrite TablesDB (leads)
                                   ↘ (опционально) Telegram / webhook владельцу
```

## 1. Создать базу и таблицу

Appwrite Console → проект `6a8ddc780011b315c87d` → **Databases** → **Create database**.

- Database ID: `novespoir` (можно другой, главное — тот же в env функции)
- Table ID: `leads`

Создайте колонки (Columns) типа **String**, все **Required**:

| ID колонки | Размер | Назначение |
| --- | ---: | --- |
| `kind` | 32 | источник, сейчас `site` |
| `name` | 128 | имя |
| `contact` | 256 | Telegram / телефон / email |
| `message` | 4000 | описание задачи |
| `status` | 32 | статус, функция пишет `new` |
| `payload` | 20000 | JSON с UTM, страницей, языком и т.д. |

Доступ к таблице гостям не нужен: строки создаёт функция серверным ключом. Не включайте
публичные разрешения `create` для `any` — иначе форму можно будет спамить напрямую в базу.

Индекс по `status` или `$createdAt` не обязателен, но удобен для сортировки в консоли.

## 2. Создать функцию

Appwrite Console → **Functions** → **Create function** → подключить Git:

- Repository: `endlesspoir/Mysite`
- Branch: `main`
- Root directory: `functions/leads`
- Entrypoint: `src/main.js`
- Runtime: **Node.js 22** (подойдёт и 20, но `node-appwrite@31` требует Node ≥ 20)
- Build command: `npm install` (если Appwrite не сделал это автоматически)
- Execute access: **Any** — иначе домен функции не пустит браузер

В настройках функции включите scopes на работу с TablesDB:

- TablesDB / Rows: **create/write** (в разных версиях консоли пункт называется
  `TablesDB → write`, `Rows → create` или `databases.write`);
- чтение не обязательно, функция только создаёт строки.

Если не включить scope, `createRow` вернёт `401/403`. В логах функции будет
`Lead storage error`.

### Переменные окружения функции

Functions → ваша функция → Settings → Environment variables:

| Переменная | Значение |
| --- | --- |
| `LEADS_DB_ID` | `novespoir` (ID базы из шага 1) |
| `LEADS_TABLE_ID` | `leads` |
| `ALLOWED_ORIGINS` | `https://novespoir.tech,https://www.novespoir.tech,https://novespoir.appwrite.network` |
| `RATE_LIMIT_MAX` | `8` (необязательно) |
| `RATE_LIMIT_WINDOW_MS` | `600000` (необязательно, 10 минут) |

Необязательные уведомления:

| Переменная | Значение |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | токен приватного бота из BotFather |
| `TELEGRAM_CHAT_ID` | ваш chat ID |
| `NOTIFY_WEBHOOK_URL` | URL вебхука для n8n / Make / своего обработчика |

Если уведомления не нужны — не заполняйте эти три переменные. Заявки всё равно сохранятся
в базе.

`APPWRITE_FUNCTION_API_ENDPOINT`, `APPWRITE_FUNCTION_PROJECT_ID` и execution key Appwrite
передаёт сам, вручную их добавлять не нужно.

### Домен функции

Functions → ваша функция → **Domains** (или Overview). Скопируйте домен вида:

```
https://<function-id>.fra.appwrite.run
```

Если домена нет, создайте его в разделе Domains и убедитесь, что Execute access = Any.
Полный endpoint формы:

```
https://<function-id>.fra.appwrite.run/lead
```

Функция также принимает `/` и `/leads`, но в `config.js` лучше указать `/lead`.

## 3. Прописать endpoint на сайте

Откройте `assets/config.js` и заполните:

```js
window.NOVESPOIR_CONFIG = {
  leadEndpoint: "https://<function-id>.fra.appwrite.run/lead",
  email: "romanetsmaks0@gmail.com",
  botUrl: "",
  siteUrl: "https://novespoir.tech"
};
```

Запушьте изменение в `main`. Appwrite Sites автоматически задеплоит сайт. Если Appwrite
Functions подключена к Git, повторный деплой функции тоже произойдёт автоматически.

`botUrl` оставьте пустым, пока нет публичного бота/канала. Личный Telegram туда не вставляйте.

## 4. Проверить до трафика

Сначала проверьте health:

```bash
curl -sS https://<function-id>.fra.appwrite.run/health
```

Ожидаемо:

```json
{"ok":true,"service":"novespoir-leads","storage":true,"notify":false}
```

Затем отправьте тестовую заявку:

```bash
curl -i -X POST 'https://<function-id>.fra.appwrite.run/lead' \
  -H 'content-type: application/json' \
  -H 'origin: https://novespoir.tech' \
  -d '{
    "name": "Тест",
    "contact": "@test_user",
    "service": "sites",
    "serviceLabel": "Сайт или лендинг",
    "budget": "medium",
    "budgetLabel": "Средний проект",
    "message": "Тестовая заявка с сайта",
    "consent": true,
    "company": "",
    "elapsedMs": 5000,
    "lang": "ru",
    "page": "https://novespoir.tech/",
    "landing": "https://novespoir.tech/?utm_source=tiktok",
    "referrer": "https://www.tiktok.com/",
    "utm": {"source": "tiktok", "campaign": "test", "ttclid": "abc123"}
  }'
```

Ожидаемо: `200` и `{"ok":true,"id":"..."}`. Проверьте строку в
Databases → `novespoir` → `leads` → Rows.

Проверка CORS preflight:

```bash
curl -i -X OPTIONS 'https://<function-id>.fra.appwrite.run/lead' \
  -H 'origin: https://novespoir.tech' \
  -H 'access-control-request-method: POST' \
  -H 'access-control-request-headers: content-type'
```

Ожидаемо: `204` и заголовок
`access-control-allow-origin: https://novespoir.tech`.

После этого откройте сайт, отправьте заявку через форму и проверьте:
1. сообщение «Заявка отправлена»;
2. новую строку в Appwrite;
3. уведомление, если настроили Telegram/webhook.

**Не запускайте трафик с TikTok, пока тестовая заявка не дошла до базы.**

## 5. Где смотреть заявки

Appwrite Console → Databases → `novespoir` → `leads` → Rows. В колонке `payload` лежит
полный JSON: UTM, `ttclid`, страница входа, referrer, язык, страна, user agent.

Если настроен `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`, уведомление приходит в личный чат
владельца. Это не публичный бот: клиенты его не видят, ссылки на него на сайте нет.

### Как получить chat ID (только для уведомлений)

1. Создайте бота в BotFather и скопируйте токен.
2. Напишите боту `/start`.
3. Узнайте chat ID через `@userinfobot` или
   `https://api.telegram.org/bot<TOKEN>/getUpdates`.
4. Подставьте токен и chat ID в env функции, переdeployьте функцию.

## 6. Если что-то не работает

| Симптом | Причина и решение |
| --- | --- |
| Форма пишет «ещё не подключена» | `leadEndpoint` пуст в `assets/config.js` или сайт не задеплоился |
| `403 origin_not_allowed` | добавьте точный origin сайта в `ALLOWED_ORIGINS` и переdeployьте функцию |
| `503 storage_unavailable` | не заданы `LEADS_DB_ID`/`LEADS_TABLE_ID`, нет scope или нет уведомлений как fallback |
| `401/403` в логах функции | включите scope TablesDB/Rows write для функции |
| `404 not_found` | неверный путь; используйте `/lead` |
| CORS-ошибка в браузере | проверьте preflight, `ALLOWED_ORIGINS`, Execute access = Any |
| `429 rate_limited` | сработал лимит по IP; подождите 10 минут или измените `RATE_LIMIT_MAX` |
| Заявка есть в TG, но нет в базе | это fallback при ошибке storage; проверьте DB ID, колонки и scope |
| Деплой функции не обновился | проверьте Git connection, root directory `functions/leads`, branch `main` |

Логи функции: Functions → ваша функция → Executions / Logs.

## 7. Безопасность и данные

- Публичных разрешений на запись в таблицу нет: пишет только функция.
- Honeypot + минимальное время заполнения + rate limit по IP.
- Пароли, токены и API-ключи хранятся только в env Appwrite, не в репозитории.
- Персональные данные: `privacy.html`; указаны Appwrite, Telegram (если включён) и Google Fonts.
- Appwrite Cloud в регионе Frankfurt (ЕС). Это трансграничная передача; политика это описывает.
- Если позже понадобится более сильная защита от ботов, добавьте Cloudflare Turnstile и
  проверку токена в функции.

### Про тариф Appwrite

Education plan даёт Pro-эквивалент, но по условиям Appwrite его нельзя использовать для
коммерческих проектов. Если форма будет принимать платные заявки, проверьте условия тарифа
или перейдите на Free/Pro. Технически функции и база на Free тоже работают, но у Free есть
лимиты и проекты могут засыпать при простое.

## 8. Что осталось сделать вручную

- [ ] Создать базу `novespoir` и таблицу `leads`.
- [ ] Создать функцию из Git с root `functions/leads`.
- [ ] Включить scope на запись в TablesDB.
- [ ] Заполнить env функции.
- [ ] Скопировать домен функции в `assets/config.js`.
- [ ] Запушить сайт и функцию.
- [ ] Проверить `/health`, тестовую заявку и строку в базе.
- [ ] При необходимости настроить приватные уведомления.
- [ ] Подключить DNS `novespoir.tech` к Appwrite Sites.
