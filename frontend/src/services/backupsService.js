import { saveAs } from "file-saver";
import api from "@/lib/api";

export async function getAll() {
  const { data } = await api.get("/api/backups");
  return data;
}

export async function createBackup() {
  const { data } = await api.post("/api/backups/create");
  return data;
}

export async function sendEmail(backupId, email) {
  const { data } = await api.post("/api/backups/send-email", { backup_id: backupId, email });
  return data;
}

export async function downloadBackup(backupId, filename) {
  try {
    const { data } = await api.get(`/api/backups/${backupId}/download`, { responseType: "blob" });
    saveAs(data, filename);
  } catch (err) {
    // With responseType "blob", a JSON error body also arrives as a Blob — parse it
    // back to text so err.arabicMessage still reflects the real Arabic error message.
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        err.arabicMessage = JSON.parse(text).error || err.arabicMessage;
      } catch {
        // keep the generic message from the response interceptor
      }
    }
    throw err;
  }
}

export async function remove(backupId) {
  const { data } = await api.delete(`/api/backups/${backupId}`);
  return data;
}
