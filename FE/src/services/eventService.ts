import axiosClient from './axiosClient';
import axios from 'axios';

const BASE = '/api/event';
const MODEL_BASE = '/api/model';

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

type GetAllEventsParams = {
  search?: string;
  page?: number;
  limit?: number;
  direction?: 'asc' | 'desc';
  sortField?: string;
  status?: string;
  genre?: string;
  organizer?: string;
};

const normalizeRecommendedRanks = (data: any): Array<{ _id: string; title?: string; score?: number }> => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.items)) return data.items;
  return [];
};

export const mergeRecommendedEvents = (
  events: any[],
  recommendations: Array<{ _id: string; score?: number }>
): any[] => {
  if (!Array.isArray(events) || !Array.isArray(recommendations)) {
    return [];
  }

  const eventMap = new Map(events.map((event) => [String(event._id), event]));

  return recommendations
    .map((item) => {
      const event = eventMap.get(String(item._id));
      return event ? { ...event, recommendationScore: item.score ?? 0 } : null;
    })
    .filter(Boolean) as any[];
};

export const getAllEventsAPI = async (params?: GetAllEventsParams): Promise<any[]> => {
  try {
    const res = await axiosClient.get(`${BASE}`, { params });
    return normalizeEvents(res.data ?? res);
  } catch (err: any) {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && ADMIN_TOKEN) {
      const res = await axios.get(getAbsoluteUrl(BASE), {
        params,
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

export const getRecommendedEventRanksAPI = async (): Promise<Array<{ _id: string; title?: string; score?: number }>> => {
  const res = await axiosClient.get(`${MODEL_BASE}/recommended-list`);
  return normalizeRecommendedRanks(res.data ?? res);
};

export const getRecommendedEventsAPI = async (): Promise<any[]> => {
  const [events, recommendations] = await Promise.all([
    getAllEventsAPI(),
    getRecommendedEventRanksAPI(),
  ]);

  return mergeRecommendedEvents(events, recommendations);
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