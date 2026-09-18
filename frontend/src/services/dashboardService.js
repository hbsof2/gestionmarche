import api from "@/lib/api";

export async function getStats() {
  const { data } = await api.get("/api/dashboard/stats");
  return data;
}

export async function getMonthlyActivity() {
  const { data } = await api.get("/api/dashboard/monthly-activity");
  return data;
}

export async function getRecentActivity() {
  const { data } = await api.get("/api/dashboard/recent-activity");
  return data;
}

export async function getAlerts() {
  const { data } = await api.get("/api/dashboard/alerts");
  return data;
}

export async function getMaterialsDistribution() {
  const { data } = await api.get("/api/dashboard/materials-distribution");
  return data;
}
