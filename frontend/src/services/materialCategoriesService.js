import api from "@/lib/api";

export async function getAll(search = "") {
  const { data } = await api.get("/api/material-categories", { params: { search } });
  return data;
}

export async function getById(id) {
  const { data } = await api.get(`/api/material-categories/${id}`);
  return data;
}

export async function create(body) {
  const { data } = await api.post("/api/material-categories", body);
  return data;
}

export async function update(id, body) {
  const { data } = await api.put(`/api/material-categories/${id}`, body);
  return data;
}

export async function remove(id) {
  const { data } = await api.delete(`/api/material-categories/${id}`);
  return data;
}
