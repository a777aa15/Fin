# Развёртывание на сервере

Прод-стек: **Docker Compose** = приложение (Next.js standalone) + **PostgreSQL**.
Сайт поднимется на `http://<ip-сервера>` (порт 80).

## 1. Установить Docker (Ubuntu/Debian)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # чтобы docker работал без sudo (перелогиньтесь после)
```

Проверка: `docker --version` и `docker compose version`.

## 2. Забрать код

```bash
git clone https://github.com/a777aa15/Fin.git
cd Fin
```

## 3. Создать файл окружения `.env`

```bash
cp .env.deploy.example .env
nano .env
```

Заполнить:

| Переменная | Что вписать |
|---|---|
| `POSTGRES_PASSWORD` | придумать надёжный пароль для БД |
| `AUTH_SECRET` | сгенерировать: `openssl rand -hex 32` |
| `GEMINI_API_KEY` | ваш ключ Google AI Studio |
| `MENTOR_PROXY_URL` | `socks5://user:pass@host:port` (прокси для Gemini) |
| `MENTOR_MODEL` | `gemini-3.6-flash` (можно оставить по умолчанию) |

`DATABASE_URL` задавать не нужно — compose соберёт его сам из `POSTGRES_PASSWORD`.

## 4. Запустить

```bash
docker compose up -d --build
```

Первая сборка займёт пару минут. Затем откройте в браузере:

```
http://31.77.141.114
```

Таблицы БД создаются автоматически при первом обращении. Регистрируйтесь и проверяйте.

## 5. Обновление после изменений в репозитории

```bash
git pull
docker compose up -d --build
```

Полезное:

```bash
docker compose logs -f web     # логи приложения
docker compose ps              # статус
docker compose down            # остановить (данные БД сохраняются в volume)
```

## 6. Домен и HTTPS (когда будет домен)

Сейчас сайт открыт по IP на порту 80. Для домена и HTTPS:

1. Направьте A-запись домена на `31.77.141.114`.
2. Поставьте перед приложением reverse-proxy (nginx/Caddy) с TLS.
   Самый простой путь — **Caddy** (авто-TLS Let's Encrypt): в `docker-compose.yml`
   поменяйте у `web` проброс на `expose: ["3000"]` и добавьте сервис Caddy с
   `example.com { reverse_proxy web:3000 }`. Скажите — подготовлю этот вариант.

## Безопасность

- Откройте на файрволе только 80/443 и SSH (22). Порт Postgres наружу не публикуется
  (доступен только внутри compose-сети).
- `.env` с секретами не коммитьте (он в `.gitignore`).
- Смените плейсхолдер контактного e-mail `hello@example.com` в
  `src/components/EnrollDialog.tsx` и `EnrollSection.tsx` на реальный.
