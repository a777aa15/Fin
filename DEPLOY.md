# Развёртывание на сервере

Прод-стек: **Docker Compose** = приложение (Next.js standalone) + **PostgreSQL**.
Сайт поднимется на `http://<ip-сервера>` (порт 80).

## 1. Установить Docker

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com | sh
```

**AlmaLinux / RHEL / Rocky / CentOS:**
```bash
curl -fsSL https://download.docker.com/linux/centos/docker-ce.repo -o /etc/yum.repos.d/docker-ce.repo
dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin --allowerasing
systemctl enable --now docker
```

Проверка: `docker --version` и `docker compose version`.
Если работаете не под root — добавьте себя в группу: `sudo usermod -aG docker $USER` (затем перелогиньтесь).

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

Откройте порт 80 (на AlmaLinux/RHEL активен firewalld):
```bash
firewall-cmd --permanent --add-port=80/tcp && firewall-cmd --reload
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

## 5a. Авто-письма (сброс пароля по SMTP)

Чтобы ссылка для сброса пароля уходила пользователю письмом автоматически,
задайте SMTP в `.env` и пересоберите. Без этих переменных письма не шлются —
токен по-прежнему виден админу в `/admin` (ручная передача).

**Gmail** (нужен «пароль приложения», не обычный пароль):
1. Включите двухэтапную аутентификацию в Google-аккаунте.
2. https://myaccount.google.com/apppasswords → создайте пароль приложения (16 символов).
3. В `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=you@gmail.com
   SMTP_PASS=<пароль приложения>
   SMTP_FROM=you@gmail.com
   ```
**Яндекс:** `SMTP_HOST=smtp.yandex.ru`, `SMTP_PORT=465`, пароль приложения Яндекса.

Затем `docker compose up -d --build`. Проверьте: `/forgot` → письмо со ссылкой.
Если письма не уходят (провайдер блокирует SMTP с сервера) — попробуйте Яндекс/Mail.ru.

## 6. Домен и HTTPS (Caddy, авто-сертификат)

В стек уже включён **Caddy** — reverse-proxy с авто-TLS Let's Encrypt.
Домен и сертификат настраиваются так:

1. В DNS домена создайте **A-запись** на IP сервера (`@` → `31.77.141.114`).
2. Впишите свой домен в `Caddyfile` (по умолчанию — `fincourse.site`).
3. Откройте порты 80 и 443:
   ```bash
   firewall-cmd --permanent --add-port=80/tcp
   firewall-cmd --permanent --add-port=443/tcp
   firewall-cmd --reload
   ```
4. Запустите: `docker compose up -d --build`. Caddy сам получит сертификат
   (нужно, чтобы DNS уже указывал на сервер и порты были открыты).
5. Сайт откроется по `https://<домен>` с валидным сертификатом.

`COOKIE_SECURE` по умолчанию `true` (для HTTPS). Если запускаете без домена по
голому HTTP — поставьте `COOKIE_SECURE=false` в `.env`, иначе cookie-сессия не
сохранится и вход не будет работать.

## Безопасность

- Откройте на файрволе только 80/443 и SSH (22). Порт Postgres наружу не публикуется
  (доступен только внутри compose-сети).
- `.env` с секретами не коммитьте (он в `.gitignore`).
- Смените плейсхолдер контактного e-mail `hello@example.com` в
  `src/components/EnrollDialog.tsx` и `EnrollSection.tsx` на реальный.
