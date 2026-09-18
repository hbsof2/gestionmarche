import api from "@/lib/api";

export async function getAll() {
  const { data } = await api.get("/api/notifications");
  return data;
}

export async function getUnreadCount() {
  const { data } = await api.get("/api/notifications/unread-count");
  return data.count;
}

export async function markAsRead(id) {
  const { data } = await api.put(`/api/notifications/${id}/read`);
  return data;
}

export async function markAllAsRead() {
  const { data } = await api.put("/api/notifications/read-all");
  return data;
}

export async function remove(id) {
  const { data } = await api.delete(`/api/notifications/${id}`);
  return data;
}

export async function removeAll() {
  const { data } = await api.delete("/api/notifications/clear-all");
  return data;
}
