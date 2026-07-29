import api from "@/lib/api";

export async function getAll(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.contractor_id) params.append("contractor_id", filters.contractor_id);
  if (filters.authority_id) params.append("authority_id", filters.authority_id);
  if (filters.deal_id) params.append("deal_id", filters.deal_id);
  const queryString = params.toString();
  const { data } = await api.get(`/api/invoices${queryString ? `?${queryString}` : ""}`);
  return data;
}

export async function getById(id) {
  const { data } = await api.get(`/api/invoices/${id}`);
  return data;
}

export async function getFilterOptions() {
  const { data } = await api.get("/api/invoices/filter-options");
  return data;
}

export async function getDealsByContractorAndAuthority(contractorId, authorityId) {
  const { data } = await api.get("/api/invoices/deals", {
    params: { contractor_id: contractorId, authority_id: authorityId },
  });
  return data;
}

export async function getCumulativeItems(dealId, startDate, endDate) {
  const { data } = await api.get("/api/invoices/cumulative-items", {
    params: { deal_id: dealId, start_date: startDate, end_date: endDate },
  });
  return data;
}

export async function create(body) {
  const { data } = await api.post("/api/invoices", body);
  return data;
}

export async function remove(id) {
  const { data } = await api.delete(`/api/invoices/${id}`);
  return data;
}
