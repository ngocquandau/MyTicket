
import React, { useEffect, useState } from 'react';
import OrganizerLayout from '../../../layouts/OrganizerLayout';
import axiosClient from '../../../services/axiosClient';
import { Button, Table, Input, message, Image, Tag, Modal, Descriptions } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

interface Event {
  _id: string;
  title: string;
  genre: string;
  posterURL?: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  location?: {
    address?: string;
  };
  // Thêm các trường khác nếu cần
}

// Hàm lấy organizerId từ localStorage/session hoặc context (giả định đã lưu khi đăng nhập)
function getOrganizerId(): string | null {
  // Ví dụ: lưu organizerId vào localStorage sau khi đăng nhập
  return localStorage.getItem('organizerId');
}

// Giải mã JWT từ localStorage/session và trả về payload (hoặc null nếu không hợp lệ)
function getUserFromToken(): any | null {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let payload = parts[1];
    // base64url -> base64
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4) {
      payload += '=';
    }
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

const EventInforPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Event | null>(null);
  const [tableHeight, setTableHeight] = useState<number>(560);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = getUserFromToken();
        if (!payload) {
          setError('Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.');
          setLoading(false);
          return;
        }

        if (payload.role !== 'organizer') {
          setError('Bạn không có quyền xem trang này (không phải ban tổ chức).');
          setLoading(false);
          return;
        }

        const orgRes = await axiosClient.get('/api/organizer/me');
        const organizer = orgRes.data;
        const organizerId = organizer?._id;
        if (!organizerId) {
          setError('Không tìm thấy organizer tương ứng với tài khoản.');
          setLoading(false);
          return;
        }

        const response = await axiosClient.get(`/api/organizer/${organizerId}/events`);
        setEvents(Array.isArray(response.data) ? response.data : []);
      } catch (err: any) {
        console.error('Fetch events error:', err);
        const msg = err?.response?.data?.message || err?.message || 'Failed to fetch events.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // compute table height
  useEffect(() => {
    const calc = () => {
      const offset = 240;
      const h = Math.max(300, window.innerHeight - offset);
      setTableHeight(h);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const openView = (record: Event) => { setSelected(record); setViewOpen(true); };
  const closeView = () => { setSelected(null); setViewOpen(false); };

  const columns = [
    { title: '#', key: 'index', render: (_: any, __: any, idx: number) => idx + 1, width: 48 },
    { title: 'Poster', dataIndex: 'posterURL', key: 'poster', width: 100, render: (url: string) => url ? <Image src={url} width={96} height={56} style={{ objectFit: 'cover' }} alt="poster" /> : null },
    { title: 'Title', dataIndex: 'title', key: 'title', render: (t: string) => <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{t}</div>, sorter: (a: any,b:any)=> (a.title||'').localeCompare(b.title||'') },
    { title: 'Start', dataIndex: 'startDateTime', key: 'start', render: (d: string) => d ? new Date(d).toLocaleString() : '—', width: 180 },
    { title: 'End', dataIndex: 'endDateTime', key: 'end', render: (d: string) => d ? new Date(d).toLocaleString() : '—', width: 180 },
    { title: 'Location', dataIndex: 'location', key: 'location', render: (loc: any) => loc?.address || (typeof loc === 'string' ? loc : 'N/A') },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (s: string) => <Tag color={s === 'published' ? 'green' : s === 'draft' ? 'default' : 'red'}>{s}</Tag> },
    { title: 'Action', key: 'action', width: 80, render: (_: any, record: Event) => (
      <Button type="text" icon={<EyeOutlined />} onClick={() => openView(record)} />
    ) }
  ];

  const filtered = events.filter(e => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (String(e.title || '').toLowerCase().includes(q) || String(e.genre || '').toLowerCase().includes(q) || String(e.description || '').toLowerCase().includes(q) || String(e.location?.address || '').toLowerCase().includes(q));
  });

  return (
    <OrganizerLayout>
      <div className="bg-white rounded shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Event Information</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Input.Search placeholder="Tìm sự kiện" onSearch={val => setQuery(val)} style={{ width: 300 }} allowClear />
          </div>
        </div>

        <Table
          rowKey={(r: any) => r._id}
          dataSource={filtered}
          columns={columns}
          loading={loading}
          size="middle"
          pagination={{ pageSize: 10 }}
          scroll={{ y: tableHeight }}
          sticky
        />

        <Modal title="Chi tiết sự kiện" open={viewOpen} onCancel={closeView} footer={null} width={900} centered destroyOnClose>
          {selected && (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Title">{selected.title}</Descriptions.Item>
              <Descriptions.Item label="Genre">{selected.genre || '—'}</Descriptions.Item>
              <Descriptions.Item label="Description">{selected.description || '—'}</Descriptions.Item>
              <Descriptions.Item label="Poster">{selected.posterURL ? <Image src={selected.posterURL} width={240} alt="poster" /> : '—'}</Descriptions.Item>
              <Descriptions.Item label="Start">{selected.startDateTime ? new Date(selected.startDateTime).toLocaleString() : '—'}</Descriptions.Item>
              <Descriptions.Item label="End">{selected.endDateTime ? new Date(selected.endDateTime).toLocaleString() : '—'}</Descriptions.Item>
              <Descriptions.Item label="Status">{selected.status ? <Tag color={selected.status === 'published' ? 'green' : selected.status === 'draft' ? 'default' : 'red'}>{selected.status}</Tag> : '—'}</Descriptions.Item>
              <Descriptions.Item label="Location">{selected.location?.address || (typeof selected.location === 'string' ? selected.location : '—')}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </div>
    </OrganizerLayout>
  );
};

export default EventInforPage;
