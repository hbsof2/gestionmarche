import api from "@/lib/api";

export async function getUsers() {
  const { data } = await api.get("/api/activity-logs/users");
  return data;
}

export async function getUserLogs(userId, date) {
  const { data } = await api.get(`/api/activity-logs/${userId}`, {
    params: date ? { date } : undefined,
  });
  return data;
}

export async function getAllLogs() {
  const { data } = await api.get("/api/activity-logs");
  return data;
}
