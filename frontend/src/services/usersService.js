import api from "@/lib/api";

export async function getAll() {
  const { data } = await api.get("/api/users");
  return data;
}

export async function getById(id) {
  const { data } = await api.get(`/api/users/${id}`);
  return data;
}

export async function create(body) {
  const { data } = await api.post("/api/users", body);
  return data;
}

export async function update(id, body) {
  const { data } = await api.put(`/api/users/${id}`, body);
  return data;
}

export async function resetPassword(id, newPassword) {
  const { data } = await api.put(`/api/users/${id}/reset-password`, { new_password: newPassword });
  return data;
}

export async function remove(id) {
  const { data } = await api.delete(`/api/users/${id}`);
  return data;
}

export async function getUsersStats() {
  const { data } = await api.get("/api/users/stats");
  return data;
}

export async function getSingleUserStats(userId) {
  const { data } = await api.get(`/api/users/${userId}/stats`);
  return data;
}
