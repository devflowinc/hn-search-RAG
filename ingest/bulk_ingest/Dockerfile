FROM python:3.12.4-slim-bookworm

RUN apt-get update -y && apt-get -y install pkg-config libssl-dev libpq-dev g++ curl

WORKDIR /app
COPY requirements.txt /app/requirements.txt

RUN pip install -r requirements.txt
COPY bulk_ingest.py /app/bulk_ingest.py

CMD ["python", "/app/bulk_ingest.py"]
