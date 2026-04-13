import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { Select, Button, Input, Table, Modal, Form, DatePicker, InputNumber, message, Tag, Descriptions } from 'antd';
import { PlusOutlined, SaveOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import moment from 'moment';
import { getAllEventsAPI } from '../../../services/eventService';
import { createTicketClassAPI, getTicketClassesByEventAPI, updateTicketClassAPI, deleteTicketClassAPI } from '../../../services/ticketService';

const { Option } = Select;
const TICKET_HISTORY_STORAGE_KEY = 'admin_ticket_class_history';

type SeatDraft = {
  ticketId: string;
  seat: string;
  isSold?: boolean;
};

type TicketHistoryEntry = {
  editedAt: string;
  action: 'updated' | 'created';
  snapshot: any;
};

const primaryActionButtonProps = {
  style: {
    backgroundColor: '#23A6F0',
    borderColor: '#23A6F0',
    color: '#ffffff',
    fontWeight: 600,
  },
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget as HTMLElement;
    target.style.backgroundColor = '#1890ff';
    target.style.borderColor = '#1890ff';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget as HTMLElement;
    target.style.backgroundColor = '#23A6F0';
    target.style.borderColor = '#23A6F0';
  },
};

const TicketInforPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [seatType, setSeatType] = useState<'general' | 'reserved'>('reserved');
  const [rows, setRows] = useState<any[]>([]); // ticket classes being created/edited
  const [ticketListModalOpen, setTicketListModalOpen] = useState(false);
  const [currentTicketsForRow, setCurrentTicketsForRow] = useState<any[]>([]);
  const [ticketInput, setTicketInput] = useState<string>('');
  const [currentRowIndex, setCurrentRowIndex] = useState<number | null>(null);
  const [existingTicketClasses, setExistingTicketClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingClass, setViewingClass] = useState<any | null>(null);
  const [ticketHistory, setTicketHistory] = useState<TicketHistoryEntry[]>([]);
  const [editTicketListModalOpen, setEditTicketListModalOpen] = useState(false);
  const [editTicketsDraft, setEditTicketsDraft] = useState<SeatDraft[]>([]);
  const [editTicketInput, setEditTicketInput] = useState('');
  const [editForm] = Form.useForm();
  const editSeatType = Form.useWatch('seatType', editForm) || editingClass?.seatType || 'general';

  const readTicketHistoryMap = () => {
    try {
      const raw = localStorage.getItem(TICKET_HISTORY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const writeTicketHistory = (ticketClassId: string, entry: TicketHistoryEntry) => {
    if (!ticketClassId) return;
    const currentMap = readTicketHistoryMap();
    const currentEntries = Array.isArray(currentMap[ticketClassId]) ? currentMap[ticketClassId] : [];
    currentMap[ticketClassId] = [entry, ...currentEntries].slice(0, 20);
    localStorage.setItem(TICKET_HISTORY_STORAGE_KEY, JSON.stringify(currentMap));
  };

  const loadTicketHistory = (ticketClassId?: string) => {
    if (!ticketClassId) {
      setTicketHistory([]);
      return;
    }
    const currentMap = readTicketHistoryMap();
    setTicketHistory(Array.isArray(currentMap[ticketClassId]) ? currentMap[ticketClassId] : []);
  };

  const normalizeSeatDraft = (ticketList?: any[]): SeatDraft[] => (
    Array.isArray(ticketList)
      ? ticketList.map((ticket: any) => ({
          ticketId: String(ticket?.ticketId || ticket?.seat || '').trim(),
          seat: String(ticket?.seat || ticket?.ticketId || '').trim(),
          isSold: Boolean(ticket?.isSold),
        }))
      : []
  ).filter((ticket) => ticket.ticketId && ticket.seat);

  const formatCurrency = (value?: number) => Number(value || 0).toLocaleString('vi-VN');
  const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : '—';
  const getTicketStatusTag = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'available') return <Tag color="green">available</Tag>;
    if (normalized === 'sold_out') return <Tag color="red">sold_out</Tag>;
    if (normalized === 'unavailable') return <Tag color="default">unavailable</Tag>;
    return <Tag>{normalized || '—'}</Tag>;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllEventsAPI();
        setEvents(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error('Load events failed', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedEvent) {
      setExistingTicketClasses([]);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const res = await getTicketClassesByEventAPI(selectedEvent);
        setExistingTicketClasses(Array.isArray(res) ? res : []);
      } catch (err: any) {
        console.error('Load ticket classes failed', err);
        message.error(err?.response?.data?.message || 'Không thể tải thông tin vé');
      } finally { setLoading(false); }
    })();
  }, [selectedEvent]);

  const addRow = () => {
    setRows(prev => [...prev, { name: '', price: undefined, totalQuantity: undefined, seatType, ticketList: [] }]);
  };

  const updateRow = (index: number, patch: any) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, ...patch } : r));
  };

  const removeRow = (index: number) => setRows(prev => prev.filter((_, i) => i !== index));

  const openTicketList = (index: number) => {
    setCurrentRowIndex(index);
    setCurrentTicketsForRow(normalizeSeatDraft(rows[index]?.ticketList));
    setTicketListModalOpen(true);
  };

  const saveTicketList = () => {
    if (currentRowIndex === null) return;
    updateRow(currentRowIndex, { ticketList: currentTicketsForRow, totalQuantity: currentTicketsForRow.length });
    setTicketListModalOpen(false);
    setCurrentRowIndex(null);
    setTicketInput('');
  };

  const openDetailModal = (ticketClass: any) => {
    setViewingClass(ticketClass);
    loadTicketHistory(ticketClass?._id);
    setDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setViewingClass(null);
    setTicketHistory([]);
  };

  const openEditSeatList = () => {
    setEditTicketsDraft(normalizeSeatDraft(editingClass?.ticketList));
    setEditTicketInput('');
    setEditTicketListModalOpen(true);
  };

  const saveEditSeatList = () => {
    setEditTicketListModalOpen(false);
    editForm.setFieldValue('totalQuantity', editTicketsDraft.length);
  };

  const validateRow = (row: any) => {
    if (!row.name || String(row.name).trim() === '') return 'Tên vé không được để trống';
    if (Number(row.price) < 0 || isNaN(Number(row.price))) return 'Giá vé không hợp lệ';
    if (row.seatType === 'general') {
      if (!Number.isInteger(Number(row.totalQuantity)) || Number(row.totalQuantity) <= 0) return 'Số lượng phải là số nguyên dương';
    } else {
      if (!Array.isArray(row.ticketList) || row.ticketList.length === 0) return 'Danh sách ghế trống cho loại reserved';
    }
    if (row.availableFrom && row.availableUntil && new Date(row.availableFrom) >= new Date(row.availableUntil)) return 'Thời gian mở bán phải trước thời gian kết thúc';
    return null;
  };

  const saveSingleRow = async (index: number) => {
    const row = rows[index];
    const err = validateRow(row);
    if (err) { message.error(err); return; }
    try {
      setLoading(true);
      const payload = {
        name: row.name,
        price: Number(row.price) || 0,
        totalQuantity: row.seatType === 'reserved' ? (row.ticketList?.length || 0) : Number(row.totalQuantity) || 0,
        availableFrom: row.availableFrom ? row.availableFrom.toISOString() : new Date().toISOString(),
        availableUntil: row.availableUntil ? row.availableUntil.toISOString() : moment().add(1, 'month').toISOString(),
        status: row.status || 'available',
        seatType: row.seatType || seatType,
        event: selectedEvent,
        ticketList: row.seatType === 'reserved' ? row.ticketList : undefined
      };
      await createTicketClassAPI(payload);
      message.success('Lưu thành công');
      // remove saved row
      setRows(prev => prev.filter((_, i) => i !== index));
      // reload existing
      const res = await getTicketClassesByEventAPI(selectedEvent!);
      setExistingTicketClasses(Array.isArray(res) ? res : []);
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || 'Lưu thất bại');
    } finally { setLoading(false); }
  };

  const createAll = async () => {
    if (!selectedEvent) { message.error('Vui lòng chọn Event'); return; }
    try {
      setLoading(true);
      for (const row of rows) {
        const payload = {
          name: row.name,
          price: Number(row.price) || 0,
          totalQuantity: row.seatType === 'reserved' ? (row.ticketList?.length || 0) : Number(row.totalQuantity) || 0,
          availableFrom: row.availableFrom ? row.availableFrom.toISOString() : new Date().toISOString(),
          availableUntil: row.availableUntil ? row.availableUntil.toISOString() : moment().add(1, 'month').toISOString(),
          status: row.status || 'available',
          seatType: row.seatType || seatType,
          event: selectedEvent,
          ticketList: row.seatType === 'reserved' ? row.ticketList : undefined
        };
        await createTicketClassAPI(payload);
      }
      message.success('Tạo vé thành công');
      setRows([]);
      // reload existing
      const res = await getTicketClassesByEventAPI(selectedEvent);
      setExistingTicketClasses(Array.isArray(res) ? res : []);
    } catch (err: any) {
      console.error('Create ticket classes error', err);
      message.error(err?.response?.data?.message || 'Tạo vé thất bại');
    } finally { setLoading(false); }
  };

  const deleteClass = async (id: string) => {
    try {
      setLoading(true);
      await deleteTicketClassAPI(id);
      message.success('Xóa thành công');
      const res = await getTicketClassesByEventAPI(selectedEvent!);
      setExistingTicketClasses(Array.isArray(res) ? res : []);
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || 'Xóa thất bại');
    } finally { setLoading(false); }
  };

  const selectedEventSoldTotal = existingTicketClasses.reduce((sum: number, row: any) => sum + Number(row?.soldQuantity || 0), 0);

  const seatColumns = [
    { title: '#', key: 'index', width: 60, render: (_: any, __: any, idx: number) => idx + 1 },
    { title: 'Mã vé', dataIndex: 'ticketId', key: 'ticketId' },
    { title: 'Ghế', dataIndex: 'seat', key: 'seat' },
    {
      title: 'Trạng thái',
      dataIndex: 'isSold',
      key: 'isSold',
      width: 120,
      render: (isSold: boolean) => <Tag color={isSold ? 'red' : 'green'}>{isSold ? 'Đã bán' : 'Còn trống'}</Tag>,
    },
  ];

  const historyColumns = [
    { title: 'Thời điểm', dataIndex: 'editedAt', key: 'editedAt', width: 180, render: (value: string) => formatDateTime(value) },
    { title: 'Loại', dataIndex: 'action', key: 'action', width: 120, render: (value: string) => <Tag color={value === 'updated' ? 'blue' : 'green'}>{value}</Tag> },
    { title: 'Tên vé', key: 'name', render: (_: any, row: TicketHistoryEntry) => row.snapshot?.name || '—' },
    { title: 'Giá', key: 'price', width: 120, render: (_: any, row: TicketHistoryEntry) => formatCurrency(row.snapshot?.price) },
    { title: 'Số lượng', key: 'totalQuantity', width: 100, render: (_: any, row: TicketHistoryEntry) => row.snapshot?.totalQuantity ?? '—' },
    { title: 'Loại ghế', key: 'seatType', width: 120, render: (_: any, row: TicketHistoryEntry) => row.snapshot?.seatType || '—' },
    { title: 'Trạng thái', key: 'status', width: 140, render: (_: any, row: TicketHistoryEntry) => getTicketStatusTag(row.snapshot?.status) },
  ];

  const columns = [
    { title: '#', key: 'index', render: (_: any, __: any, idx: number) => idx + 1, width: 48 },
    { title: 'Loại vé', dataIndex: 'name', key: 'name' },
    { title: 'Giá vé (VND)', dataIndex: 'price', key: 'price', render: (p: number) => p?.toLocaleString() },
    { title: 'Số lượng', dataIndex: 'totalQuantity', key: 'qty' },
    { title: 'Đã bán (sự kiện)', key: 'soldTotal', render: () => selectedEvent ? selectedEventSoldTotal : '—' },
    { title: 'Chi tiết', key: 'action', width: 160, render: (_: any, row: any) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <Button icon={<EyeOutlined />} onClick={() => openDetailModal(row)} />
        <Button type="default" onClick={() => {
          setEditingClass(row);
          setEditTicketsDraft(normalizeSeatDraft(row.ticketList));
          editForm.setFieldsValue({
            name: row.name,
            price: row.price,
            totalQuantity: row.totalQuantity,
            availableFrom: row.availableFrom ? moment(row.availableFrom) : null,
            availableUntil: row.availableUntil ? moment(row.availableUntil) : null,
            status: row.status,
            seatType: row.seatType,
          });
          setEditModalOpen(true);
        }}>Edit</Button>
        <Button danger icon={<DeleteOutlined />} onClick={() => deleteClass(row._id)} />
      </div>
    ) }
  ];

  return (
    <AdminLayout>
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Tạo vé sự kiện</h2>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ minWidth: 320 }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title*</label>
            <Select placeholder="Chọn sự kiện" style={{ width: '100%' }} value={selectedEvent || undefined} onChange={(val) => setSelectedEvent(val)}>
              {events.map(e => <Option key={e._id} value={e._id}>{e.title || e.name || e._id}</Option>)}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seat Type*</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                type={seatType === 'reserved' ? 'primary' : 'default'}
                onClick={() => setSeatType('reserved')}
                style={seatType === 'reserved' ? { backgroundColor: '#10B981', borderColor: '#10B981', color: '#fff' } : { backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827' }}
              >
                Reserved
              </Button>
              <Button
                type={seatType === 'general' ? 'primary' : 'default'}
                onClick={() => setSeatType('general')}
                style={seatType === 'general' ? { backgroundColor: '#10B981', borderColor: '#10B981', color: '#fff' } : { backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827' }}
              >
                General
              </Button>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <Button icon={<PlusOutlined />} onClick={addRow}>Thêm loại vé</Button>
        </div>

        {rows.map((r, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <Input placeholder="Tên vé" value={r.name} onChange={e => updateRow(idx, { name: e.target.value })} style={{ width: 220 }} />
            <InputNumber min={0} placeholder="Giá vé" value={r.price} onChange={v => updateRow(idx, { price: v })} style={{ width: 140 }} />
            {seatType === 'general' ? (
              <InputNumber min={0} placeholder="Số lượng" value={r.totalQuantity} onChange={v => updateRow(idx, { totalQuantity: v })} style={{ width: 140 }} />
            ) : (
              <Button onClick={() => openTicketList(idx)}>Danh sách ghế ({r.ticketList?.length || 0})</Button>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => saveSingleRow(idx)}
              size="middle"
              style={{ backgroundColor: '#7db8ff', borderColor: '#7db8ff', color: '#ffffff', fontWeight: 700, boxShadow: '0 6px 14px rgba(125,184,255,0.28)' }}
            >
              Save
            </Button>
            <Button danger onClick={() => removeRow(idx)}>Delete</Button>
          </div>
        ))}

        <div style={{ marginTop: 16, marginBottom: 24 }}>
          <Button
            type="primary"
            onClick={createAll}
            loading={loading}
            size="middle"
            icon={<SaveOutlined />}
            style={{ backgroundColor: '#54A1FF', borderColor: '#9ac7ff', color: '#ffffff', fontWeight: 700, minWidth: 120, boxShadow: '0 7px 16px rgba(154,199,255,0.30)' }}
          >
            Confirm
          </Button>
        </div>

        <div style={{ marginTop: 20 }}>
          <h3 className="font-medium mb-2">Danh sách loại vé hiện có</h3>
          <Table dataSource={existingTicketClasses} columns={columns} rowKey={(r:any)=>r._id} loading={loading} />
        </div>

        <Modal
          title="CHI TIẾT LOẠI VÉ"
          open={detailModalOpen}
          onCancel={closeDetailModal}
          footer={null}
          width={980}
          centered
          styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' } }}
          destroyOnHidden
        >
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Tên vé">{viewingClass?.name || '—'}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">{getTicketStatusTag(viewingClass?.status)}</Descriptions.Item>
            <Descriptions.Item label="Giá vé">{formatCurrency(viewingClass?.price)} VND</Descriptions.Item>
            <Descriptions.Item label="Loại ghế">{viewingClass?.seatType || '—'}</Descriptions.Item>
            <Descriptions.Item label="Tổng số lượng">{viewingClass?.totalQuantity ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Đã bán">{viewingClass?.soldQuantity ?? 0}</Descriptions.Item>
            <Descriptions.Item label="Mở bán từ">{formatDateTime(viewingClass?.availableFrom)}</Descriptions.Item>
            <Descriptions.Item label="Mở bán đến">{formatDateTime(viewingClass?.availableUntil)}</Descriptions.Item>
          </Descriptions>

          {viewingClass?.seatType === 'reserved' ? (
            <div style={{ marginTop: 20 }}>
              <h3 className="font-medium mb-2">Danh sách ghế</h3>
              <Table
                dataSource={normalizeSeatDraft(viewingClass?.ticketList)}
                columns={seatColumns}
                rowKey={(row: SeatDraft) => `${row.ticketId}-${row.seat}`}
                pagination={{ pageSize: 6 }}
                size="small"
              />
            </div>
          ) : null}

          <div style={{ marginTop: 20 }}>
            <h3 className="font-medium mb-2">Lịch sử chỉnh sửa tại FE</h3>
            <Table
              dataSource={ticketHistory}
              columns={historyColumns}
              rowKey={(row: TicketHistoryEntry) => `${row.editedAt}-${row.action}`}
              pagination={{ pageSize: 5 }}
              locale={{ emptyText: 'Chưa có lịch sử chỉnh sửa nào được lưu trên trình duyệt này.' }}
              size="small"
            />
          </div>
        </Modal>

        <Modal title="Danh sách vé (reserved)" open={ticketListModalOpen} onCancel={() => setTicketListModalOpen(false)} onOk={saveTicketList} okButtonProps={primaryActionButtonProps} width={800}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Input
              placeholder="Mã vé hoặc ghế"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              onPressEnter={() => {
                const v = ticketInput?.trim();
                if (v) {
                  setCurrentTicketsForRow(prev => [...prev, { ticketId: v, seat: v }]);
                  setTicketInput('');
                }
              }}
            />
            <Button onClick={() => {
              const v = ticketInput?.trim();
              if (v) {
                setCurrentTicketsForRow(prev => [...prev, { ticketId: v, seat: v }]);
                setTicketInput('');
              }
            }}>Add</Button>
          </div>
          <Table dataSource={currentTicketsForRow} rowKey={(r:any,i)=>String(i)} pagination={false} columns={[{ title: '#', render: (_:any, __:any, i:number)=>i+1, width:40 }, { title: 'Mã vé', dataIndex: 'ticketId', key: 'ticketId' }, { title: 'Ghế', dataIndex: 'seat', key: 'seat' }, { title: 'Action', key: 'a', render: (_:any, __:any, i:number)=> <Button danger onClick={()=> setCurrentTicketsForRow(prev => prev.filter((_,idx)=>idx!==i))}>Delete</Button> }]} />
        </Modal>

        {/* Edit existing TicketClass modal */}
        <Modal title="Chỉnh sửa loại vé" open={editModalOpen} onCancel={() => { setEditModalOpen(false); setEditingClass(null); setEditTicketListModalOpen(false); setEditTicketsDraft([]); editForm.resetFields(); }} onOk={async () => {
          try {
            const vals = await editForm.validateFields();
            if (!editingClass) return;
            const previousSnapshot = {
              ...editingClass,
              ticketList: normalizeSeatDraft(editingClass.ticketList),
            };
            const payload: any = {
              name: vals.name,
              price: Number(vals.price) || 0,
              totalQuantity: vals.seatType === 'reserved' ? editTicketsDraft.length : Number(vals.totalQuantity) || 0,
              availableFrom: vals.availableFrom ? vals.availableFrom.toISOString() : undefined,
              availableUntil: vals.availableUntil ? vals.availableUntil.toISOString() : undefined,
              status: vals.status,
              seatType: vals.seatType
            };
            await updateTicketClassAPI(editingClass._id, { ...payload, ticketList: vals.seatType === 'reserved' ? editTicketsDraft : undefined });
            writeTicketHistory(editingClass._id, {
              editedAt: new Date().toISOString(),
              action: 'updated',
              snapshot: previousSnapshot,
            });
            message.success('Cập nhật thành công');
            setEditModalOpen(false);
            setEditingClass(null);
            setEditTicketsDraft([]);
            editForm.resetFields();
            const res = await getTicketClassesByEventAPI(selectedEvent!);
            setExistingTicketClasses(Array.isArray(res) ? res : []);
          } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.message || 'Cập nhật thất bại');
          }
        }} okButtonProps={primaryActionButtonProps} width={700}>
          <Form form={editForm} layout="vertical">
            <Form.Item name="name" label="Tên vé" rules={[{ required: true, message: 'Nhập tên vé' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="price" label="Giá vé" rules={[{ required: true, message: 'Nhập giá vé' }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="seatType" label="Loại ghế" rules={[{ required: true }]}>
              <Select>
                <Option value="reserved">Reserved</Option>
                <Option value="general">General</Option>
              </Select>
            </Form.Item>
            {editSeatType === 'general' ? (
              <Form.Item name="totalQuantity" label="Số lượng" rules={[{ required: true, message: 'Nhập số lượng vé' }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            ) : (
              <Form.Item label="Danh sách ghế">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span>{editTicketsDraft.length} ghế đang cấu hình</span>
                  <Button onClick={openEditSeatList}>Chỉnh danh sách ghế</Button>
                </div>
              </Form.Item>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Form.Item name="availableFrom" label="Available From" style={{ flex: 1 }}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="availableUntil" label="Available Until" style={{ flex: 1 }}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <Form.Item name="status" label="Trạng thái">
              <Select>
                <Option value="available">available</Option>
                <Option value="sold_out">sold_out</Option>
                <Option value="unavailable">unavailable</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        <Modal title="Chỉnh danh sách ghế" open={editTicketListModalOpen} onCancel={() => setEditTicketListModalOpen(false)} onOk={saveEditSeatList} okButtonProps={primaryActionButtonProps} width={800}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Input
              placeholder="Mã vé hoặc ghế"
              value={editTicketInput}
              onChange={(e) => setEditTicketInput(e.target.value)}
              onPressEnter={() => {
                const value = editTicketInput.trim();
                if (!value) return;
                setEditTicketsDraft((prev) => [...prev, { ticketId: value, seat: value }]);
                setEditTicketInput('');
              }}
            />
            <Button onClick={() => {
              const value = editTicketInput.trim();
              if (!value) return;
              setEditTicketsDraft((prev) => [...prev, { ticketId: value, seat: value }]);
              setEditTicketInput('');
            }}>Add</Button>
          </div>
          <Table
            dataSource={editTicketsDraft}
            rowKey={(row: SeatDraft) => `${row.ticketId}-${row.seat}`}
            pagination={false}
            columns={[
              { title: '#', render: (_: any, __: any, idx: number) => idx + 1, width: 40 },
              { title: 'Mã vé', dataIndex: 'ticketId', key: 'ticketId' },
              { title: 'Ghế', dataIndex: 'seat', key: 'seat' },
              {
                title: 'Action',
                key: 'action',
                render: (_: any, __: any, idx: number) => (
                  <Button danger onClick={() => setEditTicketsDraft((prev) => prev.filter((_, itemIndex) => itemIndex !== idx))}>Delete</Button>
                ),
              },
            ]}
          />
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default TicketInforPage;
