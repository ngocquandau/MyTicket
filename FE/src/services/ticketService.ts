import axiosClient from './axiosClient'; // Dùng axiosClient đã có
import { TicketClass } from '../types/event'; // Sửa lỗi 2304: Thêm import TicketClass

const API_ROUTE = '/api/ticket';
const EVENT_API_ROUTE = '/api/event';

// Lấy tất cả TicketClass theo eventId
export const getTicketClassesByEventAPI = async (eventId: string): Promise<TicketClass[]> => { // Sửa lỗi 2304
  // Sử dụng route đã định nghĩa trong BE: /api/event/:eventId/tickets
  const res = await axiosClient.get(`${EVENT_API_ROUTE}/${eventId}/tickets`); 
  return res.data;
};

// Các hàm CRUD (Cần token, dùng axiosClient là đúng)
export const getAllTicketClassesAPI = async (): Promise<TicketClass[]> => {
  const res = await axiosClient.get(API_ROUTE);
  return res.data;
};

export const getTicketClassByIdAPI = async (id: string): Promise<TicketClass> => {
  const res = await axiosClient.get(`${API_ROUTE}/${id}`);
  return res.data;
};

// Gán kiểu cho data (thay vì Partial<TicketClass> có thể dùng any hoặc interface cho create DTO)
export const createTicketClassAPI = async (data: any) => { 
  const res = await axiosClient.post(API_ROUTE, data);
  return res.data;
};

export const updateTicketClassAPI = async (id: string, data: any) => {
  const res = await axiosClient.put(`${API_ROUTE}/${id}`, data);
  return res.data;
};

export const deleteTicketClassAPI = async (id: string) => {
  const res = await axiosClient.delete(`${API_ROUTE}/${id}`);
  return res.data;
};