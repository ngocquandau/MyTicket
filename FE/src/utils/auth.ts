export const saveToken = (token: string) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

export const isTokenExpired = (token?: string) => {
  try {
    const t = token || getToken();
    if (!t) return true;
    const parts = t.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload?.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

export const removeToken = () => {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
};

// Lấy payload từ JWT (nếu có)
export const getUserFromToken = (token?: string) => {
  try {
    const t = token || getToken();
    if (!t) return null;
    if (isTokenExpired(t)) {
      removeToken();
      return null;
    }
    const parts = t.split('.');
    if (parts.length !== 3) return null;
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4) {
      payload += '=';
    }
    const json = atob(payload);
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
};

// Lấy role từ token
export const getUserRole = () => {
  const user = getUserFromToken();
  return user ? user.role : null;
};
