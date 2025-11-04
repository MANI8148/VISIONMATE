// src/services/alertService.ts
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export async function saveAlert(message: string, userId?: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/alerts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, userId }),
  });
  if (!res.ok) throw new Error("Failed to save alert");
  return res.json();
}

export async function getRecentAlerts() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/alerts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}