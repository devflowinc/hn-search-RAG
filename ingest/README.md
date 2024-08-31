# Hackernews Ingest

This consists of 3 scripts each that are pretty self contained.

1. set-ids 

1) Get the max current max post id [https://hacker-news.firebaseio.com/v0/maxitem.json](https://hacker-news.firebaseio.com/v0/maxitem.json).
2) Read from redis of the last value written (redis key is called `last_final`)
3) From `last_final` to `max` push these values into a list called `tovisit`

2. get-dataset

1) Pop an item off the `tovisit` redis list
2) Request for post that post id f"https://hacker-news.firebaseio.com/v0/item/{start}.json"
3) If that value exists, and is not deleted. Push the json response from `2` into redis list `hn` 

3. bulk-ingest

1) Pop 120 json items from redis
2) Format each into a trieve chunk
3) Make a POST request to trieve `/api/chunk` to create the data
4) Push the json items into redis list `sent` (just so we can skip scripts 1 and 2)

### Running it

We run all the following scripts in kubernetes as deployments.

```sh
kubectl apply -f set-ids/set-ids.yaml
kubectl apply -f get_dataset/get-datasets.yaml
kubectl apply -f bulk_ingest/bulk_send.yaml
```

All scripts can be horizontally scaled exceptfor `set-ids.yaml`, but it runs much faster than the other 2 so no need to worry

Scaling is pretty easy with 
```sh
kubectl scale --replicas 3 deploy/bulksend
kubectl scale --replicas 50 deploy/get-datasets
```
