import ast
from urllib.parse import urlparse
import os
import redis
import requests
from datetime import datetime

redis_host = os.getenv("REDIS_URL")

# Connect to Redis
redis_client = redis.Redis(host=redis_host)

num_to_pop = 120
api_key = os.getenv("API_KEY")
dataset_id = os.getenv("DATASET_ID")
api_url = os.getenv("API_BASE_URL")  # "https://hackernews.withtrieve.com/api"

comment_distance_factor = float(os.getenv("COMMENT_DISTANCE_FACTOR", 1.3))

story_boost_factor = float(os.getenv("STORY_BOOST_FACTOR", 1.5))


def deserialize_to_dict(item):
    item = item.decode("utf-8")
    print(item)
    item = ast.literal_eval(item)
    if item and "type" in item and "deleted" not in item and "dead" not in item:
        row = {
            "by": item.get("by", ""),
            "descendants": item.get("descendants", 0),
            "id": item.get("id", ""),
            "kids": item.get("kids", []),
            "score": item.get("score", 0),
            "time": item.get("time", 0),
            "title": item.get("title", ""),
            "parent": item.get("parent", ""),
            "top_parent_id": -1,
            "text": (
                item.get("text").strip().replace("\n", " ").replace("\r", " ")
                if item.get("text")
                else ""
            ),
            "type": item.get("type", ""),
            "url": item.get("url", ""),
        }

        maybe_time = row.get("time")
        try:
            stamp = (
                None
                if maybe_time is None
                else datetime.fromtimestamp(maybe_time).strftime("%Y-%m-%d %H:%M:%S")
            )
        except:
            stamp = None

        if not row["title"] and not row["text"]:
            return None

        if row.get("type", "") == "pollopt":
            return None

        parent_title = None

        distance = None
        boost = None
        if row.get("type", "") == "comment":
            # Get Parent
            try:
                (top_parent_id, parent_title) = get_parent_title(item.get("id"))
                row["top_parent_id"] = top_parent_id
                if parent_title:
                    distance = {
                        "boost_factor": comment_distance_factor,
                        "phrase": parent_title,
                    }
            except:
                parent_title = None

        if row.get("type", "") == "story":
            boost = {"boost_factor": story_boost_factor, "phrase": row.get("title")}

        tags = [row.get("type", ""), row.get("by", "")]

        if row.get("title") and row.get("title").startswith("Show HN:"):
            tags.append("show")

        if row.get("title") and row.get("title").startswith("Ask HN:"):
            tags.append("ask")

        html = ""

        if row.get("title"):
            html += row.get("title") + " \n\n"

        if row.get("text"):
            html += row.get("text") + " \n\n"

        if row.get("url"):
            url = row.get("url")
            parsedUrl = urlparse(url)
            if parsedUrl.netloc == "github.com":
                tags.append("github.com/" + parsedUrl.path.split("/")[1])
            tags.append(parsedUrl.netloc)

        data = dict(
            chunk_html=html,
            link=row["url"],
            metadata={
                "by": row.get("by", ""),
                "descendants": max(row.get("descendants", 0), len(row.get("kids", []))),
                "top_parent_id": row.get("top_parent_id", -1),
                "parent": row.get("parent", None),
                "id": row.get("id"),
                "kids": row.get("kids", []),
                "score": row.get("score", 0),
                "time": row.get("time"),
                "title": row.get("title", ""),
                "text": row.get("text", ""),
                "parent_title": parent_title,
                "type": row.get("type", ""),
                "url": row.get("url"),
            },
            boost_phrase=boost,
            distance_phrase=distance,
            tag_set=tags,
            num_value=row.get("score", 0),
            tracking_id=str(row.get("id")),
            upsert_by_tracking_id=True,
            time_stamp=stamp,
        )

        if boost == None and "boost_phrase" in data:
            data.pop("boost_phrase")

        if boost == None and "distance_phrase" in data:
            data.pop("distance_phrase")

        return data

    return None


def get_parent_title(i):
    it = get_item(i)
    if it.get("parent", None):
        return get_parent_title(it.get("parent"))
    return (i, it.get("title", None))


def get_item(i):
    return requests.get(f"https://hacker-news.firebaseio.com/v0/item/{i}.json").json()


while True:
    redis_resp = redis_client.lpop("hn", num_to_pop)

    # Check if item ID is already present
    if redis_resp is None:
        continue

    print("processing", redis_resp)
    chunks = list(map(deserialize_to_dict, redis_resp))
    chunks = [chunk for chunk in chunks if chunk is not None]
    print(len(chunks))
    url = f"{api_url}/chunk"
    chunk_response = requests.post(
        url,
        headers={
            "Content-Type": "application/json",
            "TR-Dataset": dataset_id,
            "Authorization": api_key,
        },
        json=chunks,
    )
