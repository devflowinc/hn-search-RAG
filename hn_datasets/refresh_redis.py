import requests
import time
from tqdm import tqdm
import redis

redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    password="thisredispasswordisverysecureandcomplex",
)

while True:
    last_final = redis_client.get("last_final")
    last_final = int(last_final) if last_final != None else 0
    print(last_final)

    end = int(requests.get("https://hacker-news.firebaseio.com/v0/maxitem.json").json())

    for i in tqdm(range(last_final, end)):
        redis_client.lpush("tovisit", i)
        last_final = redis_client.set("last_final", i)

    print("sleeping")
    time.sleep(3)
