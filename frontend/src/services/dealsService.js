import api from "@/lib/api";

export async function getAll(page = 1, search = "") {
  const { data } = await api.get("/api/deals", { params: { page, search } });
  return data;
}

export async function getById(id) {
  const { data } = await api.get(`/api/deals/${id}`);
  return data;
}

export async function create(body) {
  const { data } = await api.post("/api/deals", body);
  return data;
}

export async function update(id, body) {
  const { data } = await api.put(`/api/deals/${id}`, body);
  return data;
}

export async function remove(id) {
  const { data } = await api.delete(`/api/deals/${id}`);
  return data;
}

export async function getDealBranches(dealId) {
  const { data } = await api.get(`/api/deals/${dealId}/branches`);
  return data;
}

export async function addBranchToDeal(dealId, branchId) {
  const { data } = await api.post(`/api/deals/${dealId}/branches`, { branch_id: branchId });
  return data;
}

export async function removeBranchFromDeal(dealId, branchId) {
  const { data } = await api.delete(`/api/deals/${dealId}/branches/${branchId}`);
  return data;
}
