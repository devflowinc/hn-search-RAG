import { createClient } from "redis";

async function getItem(i: Number) {
  return await (
    await fetch(
      `https://hacker-news.firebaseio.com/v0/item/${i}.json?print=pretty`
    )
  ).json();
}

async function getRootParent(i: Number) {
  let it = await getItem(i);
  if (it.parent) {
    return getRootParent(it.parent);
  }

  return it;
}

let apiHost = process.env.TRIEVE_API_HOST;
let apiKey = process.env.TRIEVE_API_KEY;
let datasetid = process.env.DATASET_ID;
let redisUri = process.env.REDIS_URI;

async function upsertGroup(parent: Number) {
  console.log("Creating group ", parent);
  let resp = await fetch(`${apiHost}/api/chunk_group`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "TR-Dataset": datasetid,
      Authorization: apiKey,
    } as HeadersInit,
    body: JSON.stringify({
      tracking_id: `${parent}`,
      upsert_by_tracking_id: true,
      name: `${parent}`,
    }),
  });
  console.log(await resp.text());
}

async function addToGroup(parent: Number, child: Number) {
  console.log("Adding ", parent, " to group ", child);
  let resp = await fetch(`${apiHost}/api/chunk_group/tracking_id/${parent}`, {
    headers: {
      "Content-Type": "application/json",
      "TR-Dataset": datasetid,
      Authorization: apiKey,
    } as HeadersInit,
    method: "POST",
    body: JSON.stringify({
      chunk_tracking_id: `${child}`,
    }),
  });
  console.log(await resp.text());
}

const client = await createClient({
  url: redisUri,
})
  .on("error", (err: any) => console.log("Redis Client Error", err))
  .connect();

while (true) {
  let currentId: any = await client.BRPOP("comments_to_visit", 0.0);
  currentId = currentId.element;

  console.log("processing", currentId);
  let item = await getItem(currentId);

  if (item && item.type && item.type == "comment") {
    let p = await getRootParent(currentId);
    await upsertGroup(p.id);
    await addToGroup(p.id, item.id);
  }
}

await client.disconnect();
