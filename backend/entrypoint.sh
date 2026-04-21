#!/bin/sh
set -e

if [ "${USE_SQLITE:-false}" != "true" ]; then
	echo "Waiting for PostgreSQL at ${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}..."
	until python - <<'PY'
import os
import psycopg2

psycopg2.connect(
		dbname=os.getenv("POSTGRES_DB", "sneaker_db"),
		user=os.getenv("POSTGRES_USER", "sneaker_user"),
		password=os.getenv("POSTGRES_PASSWORD", "sneaker_password"),
		host=os.getenv("POSTGRES_HOST", "db"),
		port=int(os.getenv("POSTGRES_PORT", "5432")),
)
print("postgres-ready")
PY
	do
		echo "PostgreSQL unavailable, retrying..."
		sleep 2
	done
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
