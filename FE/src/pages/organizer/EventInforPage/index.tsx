
import React, { useEffect, useState } from 'react';
import OrganizerLayout from '../../../layouts/OrganizerLayout';
import axiosClient from '../../../services/axiosClient';
import { getAllEventsAPI } from '../../../services/eventService';
import { Button, Table, Input, message, Image, Tag, Modal, Descriptions, Space, Typography } from 'antd';
import { EyeOutlined, TeamOutlined, DownloadOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

interface AttendeeRow {
  key: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  ticketId: string;
  ticketClassName: string;
  seat: string;
  seatType: string;
  ticketPrice: number;
  paymentMethod: string;
  purchasedAt: string;
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
  const [organizerEvents, setOrganizerEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Event | null>(null);
  const [tableHeight, setTableHeight] = useState<number>(560);
  const [attendeeOpen, setAttendeeOpen] = useState(false);
  const [attendeeLoading, setAttendeeLoading] = useState(false);
  const [attendeeRows, setAttendeeRows] = useState<AttendeeRow[]>([]);
  const [attendeeEvent, setAttendeeEvent] = useState<Event | null>(null);

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
        const eventList = Array.isArray(response.data) ? response.data : [];
        setOrganizerEvents(eventList);
        setEvents(eventList);
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

  const toUpperNoAccent = (value: string) => {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');

    return normalized
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'SU_KIEN';
  };

  const handleSearchEvents = async (value: string) => {
    const keyword = value.trim();
    setQuery(keyword);

    if (!keyword) {
      setEvents(organizerEvents);
      return;
    }

    setLoading(true);
    try {
      const searched = await getAllEventsAPI({
        search: keyword,
        limit: 100,
        direction: 'desc',
        sortField: 'startDateTime'
      });

      const matchedIds = new Set(
        (Array.isArray(searched) ? searched : []).map((ev: any) => String(ev?._id || ''))
      );

      const scopedResults = organizerEvents.filter((ev) => matchedIds.has(String(ev._id)));
      setEvents(scopedResults);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể tìm kiếm sự kiện.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const exportAttendeesCsv = () => {
    if (!attendeeRows.length) {
      message.warning('Không có dữ liệu để xuất.');
      return;
    }

    const headers = [
      'Customer Name', 'Email', 'Phone', 'Ticket ID', 'Ticket Class',
      'Seat', 'Seat Type', 'Ticket Price', 'Payment Method', 'Purchased At'
    ];

    const escapeCsv = (value: string | number) => {
      const text = String(value ?? '');
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const rows = attendeeRows.map((row) => [
      row.customerName,
      row.customerEmail,
      row.customerPhone,
      row.ticketId,
      row.ticketClassName,
      row.seat,
      row.seatType,
      row.ticketPrice,
      row.paymentMethod,
      row.purchasedAt
    ]);

    const csvContent = [headers, ...rows]
      .map((line) => line.map((v) => escapeCsv(v)).join(','))
      .join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = toUpperNoAccent(attendeeEvent?.title || 'SU_KIEN');
    const exportFileName = `DANH_SACH_KHACH_HANG_${safeTitle}.csv`;
    link.href = url;
    link.download = exportFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAttendeesPdf = () => {
    if (!attendeeRows.length) {
      message.warning('Không có dữ liệu để xuất.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const safeTitle = toUpperNoAccent(attendeeEvent?.title || 'SU_KIEN');
    const title = `DANH SACH KHACH HANG - ${safeTitle}`;
    doc.setFontSize(12);
    doc.text(title, 40, 30);

    autoTable(doc, {
      startY: 45,
      head: [[
        'Customer', 'Email', 'Phone', 'Ticket ID', 'Class',
        'Seat', 'Seat Type', 'Price', 'Payment', 'Purchased At'
      ]],
      body: attendeeRows.map((row) => [
        row.customerName,
        row.customerEmail,
        row.customerPhone,
        row.ticketId,
        row.ticketClassName,
        row.seat,
        row.seatType,
        row.ticketPrice.toLocaleString('vi-VN'),
        row.paymentMethod,
        row.purchasedAt
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [24, 144, 255] }
    });

    doc.save(`DANH_SACH_KHACH_HANG_${safeTitle}.pdf`);
  };

  const closeAttendeeModal = () => {
    setAttendeeOpen(false);
    setAttendeeRows([]);
    setAttendeeEvent(null);
  };

  const openAttendeeModal = async (event: Event) => {
    setAttendeeEvent(event);
    setAttendeeOpen(true);
    setAttendeeLoading(true);
    setAttendeeRows([]);

    try {
      const orgRes = await axiosClient.get('/api/organizer/me');
      const organizerId = orgRes?.data?._id;
      if (!organizerId) {
        message.error('Không tìm thấy thông tin organizer.');
        return;
      }

      const attendeeRes = await axiosClient.get(`/api/organizer/${organizerId}/events/${event._id}/attendees`);
      const rows: AttendeeRow[] = (Array.isArray(attendeeRes?.data?.attendees) ? attendeeRes.data.attendees : [])
        .map((data: any) => ({
          key: data?.key || data?.ticketId || `${data?.purchaseId || ''}-${Math.random()}`,
          customerName: data?.customerName || '—',
          customerEmail: data?.customerEmail || '—',
          customerPhone: data?.customerPhone || '—',
          ticketId: data?.ticketId || '—',
          ticketClassName: data?.ticketClassName || '—',
          seat: data?.seat || '—',
          seatType: data?.seatType || '—',
          ticketPrice: Number(data?.ticketPrice || 0),
          paymentMethod: data?.paymentMethod || '—',
          purchasedAt: data?.purchasedAt ? new Date(data.purchasedAt).toLocaleString('vi-VN') : '—'
        }))
        .sort((a: AttendeeRow, b: AttendeeRow) => a.customerName.localeCompare(b.customerName));

      setAttendeeRows(rows);

      if (!rows.length) {
        message.info('Sự kiện này chưa có khách hàng thanh toán thành công.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không tải được danh sách khách hàng.';
      message.error(msg);
    } finally {
      setAttendeeLoading(false);
    }
  };

  const columns = [
    { title: '#', key: 'index', render: (_: any, __: any, idx: number) => idx + 1, width: 48 },
    { title: 'Poster', dataIndex: 'posterURL', key: 'poster', width: 100, render: (url: string) => url ? <Image src={url} width={96} height={56} style={{ objectFit: 'cover' }} alt="poster" /> : null },
    { title: 'Title', dataIndex: 'title', key: 'title', render: (t: string) => <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{t}</div>, sorter: (a: any,b:any)=> (a.title||'').localeCompare(b.title||'') },
    { title: 'Start', dataIndex: 'startDateTime', key: 'start', render: (d: string) => d ? new Date(d).toLocaleString() : '—', width: 180 },
    { title: 'End', dataIndex: 'endDateTime', key: 'end', render: (d: string) => d ? new Date(d).toLocaleString() : '—', width: 180 },
    { title: 'Location', dataIndex: 'location', key: 'location', render: (loc: any) => loc?.address || (typeof loc === 'string' ? loc : 'N/A') },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (s: string) => <Tag color={s === 'published' ? 'green' : s === 'draft' ? 'default' : 'red'}>{s}</Tag> },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_: any, record: Event) => (
        <Space size={2}>
          <Button type="text" icon={<EyeOutlined />} style={{ minWidth: 0, paddingInline: 4 }} onClick={() => openView(record)} />
          <Button type="text" icon={<TeamOutlined />} style={{ minWidth: 0, paddingInline: 4 }} onClick={() => openAttendeeModal(record)} />
        </Space>
      )
    }
  ];

  const attendeeColumns = [
    { title: '#', key: 'index', width: 60, render: (_: any, __: any, idx: number) => idx + 1 },
    { title: 'Khách hàng', dataIndex: 'customerName', key: 'customerName', width: 180 },
    { title: 'Email', dataIndex: 'customerEmail', key: 'customerEmail', width: 220 },
    { title: 'SĐT', dataIndex: 'customerPhone', key: 'customerPhone', width: 140 },
    { title: 'Mã vé', dataIndex: 'ticketId', key: 'ticketId', width: 190 },
    { title: 'Hạng vé', dataIndex: 'ticketClassName', key: 'ticketClassName', width: 150 },
    { title: 'Ghế', dataIndex: 'seat', key: 'seat', width: 120 },
    { title: 'Loại', dataIndex: 'seatType', key: 'seatType', width: 100 },
    { title: 'Giá vé', dataIndex: 'ticketPrice', key: 'ticketPrice', width: 120, render: (v: number) => v.toLocaleString('vi-VN') },
    { title: 'Thanh toán', dataIndex: 'paymentMethod', key: 'paymentMethod', width: 120 },
    { title: 'Thời điểm mua', dataIndex: 'purchasedAt', key: 'purchasedAt', width: 180 }
  ];

  return (
    <OrganizerLayout>
      <div className="bg-white rounded shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Event Information</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Input.Search
              placeholder="Tìm sự kiện"
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                if (!val.trim()) {
                  setEvents(organizerEvents);
                }
              }}
              onSearch={handleSearchEvents}
              style={{ width: 300 }}
              allowClear
            />
          </div>
        </div>

        <Table
          rowKey={(r: any) => r._id}
          dataSource={events}
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

        <Modal
          title={`Danh sách khách hàng - ${attendeeEvent?.title || ''}`}
          open={attendeeOpen}
          onCancel={closeAttendeeModal}
          footer={null}
          width={1280}
          centered
          destroyOnClose
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Typography.Text>
              Tổng số bản ghi: <b>{attendeeRows.length}</b>
            </Typography.Text>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={exportAttendeesCsv} disabled={!attendeeRows.length || attendeeLoading}>
                Export CSV (Sheet)
              </Button>
              <Button icon={<DownloadOutlined />} onClick={exportAttendeesPdf} disabled={!attendeeRows.length || attendeeLoading}>
                Export PDF
              </Button>
            </Space>
          </div>

          <Table
            rowKey="key"
            dataSource={attendeeRows}
            columns={attendeeColumns}
            loading={attendeeLoading}
            size="small"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1400, y: 460 }}
          />
        </Modal>
      </div>
    </OrganizerLayout>
  );
};

export default EventInforPage;
