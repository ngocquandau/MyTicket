import axios from 'axios';
import { EventSummary } from '../types/event';

const API_URL = 'http://localhost:3000/api/event';

export const getAllEventsAPI = async (): Promise<EventSummary[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const getEventByIdAPI = async (id: string): Promise<EventSummary> => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

export const getTicketClassesByEventAPI = async (id: string) => {
  const res = await axios.get(`${API_URL}/${id}/tickets`);
  return res.data;
};
