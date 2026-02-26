export const saveToken = (token: string) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  return localStorage.getItem("token");
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
    const payload = parts[1];
    // atob có sẵn trên browser
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
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
