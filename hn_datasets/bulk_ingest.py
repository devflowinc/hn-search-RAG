import ast
import redis
import requests
from datetime import datetime

# Connect to Redis
redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    password="thisredispasswordisverysecureandcomplex",
)

num_to_pop = 100
api_key = "tr-********************************"
dataset_id = "********-****-****-****-************"
api_url = "https://api.trieve.ai/api"

def deserialize_to_dict(item):
    item = ast.literal_eval(item.decode("utf-8"))
    if (
        item
        and "type" in item
        and "deleted" not in item
        and "dead" not in item
    ):
        row = {
            "by": item.get("by"),
            "descendants": item.get("descendants"),
            "id": item.get("id"),
            "kids": item.get("kids"),
            "score": item.get("score"),
            "time": item.get("time"),
            "title": item.get("title"),
            "text": (
                item.get("text").strip().replace("\n", " ").replace("\r", " ")
                if item.get("text")
                else None
            ),
            "type": item.get("type"),
            "url": item.get("url"),
        }

        maybe_time = row.get("time")
        try:
            stamp = None if maybe_time is None else datetime.fromtimestamp(maybe_time).strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        except:
            stamp = None

        data = dict(
            chunk_html=row["title"] if row["title"] else row["text"],
            link=row["url"],
            metadata={
                "by": row.get("by"),
                "descendants": row.get("descendants"),
                "id": row.get("id"),
                "kids": row.get("kids"),
                "score": row.get("score"),
                "time": row.get("time"),
                "title": row.get("title"),
                "text": row.get("text"),
                "type": row.get("type"),
            },
            tracking_id=str(row.get("id")),
            time_stamp=stamp,
            weight=int(row.get("score") if row.get("score") else 0)
        )
        return data

    return None

while True:
    redis_resp = redis_client.lpop("hn", num_to_pop)
    # Check if item ID is already present
    chunks = list(map(deserialize_to_dict, redis_resp))
    url = f"{api_url}/chunk"
    print(url)
    chunk_response = requests.post(
        url,
        headers={ "Content-Type": "application/json","TR-Dataset": dataset_id, "Authorization": api_key },
        json=chunks
    )
    print(chunk_response)
