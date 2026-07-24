import api from "@/lib/api";

export async function getAll(page = 1, search = "") {
  const { data } = await api.get("/api/receipts", { params: { page, search } });
  return data;
}

export async function getById(id) {
  const { data } = await api.get(`/api/receipts/${id}`);
  return data;
}

export async function getDealsByContractorAndAuthority(contractorId, authorityId) {
  const { data } = await api.get("/api/receipts/deals", {
    params: { contractor_id: contractorId, authority_id: authorityId },
  });
  return data;
}

export async function getDealBranchesForReceipt(dealId) {
  const { data } = await api.get(`/api/receipts/deal-branches/${dealId}`);
  return data;
}

export async function getNextCounter(dealId) {
  const { data } = await api.get(`/api/receipts/next-counter/${dealId}`);
  return data;
}

export async function create(body) {
  const { data } = await api.post("/api/receipts", body);
  return data;
}

export async function update(id, body) {
  const { data } = await api.put(`/api/receipts/${id}`, body);
  return data;
}

export async function remove(id) {
  const { data } = await api.delete(`/api/receipts/${id}`);
  return data;
}
