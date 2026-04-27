import axiosClient from './axiosClient';

export interface ReviewPayload {
  rating: number;
  comment: string;
}

export const createReviewAPI = async (eventId: string, payload: ReviewPayload) => {
  const res = await axiosClient.post(`/api/review/${eventId}`, payload);
  return res.data;
};

export const getMyReviewAPI = async (eventId: string) => {
  const res = await axiosClient.get(`/api/review/${eventId}/me`);
  return res.data;
};

export const getEventReviewsAPI = async (eventId: string) => {
  const res = await axiosClient.get(`/api/review/${eventId}`);
  return res.data;
};