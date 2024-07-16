import { Topic } from "../../../types";

const apiHost = import.meta.env.VITE_TRIEVE_API_URL as string;
const trieveDatasetId = import.meta.env.VITE_TRIEVE_DATASET_ID as string;
const trieveApiKey = import.meta.env.VITE_TRIEVE_API_KEY as string;

export const getTopics = async (id: string): Promise<Topic[]> => {
  const response = await fetch(`${apiHost}/topic/owner/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: trieveApiKey,
      "TR-Dataset": trieveDatasetId,
    },
  });

  if (!response.ok) return [];
  const data = (await response.json()) as unknown as Topic[];

  return data;
};

export const saveTitle = async (selectedTopic: Topic, name: string) => {
  const trimmedName = name.trim();

  const response = await fetch(`${apiHost}/topic`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
    },
    body: JSON.stringify({
      topic_id: selectedTopic.id,
      name: trimmedName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update topic response: ${response.statusText}`);
  }

  return trimmedName;
};

export const deleteTopic = async (topic_id: string) => {
  const res = await fetch(`${apiHost}/topic/${topic_id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete topic: ${res.statusText}`);
  }

  return;
};

export const createTopic = async (newMessageContent: string, id: string) => {
  const response = await fetch(`${apiHost}/topic`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
    },
    body: JSON.stringify({
      first_user_message: newMessageContent,
      owner_id: id,
    }),
  });

  if (!response.ok) {
    throw new Error("Error creating topic");
  }

  return response.json();
};

export const fetchCompletion = async (
  params: any,
  abortSignal: AbortSignal
) => {
  const response = await fetch(`${apiHost}/message`, {
    method: params.regenerateLastMessage ? "DELETE" : "POST",
    headers: {
      "Content-Type": "application/json",
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
    },
    body: JSON.stringify(params),
    signal: abortSignal,
  });

  return response.body?.getReader();
};

export const fetchMessages = async (
  topicId: string,
  abortSignal: AbortSignal
) => {
  const response = await fetch(`${apiHost}/messages/${topicId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
    },
    credentials: "include",
    signal: abortSignal,
  });

  return response.json();
};
export const editMessage = async (params: any, abortSignal: AbortSignal) => {
  const response = await fetch(`${apiHost}/message`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
    },
    credentials: "include",
    signal: abortSignal,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Failed to edit message");
  }

  return response.body?.getReader();
};
