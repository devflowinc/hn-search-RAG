import os
import requests
import redis

redis_host = os.getenv("REDIS_URL")
redis_client = redis.Redis(
    host=redis_host,
)

while True:
    start = redis_client.blpop("tovisit")
    start = int(start[1])
    fail = False
    try:
        item = requests.get(
            f"https://hacker-news.firebaseio.com/v0/item/{start}.json"
        ).json()
    except:
        fail = True
    print(item)
    if (not fail and (item is not None) and ("deleted" not in item) and ("dead" not in item)):
        print(start)
        redis_client.lpush("hn", str(item))
