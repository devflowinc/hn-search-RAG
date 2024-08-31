FROM python:3.12.4-slim-bookworm

RUN apt-get update -y && apt-get -y install pkg-config libssl-dev libpq-dev g++ curl

WORKDIR /app
COPY requirements.txt /app/requirements.txt

RUN pip install -r requirements.txt
COPY backfill.py /app/backfill.py

CMD ["python", "/app/backfill.py"]
