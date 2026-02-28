import React, { useEffect, useState } from 'react';
import OrganizerLayout from '../../../layouts/OrganizerLayout';
import axiosClient from '../../../services/axiosClient';
import { Descriptions, Spin, message, Button } from 'antd';

const SettingPage: React.FC = () => {
  const [organizer, setOrganizer] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/organizer/me');
      setOrganizer(res.data || null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không tải được thông tin organizer.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <OrganizerLayout>
      <div className="bg-white rounded shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Profile</h2>
          <Button onClick={fetchProfile} size="small">Refresh</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spin /></div>
        ) : (
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Name">{organizer?.name || '—'}</Descriptions.Item>
            <Descriptions.Item label="Email">{organizer?.email || '—'}</Descriptions.Item>
            <Descriptions.Item label="Phone">{organizer?.phoneNumber || '—'}</Descriptions.Item>
            <Descriptions.Item label="Address">{organizer?.address || '—'}</Descriptions.Item>
            <Descriptions.Item label="Tax Code">{organizer?.taxCode || '—'}</Descriptions.Item>
            <Descriptions.Item label="Rating">{organizer?.rating != null ? String(organizer.rating) : '—'}</Descriptions.Item>
            <Descriptions.Item label="Created At">{organizer?.createdAt ? new Date(organizer.createdAt).toLocaleString() : '—'}</Descriptions.Item>
            <Descriptions.Item label="Updated At">{organizer?.updatedAt ? new Date(organizer.updatedAt).toLocaleString() : '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </div>
    </OrganizerLayout>
  );
};

export default SettingPage;
