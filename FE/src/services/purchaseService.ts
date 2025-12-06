import axiosClient from "./axiosClient"; 

const PURCHASE_API_URL = '/api/purchases';
const PAYMENT_API_URL = '/api/payment';

export const createPurchaseAPI = async (data: any) => {
  // axiosClient sẽ tự động gắn Header Authorization
  const res = await axiosClient.post(PURCHASE_API_URL, data);
  return res.data;
};

export const createPaymentUrlAPI = async (data: any) => {
  const res = await axiosClient.post(`${PAYMENT_API_URL}/create-url`, data);
  return res.data;
};

export const getPurchaseByIdAPI = async (id: string) => {
  const res = await axiosClient.get(`${PURCHASE_API_URL}/${id}`);
  return res.data;
};

export const getMyPurchasesAPI = async () => {
  const res = await axiosClient.get(`${PURCHASE_API_URL}/my-tickets`);
  return res.data;
};