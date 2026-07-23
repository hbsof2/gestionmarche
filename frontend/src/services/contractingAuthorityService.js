import api from "@/lib/api";

export async function getAll(page = 1, search = "", limit) {
  const { data } = await api.get("/api/contracting-authority", { params: { page, search, limit } });
  return data;
}

export async function getById(id) {
  const { data } = await api.get(`/api/contracting-authority/${id}`);
  return data;
}

export async function create(body) {
  const { data } = await api.post("/api/contracting-authority", body);
  return data;
}

export async function update(id, body) {
  const { data } = await api.put(`/api/contracting-authority/${id}`, body);
  return data;
}

export async function remove(id) {
  const { data } = await api.delete(`/api/contracting-authority/${id}`);
  return data;
}
