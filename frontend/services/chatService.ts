// src/services/chatService.ts
// src/services/chatService.ts
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export async function saveChatMessage(payload: { userId?: string; role: string; message: string }) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/chats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save chat");
  return res.json();
}

export async function getChats(limit = 50) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/chats?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch chats");
  return res.json();
}