import csv
import requests
import csv
from tqdm import tqdm
import redis
import os
from trieve_client import AuthenticatedClient
from trieve_client.models import CreateChunkData, ReturnCreatedChunk, ErrorResponseBody
from trieve_client.api.chunk import create_chunk
from datetime import datetime, timedelta

# Connect to Redis
redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    password="thisredispasswordisverysecureandcomplex",
)
header = [
    "by",
    "descendants",
    "id",
    "kids",
    "score",
    "time",
    "title",
    "text",
    "type",
    "url",
]


def ingest_hn():
    final = int(
        requests.get("https://hacker-news.firebaseio.com/v0/maxitem.json").json()
    )

    last_final = redis_client.get("last_final")

    if last_final == None or final > int(last_final):
        redis_client.set("last_final", final)
        start = int(last_final) if last_final != None else 0

        item = requests.get(
            f"https://hacker-news.firebaseio.com/v0/item/{final}.json"
        ).json()

        yesterday = datetime.timestamp(datetime.today() - timedelta(days=1))
        while item["time"] > yesterday and start < final:
            print(item["id"])
            if (
                ("title" in item or "text" in item)
                and "deleted" not in item
                and "dead" not in item
            ):
                redis_client.lpush("hn", str(item))
            final -= 1
            item = requests.get(
                f"https://hacker-news.firebaseio.com/v0/item/{final}.json"
            ).json()


ingest_hn()
