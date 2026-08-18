#!/bin/sh
# Резервная копия базы данных курса.
# Запуск из папки проекта:  ./scripts/backup-db.sh
# Автоматически (ежедневно в 3:30) — см. DEPLOY.md, раздел «Бэкапы».
#
# Копии складываются в ./backups, старее KEEP_DAYS дней удаляются.

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y-%m-%d_%H-%M)"
FILE="$BACKUP_DIR/finansist_$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

# Дамп из контейнера с Postgres (имя пользователя/БД — как в docker-compose.yml)
docker compose exec -T db pg_dump -U finansist finansist | gzip > "$FILE"

# Пустой файл means ошибка — не оставляем битую копию
if [ ! -s "$FILE" ]; then
  echo "ОШИБКА: дамп пустой, копия удалена" >&2
  rm -f "$FILE"
  exit 1
fi

# Ротация старых копий
find "$BACKUP_DIR" -name 'finansist_*.sql.gz' -type f -mtime +"$KEEP_DAYS" -delete

echo "Бэкап готов: $FILE ($(du -h "$FILE" | cut -f1))"
