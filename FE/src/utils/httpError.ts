import { NavigateFunction } from 'react-router-dom';
import { removeToken } from './auth';

interface HandleAuthErrorOptions {
  includeForbidden?: boolean;
  showMessage?: boolean;
  messageText?: string;
  redirectTo?: string;
  clearToken?: boolean;
  notify?: (text: string) => void;
}

export const handleAuthError = (
  error: any,
  navigate: NavigateFunction,
  options: HandleAuthErrorOptions = {}
): boolean => {
  const {
    includeForbidden = false,
    showMessage = true,
    messageText = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    redirectTo = '/',
    clearToken = true,
    notify,
  } = options;

  const status = error?.response?.status;
  const isUnauthorized = status === 401 || (includeForbidden && status === 403);

  if (!isUnauthorized) {
    return false;
  }

  if (clearToken) {
    removeToken();
  }

  if (showMessage && notify) {
    notify(messageText);
  }

  navigate(redirectTo, { replace: true });
  return true;
};
