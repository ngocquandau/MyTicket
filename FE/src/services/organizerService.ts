import axiosClient from './axiosClient';
import axios from 'axios';

const BASE = '/api/organizer';

function getAbsoluteUrl(path = BASE) {
  const base = axiosClient.defaults.baseURL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export const getAllOrganizersAPI = async () => {
  try {
    const res = await axiosClient.get(`${BASE}`);
    return res.data;
  } catch (err: any) {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && process.env.REACT_APP_ADMIN_TOKEN) {
      const res = await axios.get(getAbsoluteUrl(BASE), {
        headers: { Authorization: `Bearer ${process.env.REACT_APP_ADMIN_TOKEN}` }
      });
      return res.data;
    }
    throw err;
  }
};

export const deleteOrganizerAPI = async (id: string) => {
  try {
    const res = await axiosClient.delete(`${BASE}/${id}`);
    return res.data;
  } catch (err: any) {
    const status = err?.response?.status;
    if ((status === 401 || status === 403) && process.env.REACT_APP_ADMIN_TOKEN) {
      const res = await axios.delete(getAbsoluteUrl(`${BASE}/${id}`), {
        headers: { Authorization: `Bearer ${process.env.REACT_APP_ADMIN_TOKEN}` }
      });
      return res.data;
    }
    throw err;
  }
};

export const createOrganizerAPI = async (payload: any) => {
  const res = await axiosClient.post(`${BASE}`, payload);
  return res.data;
};

export const updateOrganizerAPI = async (id: string, payload: any) => {
  const res = await axiosClient.put(`${BASE}/${id}`, payload);
  return res.data;
};

export const getOrganizerByIdAPI = async (id: string) => {
  const res = await axiosClient.get(`${BASE}/${id}`);
  return res.data;
};
