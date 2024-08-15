import os
import requests
import redis
print("backfill init")

redis_host = os.getenv("REDIS_URL")

# Connect to Redis
redis_client = redis.Redis(host=redis_host)
lastfinal = int(requests.get("https://hacker-news.firebaseio.com/v0/maxitem.json").text)

for i in range(lastfinal - 10_000, lastfinal):
    redis_client.lpush("tovisit", i)

redis_client.lpush("tovisit", *requests.get("https://hacker-news.firebaseio.com/v0/updates.json").json()["items"])
redis_client.lpush("tovisit", *requests.get("https://hacker-news.firebaseio.com/v0/askstories.json").json())
redis_client.lpush("tovisit", *requests.get("https://hacker-news.firebaseio.com/v0/showstories.json").json())
redis_client.lpush("tovisit", *requests.get("https://hacker-news.firebaseio.com/v0/beststories.json").json())
redis_client.lpush("tovisit", *requests.get("https://hacker-news.firebaseio.com/v0/topstories.json").json())
redis_client.lpush("tovisit", *requests.get("https://hacker-news.firebaseio.com/v0/newstories.json").json())
print("Queued backfill successfully")
