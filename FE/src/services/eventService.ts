import axiosClient from './axiosClient';
import { EventSummary } from '../types/event';

const API_URL = '/api/event';

export const getAllEventsAPI = async () => {
	// Call BE route mounted at /api/event which returns { events, nextCursor }
	const res = await axiosClient.get(API_URL);
	// Some endpoints may return { events } or an array directly — normalize to an array
	return res.data.events ?? res.data;
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

export const createEventAPI = async (payload: any) => {
	const res = await axiosClient.post(`${API_URL}`, payload);
	return res.data;
};

export const updateEventAPI = async (id: string, payload: any) => {
	const res = await axiosClient.put(`${API_URL}/${id}`, payload);
	return res.data;
};

export const deleteEventAPI = async (id: string) => {
	const res = await axiosClient.delete(`${API_URL}/${id}`);
	return res.data;
};