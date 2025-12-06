import axiosClient from './axiosClient';
import { EventSummary } from '../types/event';

const API_URL = '/api/event';

export const getAllEventsAPI = async (): Promise<EventSummary[]> => {
  const res = await axiosClient.get(API_URL);
  return res.data;
};

export const getEventByIdAPI = async (id: string): Promise<EventSummary> => {
  const res = await axiosClient.get(`${API_URL}/${id}`);
  return res.data;
};

// Vẫn sử dụng endpoint BE: /api/event/{id}/tickets
export const getTicketClassesByEventAPI = async (id: string) => {
  const res = await axiosClient.get(`${API_URL}/${id}/tickets`);
  return res.data;
};