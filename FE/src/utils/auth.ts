export const saveToken = (token: string) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const removeToken = () => {
  localStorage.removeItem("token");
};

// Lấy payload từ JWT (nếu có)
export const getUserFromToken = (token?: string) => {
  try {
    const t = token || getToken();
    if (!t) return null;
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
