export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("auth_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function logout() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  window.location.href = "/login";
}

export function hasPermission(permission) {
  const user = getUser();
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.permissions?.[permission] === true;
}
