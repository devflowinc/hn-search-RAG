from re import error
import sys
import time
import requests
import redis
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
    end = int(requests.get("https://hacker-news.firebaseio.com/v0/maxitem.json").json())

    start = 0
    n_split = int(sys.argv[1])
    section = int(sys.argv[2])

    start = end // n_split * section

    while end > start:
        # Try to get error message, error happens if it doesn't exist
        error_message = requests.get(
            f"https://api.trieve.ai/api/chunk/tracking_id/{end}",
            headers={
                "TR-Dataset": "2c3e9673-b685-44fd-a1a2-4d9848c30541",
                "Authorization": "tr-6b3fb3MXYs799XuAryTfGzJZmGffN6S3",
            },
        ).json().get("message")

        if error_message == None:

            item = requests.get(
                f"https://hacker-news.firebaseio.com/v0/item/{start}.json"
            ).json()

            print("Fetching", item["id"])

            if (
                ("title" in item or "text" in item)
                and "deleted" not in item
                and "dead" not in item
            ):
                redis_client.lpush("hn", str(item))

            end -= 1

while True:
    ingest_hn()
    print("sleeping")
    time.sleep(3)
