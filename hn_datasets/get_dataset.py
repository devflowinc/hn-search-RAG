from re import error
import requests
import redis

# Connect to Redis
redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    password="thisredispasswordisverysecureandcomplex",
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

    if (not fail and (item is not None) and ("deleted" not in item) and ("dead" not in item)):
        print(start)
        redis_client.lpush("hn", str(item))
