import api from "@/lib/api";

export async function getAll(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.contractor_id) params.append("contractor_id", filters.contractor_id);
  if (filters.authority_id) params.append("authority_id", filters.authority_id);
  if (filters.deal_id) params.append("deal_id", filters.deal_id);
  if (filters.branch_id) params.append("branch_id", filters.branch_id);
  const queryString = params.toString();
  const { data } = await api.get(`/api/receipts${queryString ? `?${queryString}` : ""}`);
  return data;
}

export async function getFilterOptions() {
  const { data } = await api.get("/api/receipts/filter-options");
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

export async function getReceiptItems(receiptId) {
  const { data } = await api.get(`/api/receipts/${receiptId}/items`);
  return data;
}

export async function getAvailableMaterials(receiptId) {
  const { data } = await api.get(`/api/receipts/${receiptId}/available-materials`);
  return data;
}

export async function addReceiptItem(receiptId, body) {
  const { data } = await api.post(`/api/receipts/${receiptId}/items`, body);
  return data;
}

export async function updateReceiptItem(receiptId, itemId, body) {
  const { data } = await api.put(`/api/receipts/${receiptId}/items/${itemId}`, body);
  return data;
}

export async function removeReceiptItem(receiptId, itemId) {
  const { data } = await api.delete(`/api/receipts/${receiptId}/items/${itemId}`);
  return data;
}
