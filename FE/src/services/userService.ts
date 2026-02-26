import axiosClient from './axiosClient';

const USER_API_ROUTE = '/api/user';

export interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  birthday?: string;
  email: string;
  phoneNumber?: string;
  role: 'user' | 'organizer' | 'admin';
  profileImage?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  location?: {
    type: 'Point';
    coordinates: number[];
  };
}

export interface UpdateUserProfilePayload {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  birthday?: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface AdminUpdateUserPayload {
  firstName?: string;
  lastName?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  email?: string;
  phoneNumber?: string;
  role?: 'user' | 'organizer' | 'admin';
  profileImage?: string;
  isActive?: boolean;
}

export const getMyProfileAPI = async (): Promise<UserProfile> => {
  const res = await axiosClient.get(`${USER_API_ROUTE}/profile`);
  return res.data as UserProfile;
};

export const updateMyProfileAPI = async (
  payload: UpdateUserProfilePayload
): Promise<UserProfile> => {
  const res = await axiosClient.put(`${USER_API_ROUTE}/profile`, payload);
  return res.data as UserProfile;
};

export const getAllUsersAPI = async (): Promise<UserProfile[]> => {
  const res = await axiosClient.get(USER_API_ROUTE);
  return Array.isArray(res.data) ? (res.data as UserProfile[]) : [];
};

export const updateUserByIdAPI = async (
  userId: string,
  payload: AdminUpdateUserPayload
): Promise<UserProfile> => {
  const res = await axiosClient.put(`${USER_API_ROUTE}/${encodeURIComponent(userId)}`, payload);
  return res.data as UserProfile;
};

export const deleteUserByIdAPI = async (userId: string): Promise<{ message: string }> => {
  const res = await axiosClient.delete(`${USER_API_ROUTE}/${encodeURIComponent(userId)}`);
  return res.data as { message: string };
};
