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

    if sys.argv[1] == "1":
        start = (end // 6) * 5
    elif sys.argv[1] == "2":
        start = (end // 6) * 4
        end = (end // 6) * 5
    elif sys.argv[1] == "3":
        start = (end // 6) * 3
        end = (end // 6) * 4
    elif sys.argv[1] == "4":
        start = (end // 6) * 2
        end = (end // 6) * 3
    elif sys.argv[1] == "5":
        start = (end // 6) * 1
        end = (end // 6) * 2
    elif sys.argv[1] == "6":
        start = 0
        end = (end // 6) * 1

    item = requests.get(
        f"https://hacker-news.firebaseio.com/v0/item/{start}.json"
    ).json()

    if "reversed" in sys.argv:
        start, end = end, start
        while end <= start and item is not None:
            if (
                requests.get(
                    f"https://api.trieve.ai/api/chunk/tracking_id/{end}",
                    headers={
                        "TR-Dataset": "2c3e9673-b685-44fd-a1a2-4d9848c30541",
                        "Authorization": "tr-6b3fb3MXYs799XuAryTfGzJZmGffN6S3",
                    },
                )
                .json()
                .get("message")
                != None
            ):
                print(item["id"])
                if (
                    ("title" in item or "text" in item)
                    and "deleted" not in item
                    and "dead" not in item
                ):
                    redis_client.lpush("hn", str(item))
                end -= 1
                item = requests.get(
                    f"https://hacker-news.firebaseio.com/v0/item/{end}.json"
                ).json()
    else:
        while start <= end and item is not None:
            if (
                requests.get(
                    f"https://api.trieve.ai/api/chunk/tracking_id/{start}",
                    headers={
                        "TR-Dataset": "2c3e9673-b685-44fd-a1a2-4d9848c30541",
                        "Authorization": "tr-6b3fb3MXYs799XuAryTfGzJZmGffN6S3",
                    },
                )
                .json()
                .get("message")
                != None
            ):
                print(item["id"])
                if (
                    ("title" in item or "text" in item)
                    and "deleted" not in item
                    and "dead" not in item
                ):
                    redis_client.lpush("hn", str(item))
                start += 1
                item = requests.get(
                    f"https://hacker-news.firebaseio.com/v0/item/{start}.json"
                ).json()

    # last_final = redis_client.get("last_final")

    # if last_final == None or final > int(last_final):
    #     redis_client.set("last_final", final)
    #     start = int(last_final) if last_final != None else 0


while True:
    ingest_hn()
    time.sleep(3)
