import api from "@/lib/api";

export async function getAll(page = 1, search = "") {
  const { data } = await api.get("/api/authority-branches", { params: { page, search } });
  return data;
}

export async function getById(id) {
  const { data } = await api.get(`/api/authority-branches/${id}`);
  return data;
}

export async function create(body) {
  const { data } = await api.post("/api/authority-branches", body);
  return data;
}

export async function update(id, body) {
  const { data } = await api.put(`/api/authority-branches/${id}`, body);
  return data;
}

export async function remove(id) {
  const { data } = await api.delete(`/api/authority-branches/${id}`);
  return data;
}
