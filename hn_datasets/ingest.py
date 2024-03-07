import ast
import redis
from trieve_client import AuthenticatedClient
from trieve_client.models import CreateChunkData, ReturnCreatedChunk, ErrorResponseBody
from trieve_client.api.chunk import create_chunk
from datetime import datetime

# Connect to Redis
redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    password="thisredispasswordisverysecureandcomplex",
)

trieve_client = AuthenticatedClient(
    base_url="https://api.trieve.ai",
    prefix="",
    token="tr-6b3fb3MXYs799XuAryTfGzJZmGffN6S3",
).with_headers(
    {
        "TR-Organization": "2ccba845-f621-4c86-abe0-bdfa6ff8e637",
    }
)


while True:
    redis_resp = redis_client.blpop("hn")
    item = ast.literal_eval(redis_resp[1].decode("utf-8"))
    # Check if item ID is already present
    if (
        item
        and "type" in item
        and "deleted" not in item
        and "dead" not in item
    ):
        print(item.get("id"))
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
        data = CreateChunkData(
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
            time_stamp=datetime.fromtimestamp(row.get("time")).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
            weight=int(row.get("score") if row.get("score") else 0),
        )
        chunk_response = create_chunk.sync(
            tr_dataset="346e6cfd-2914-4e09-8738-cd341ddf96db",
            client=trieve_client,
            body=data,
        )
        if type(chunk_response) == ErrorResponseBody:
            print(f"Failed {chunk_response.message}")
            exit(1)
