import axiosClient from './axiosClient';
import axios from 'axios';

const BASE = '/api/event';

const getEnv = (key: string): string | undefined => {
  return (globalThis as any)?.process?.env?.[key];
};

const ADMIN_TOKEN = getEnv('REACT_APP_ADMIN_TOKEN');
const API_BASE_URL = getEnv('REACT_APP_API_BASE_URL');

function getAbsoluteUrl(path = BASE) {
  const base = axiosClient.defaults.baseURL || API_BASE_URL || 'http://localhost:3000';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

const normalizeEvents = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data.map((it: any) => it?.event ?? it);
  if (Array.isArray(data.data)) return data.data.map((it: any) => it?.event ?? it);
  if (Array.isArray(data.events)) return data.events.map((it: any) => it?.event ?? it);
  // if server returns { items: [...] } or similar
  if (Array.isArray(data.items)) return data.items.map((it: any) => it?.event ?? it);
  // fallback: single object -> wrap
  const single = data?.event ?? data;
  return [single];
};

export const getAllEventsAPI = async (): Promise<any[]> => {
  try {
    const res = await axiosClient.get(`${BASE}`);
    return normalizeEvents(res.data ?? res);
  } catch (err: any) {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && ADMIN_TOKEN) {
      const res = await axios.get(getAbsoluteUrl(BASE), {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      return normalizeEvents(res.data ?? res);
    }
    throw err;
  }
};

export const getEventByIdAPI = async (id: string) => {
  try {
    const res = await axiosClient.get(`${BASE}/${id}`);
    return res.data;
  } catch (err: any) {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && ADMIN_TOKEN) {
      const res = await axios.get(getAbsoluteUrl(`${BASE}/${id}`), {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      return res.data;
    }
    throw err;
  }
};

export const createEventAPI = async (payload: any) => {
  try {
    const res = await axiosClient.post(`${BASE}`, payload);
    return res.data;
  } catch (err: any) {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && ADMIN_TOKEN) {
      const res = await axios.post(getAbsoluteUrl(BASE), payload, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      return res.data;
    }
    throw err;
  }
};

export const updateEventAPI = async (id: string, payload: any) => {
  try {
    const res = await axiosClient.put(`${BASE}/${id}`, payload);
    return res.data;
  } catch (err: any) {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && ADMIN_TOKEN) {
      const res = await axios.put(getAbsoluteUrl(`${BASE}/${id}`), payload, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      return res.data;
    }
    throw err;
  }
};

export const deleteEventAPI = async (id: string) => {
  try {
    const res = await axiosClient.delete(`${BASE}/${id}`);
    return res.data;
  } catch (err: any) {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && ADMIN_TOKEN) {
      const res = await axios.delete(getAbsoluteUrl(`${BASE}/${id}`), {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      return res.data;
    }
    throw err;
  }
};