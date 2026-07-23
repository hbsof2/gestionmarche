import api from "@/lib/api";

export async function getAll(page = 1, search = "", limit) {
  const { data } = await api.get("/api/raw-materials", { params: { page, search, limit } });
  return data;
}

export async function getById(id) {
  const { data } = await api.get(`/api/raw-materials/${id}`);
  return data;
}

export async function create(body) {
  const { data } = await api.post("/api/raw-materials", body);
  return data;
}

export async function update(id, body) {
  const { data } = await api.put(`/api/raw-materials/${id}`, body);
  return data;
}

export async function remove(id) {
  const { data } = await api.delete(`/api/raw-materials/${id}`);
  return data;
}

export async function uploadImage(file) {
  const form = new FormData();
  form.append("image", file);
  const { data } = await api.post("/api/raw-materials/upload-image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
