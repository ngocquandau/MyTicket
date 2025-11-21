import axios from 'axios';
import { TicketClass } from '../types/event';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/ticket`;

// Lấy tất cả TicketClass
export const getAllTicketClassesAPI = async (): Promise<TicketClass[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

// Lấy TicketClass theo ID
export const getTicketClassByIdAPI = async (id: string): Promise<TicketClass> => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

// Lấy tất cả TicketClass theo eventId
export const getTicketClassesByEventAPI = async (eventId: string): Promise<TicketClass[]> => {
  const res = await axios.get(`${BASE_URL}/api/event/${eventId}/tickets`);
  return res.data;
};

// Tạo TicketClass mới
export const createTicketClassAPI = async (data: Partial<TicketClass>) => {
  const res = await axios.post(API_URL, data, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  return res.data;
};

// Cập nhật TicketClass
export const updateTicketClassAPI = async (id: string, data: Partial<TicketClass>) => {
  const res = await axios.put(`${API_URL}/${id}`, data, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  return res.data;
};

// Xóa TicketClass
export const deleteTicketClassAPI = async (id: string) => {
  const res = await axios.delete(`${API_URL}/${id}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  return res.data;
};
