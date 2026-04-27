import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  Button,
  Table,
  Input,
  message,
  Image,
  Tag,
  Modal,
  Descriptions,
  Popconfirm,
  Form,
  DatePicker,
  InputNumber,
  Select,
  Space,
  Typography,
  Rate,
  Avatar,
  List
} from 'antd';
import { 
  PlusOutlined, 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  StarOutlined 
} from '@ant-design/icons';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import {
  getAllEventsAPI,
  createEventAPI,
  updateEventAPI,
  getEventByIdAPI,
  deleteEventAPI,
} from '../../../services/eventService';
import { getAllOrganizersAPI } from '../../../services/organizerService';
// Nhớ đảm bảo import này khớp với file khai báo API review của bạn
import { getEventReviewsAPI } from '../../../services/reviewService'; 
import { handleAuthError } from '../../../utils/httpError';
import { normalizeRichTextContent, sanitizeRichText } from '../../../utils/richText';

const { Search } = Input;

type AnyObj = Record<string, any>;

interface Review {
  _id: string;
  rating: number;
  comment: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

const unwrapEntity = (it: any): AnyObj => it?.event ?? it?._doc ?? it?.payload ?? it?.data ?? it?.item ?? it ?? {};

const getOrganizerId = (organizer: any): string => {
  if (!organizer) return '';
  if (typeof organizer === 'string') return organizer;
  return organizer._id || organizer.id || '';
};

const formatLocation = (loc: any): string => {
  if (!loc) return '—';
  if (typeof loc === 'string') return loc || '—';
  if (loc.address) return loc.address;
  return [loc.venue, loc.city].filter(Boolean).join(' - ') || '—';
};

const normalizeEvent = (raw: any): AnyObj => {
  const e = unwrapEntity(raw);
  return {
    ...e,
    _id: e._id || e.id,
    title: e.title || e.name || '',
    posterURL: e.posterURL || e.posterUrl || e.image || '',
    status: (e.status || e.state || '').toString(),
    maxCapacity: e.maxCapacity ?? e.capacity ?? e.max_capacity,
    organizer: e.organizer,
    location: e.location || e.locationAddress || e.address || null,
  };
};

const statusMeta = (status: string) => {
  const s = String(status || '').toLowerCase();
  if (s === 'published') return { color: 'green', text: s };
  if (s === 'draft') return { color: 'default', text: s };
  if (s === 'completed') return { color: 'blue', text: s };
  if (s === 'cancelled') return { color: 'red', text: s };
  return { color: 'default', text: s || '—' };
};

const DEFAULT_COORDINATES: [number, number] = [106.695, 10.772]; // fallback nếu không nhập lat/lng

const descriptionEditorModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['blockquote', 'link'],
    ['clean'],
  ],
};

const descriptionEditorFormats = [
  'header',
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'align',
  'list',
  'bullet',
  'indent',
  'blockquote',
  'link',
];

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

const EventInforPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [organizersMap, setOrganizersMap] = React.useState<Record<string, string>>({});
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(null);
  
  const [viewOpen, setViewOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<any>(null);

  // Thêm States cho Review Modal
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reviewLoading, setReviewLoading] = React.useState(false);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [reviewEvent, setReviewEvent] = React.useState<any>(null);

  const [form] = Form.useForm();
  const tableHeight = window.innerHeight - 350;

  React.useEffect(() => {
    fetchEvents();
    fetchOrganizers();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await getAllEventsAPI() as any;
      const normalized = (Array.isArray(res) ? res : res?.data || []).map(normalizeEvent);
      setData(normalized);
    } catch (err) {
      handleAuthError(err, navigate);
      message.error('Không thể tải danh sách sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizers = async () => {
    try {
      const res = await getAllOrganizersAPI();
      const root = (res as any)?.data ?? res;
      const list =
        root?.organizers ??
        root?.items ??
        root?.docs ??
        (Array.isArray(root) ? root : root?.data ?? []);

      const map: Record<string, string> = {};
      (Array.isArray(list) ? list : []).forEach((org: any) => {
        const id = org?._id || org?.id;
        const name = org?.name || org?.title || '';
        if (id && name) map[id] = name;
      });
      setOrganizersMap(map);
    } catch (err) {
      handleAuthError(err, navigate);
    }
  };

  const openView = async (record: any) => {
    try {
      setLoading(true);
      const detail = await getEventByIdAPI(record._id);
      setSelected(normalizeEvent({ ...record, ...unwrapEntity(detail) }));
    } catch {
      setSelected(normalizeEvent(record));
      message.warning('Không thể tải đầy đủ chi tiết sự kiện, đang hiển thị dữ liệu từ danh sách');
    } finally {
      setLoading(false);
      setViewOpen(true);
    }
  };

  const closeView = () => {
    setViewOpen(false);
    setSelected(null);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await deleteEventAPI(id);
      message.success('Xóa sự kiện thành công');
      await fetchEvents();
    } catch (err) {
      message.error('Không thể xóa sự kiện');
    } finally {
      setLoading(false);
    }
  };

  // Hàm mở Modal Đánh giá và gọi API
  const openReviewModal = async (record: any) => {
    setReviewEvent(record);
    setReviewOpen(true);
    setReviewLoading(true);
    try {
      const result = await getEventReviewsAPI(record._id);
      setReviews(Array.isArray(result) ? result : []);
    } catch (err: any) {
      message.error('Không thể tải danh sách đánh giá.');
    } finally {
      setReviewLoading(false);
    }
  };

  // Tính trung bình số sao
  const calculateAvg = (list: Review[]) => {
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / list.length).toFixed(1);
  };

  const EVENT_GENRES = [
    'conference',
    'seminar',
    'concert',
    'festival',
    'sports',
    'fundraising',
    'exhibition',
    'webinar',
    'productlaunch',
    'theater',
    'other',
  ] as const;

  const EVENT_STATUSES = ['draft', 'published', 'cancelled', 'completed'] as const;

  const getOrganizerName = (organizer: any, map: Record<string, string>) => {
    if (!organizer) return '—';
    if (typeof organizer === 'object') {
      const directName = organizer.name || organizer.title;
      if (directName) return directName;
      const oid = organizer._id || organizer.id;
      if (oid && map[oid]) return map[oid];
      return oid || '—';
    }
    return map[organizer] || organizer || '—';
  };

  const toValidEnum = (val: any, allowed: readonly string[]) => {
    const v = String(val || '').trim().toLowerCase();
    return allowed.includes(v) ? v : undefined;
  };

  const openCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
    requestAnimationFrame(() => {
      form.resetFields();
      form.setFieldsValue({ status: 'draft', description: '' }); // khớp BE default
    });
  };

  const handleEdit = async (record: any) => {
    try {
      setLoading(true);
      const detail = await getEventByIdAPI(record._id);
      const e = normalizeEvent({ ...record, ...unwrapEntity(detail) });
      setEditing(e);

      form.setFieldsValue({
        title: e.title,
        genre: toValidEnum(e.genre, EVENT_GENRES),
        description: normalizeRichTextContent(e.description),
        posterURL: e.posterURL,
        startDateTime: e.startDateTime ? moment(e.startDateTime) : null,
        endDateTime: e.endDateTime ? moment(e.endDateTime) : null,
        maxCapacity: e.maxCapacity ?? undefined,
        status: toValidEnum(e.status, EVENT_STATUSES) || 'draft',
        ageLimit: e.ageLimit,
        seatImgUrl: e.seatImgUrl,
        organizer: getOrganizerId(e.organizer) || undefined,
        locationAddress: e?.location?.address || '',
      });

      setIsModalOpen(true);
    } catch {
      message.error('Không thể tải chi tiết để chỉnh sửa');
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const genre = toValidEnum(values.genre, EVENT_GENRES);
      const status = toValidEnum(values.status, EVENT_STATUSES) || 'draft';

      if (!genre) {
        message.error('Genre không hợp lệ theo BE');
        return;
      }

      const oldCoords = Array.isArray(editing?.location?.coordinates)
        ? editing.location.coordinates
        : undefined;

      const payload: any = {
        title: values.title,
        genre,            // luôn đúng enum BE
        status,           // luôn đúng enum BE
        description: values.description,
        posterURL: values.posterURL,
        startDateTime: values.startDateTime ? values.startDateTime.toISOString() : null,
        endDateTime: values.endDateTime ? values.endDateTime.toISOString() : null,
        maxCapacity: values.maxCapacity,
        ageLimit: values.ageLimit,
        seatImgUrl: values.seatImgUrl,
        organizer: values.organizer,
        location: {
          type: 'Point',
          coordinates: oldCoords ?? DEFAULT_COORDINATES,
          address: values.locationAddress,
        },
      };

      if (editing?._id) {
        await updateEventAPI(editing._id, payload);
        message.success('Cập nhật sự kiện thành công');
      } else {
        await createEventAPI(payload);
        message.success('Tạo sự kiện thành công');
      }

      await fetchEvents();
      setQuery('');
      handleModalCancel();
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Lưu không thành công';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;

    return data.filter((d) => {
      const organizerId = getOrganizerId(d.organizer);
      const organizerName = (organizersMap[organizerId] || '').toLowerCase();

      return (
        String(d?.title || '').toLowerCase().includes(q) ||
        String(d?._id || '').toLowerCase().includes(q) ||
        String(d?.genre || '').toLowerCase().includes(q) ||
        String(d?.status || '').toLowerCase().includes(q) ||
        organizerName.includes(q) ||
        formatLocation(d?.location).toLowerCase().includes(q)
      );
    });
  }, [data, query, organizersMap]);

  const columns = React.useMemo(
    () => [
      { title: '#', key: 'index', width: 50, render: (_: any, __: any, idx: number) => idx + 1 },
      {
        title: 'Poster',
        dataIndex: 'posterURL',
        key: 'posterURL',
        width: 80,
        render: (url: string) =>
          url ? <Image src={url} width={72} height={48} style={{ objectFit: 'cover' }} alt="poster" /> : null,
      },
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        width: 340, // Đã điều chỉnh một chút để cân bằng với nút action
        sorter: (a: any, b: any) => (a.title || '').localeCompare(b.title || ''),
        render: (text: any) => <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{text || '—'}</div>,
      },
      {
        title: 'Organizer',
        dataIndex: 'organizer',
        key: 'organizer',
        width: 180,
        render: (o: any) => getOrganizerName(o, organizersMap),
      },
      {
        title: 'Location',
        dataIndex: 'location',
        key: 'location',
        width: 260,
        render: (loc: any) => formatLocation(loc),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (s: string) => {
          const m = statusMeta(s);
          return <Tag color={m.color}>{m.text}</Tag>;
        },
      },
      {
        title: 'Action',
        key: 'action',
        width: 140, // Đã tăng width để chứa 4 icon
        render: (_: any, record: any) => (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            <Button type="text" size="small" title="Xem chi tiết" icon={<EyeOutlined />} onClick={() => openView(record)} />
            {/* Nút Xem đánh giá mới thêm */}
            <Button type="text" size="small" title="Xem đánh giá" icon={<StarOutlined />} onClick={() => openReviewModal(record)} />
            <Button type="text" size="small" title="Chỉnh sửa" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            <Popconfirm
              title="Xóa sự kiện này?"
              onConfirm={() => handleDelete(record._id)}
              okButtonProps={primaryActionButtonProps}
            >
              <Button danger type="text" size="small" title="Xóa" icon={<DeleteOutlined />} />
            </Popconfirm>
          </div>
        ),
      },
    ],
    [organizersMap]
  );

  const genreOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((d) => String(d?.genre || '').trim())
            .filter(Boolean)
        )
      ).map((g) => ({ label: g, value: g })),
    [data]
  );

  const statusOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((d) => String(d?.status || '').trim())
            .filter(Boolean)
        )
      ).map((s) => ({ label: s, value: s })),
    [data]
  );

  return (
    <AdminLayout>
      <div className="bg-white rounded shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Event Information</h2>
          <div className="flex items-center gap-3">
            <Search
              placeholder="Tìm sự kiện"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onSearch={(v) => setQuery(v)}
              style={{ width: 240 }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#559de0';
                e.currentTarget.style.borderColor = '#559de0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#66aef7';
                e.currentTarget.style.borderColor = '#66aef7';
              }}
              style={{
                backgroundColor: '#66aef7',
                borderColor: '#66aef7',
                boxShadow: '0 6px 14px rgba(102, 174, 247, 0.35)',
                transition: 'background-color 0.2s ease, border-color 0.2s ease',
              }}
            >
              Tạo mới
            </Button>
          </div>
        </div>

        <Table
          rowKey={(r) => r._id}
          columns={columns}
          dataSource={filtered}
          loading={loading}
          scroll={{ y: tableHeight, x: 1200 }}
          pagination={{
            defaultPageSize: 24,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '24', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`,
          }}
        />
      </div>

      <Modal
        title="Chi tiết sự kiện"
        open={viewOpen}
        onCancel={closeView}
        footer={null}
        width={900}
        centered
        styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' } }}
        destroyOnHidden
      >
        {selected && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Title">{selected.title || '—'}</Descriptions.Item>
            <Descriptions.Item label="Description">
              {selected.description ? (
                <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: sanitizeRichText(selected.description) }} />
              ) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Poster">
              {selected.posterURL ? <Image src={selected.posterURL} width={240} alt="poster" /> : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Start">
              {selected.startDateTime ? new Date(selected.startDateTime).toLocaleString() : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="End">
              {selected.endDateTime ? new Date(selected.endDateTime).toLocaleString() : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Max Capacity">{selected.maxCapacity ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusMeta(selected.status).color}>{statusMeta(selected.status).text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Age Limit">{selected.ageLimit ? `${selected.ageLimit}+` : 'All'}</Descriptions.Item>
            <Descriptions.Item label="Seat Map">
              {selected.seatImgUrl ? <Image src={selected.seatImgUrl} width={420} alt="seat" /> : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Organizer">
              {getOrganizerName(selected.organizer, organizersMap)}
            </Descriptions.Item>
            <Descriptions.Item label="Location">{formatLocation(selected.location)}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Modal Đánh giá sự kiện */}
      <Modal
        title={`Đánh giá sự kiện - ${reviewEvent?.title || ''}`}
        open={reviewOpen}
        onCancel={() => { setReviewOpen(false); setReviews([]); }}
        footer={null}
        width={700}
        centered
        destroyOnClose
      >
        <div style={{ marginBottom: 20, textAlign: 'center', background: '#fafafa', padding: '16px', borderRadius: '8px' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {calculateAvg(reviews)} / 5
          </Typography.Title>
          <Rate disabled allowHalf value={Number(calculateAvg(reviews))} />
          <div style={{ color: '#8c8c8c', marginTop: 4 }}>Dựa trên {reviews.length} lượt đánh giá</div>
        </div>

        <List
          loading={reviewLoading}
          itemLayout="horizontal"
          dataSource={reviews}
          pagination={{ pageSize: 5, size: 'small' }}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar src={item.user?.avatar}>{item.user?.name?.charAt(0)}</Avatar>}
                title={
                  <Space>
                    <span style={{ fontWeight: 600 }}>{item.user?.name}</span>
                    <Rate disabled value={item.rating} style={{ fontSize: 12 }} />
                    <span style={{ fontSize: 12, color: '#bfbfbf' }}>
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </Space>
                }
                description={
                  <div style={{ color: '#262626', marginTop: 4 }}>
                    {item.comment || <i style={{ color: '#bfbfbf' }}>Không có bình luận</i>}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      <Modal
        title={editing ? 'Chỉnh sửa sự kiện' : 'Tạo mới sự kiện'}
        open={isModalOpen}
        onCancel={handleModalCancel}
        onOk={handleModalSubmit}
        confirmLoading={submitting}
        okButtonProps={primaryActionButtonProps}
        width={800}
        centered
        styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' } }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="genre" label="Thể loại" rules={[{ required: true, message: 'Vui lòng chọn thể loại' }]}>
            <Select
              showSearch
              options={EVENT_GENRES.map((g) => ({ label: g, value: g }))}
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <ReactQuill
              className="event-description-editor"
              theme="snow"
              modules={descriptionEditorModules}
              formats={descriptionEditorFormats}
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="startDateTime" label="Bắt đầu" style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endDateTime" label="Kết thúc" style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="maxCapacity" label="Sức chứa" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="ageLimit" label="Độ tuổi" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="status" label="Trạng thái" style={{ flex: 1 }} rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}>
              <Select
                options={EVENT_STATUSES.map((s) => ({ label: s, value: s }))}
              />
            </Form.Item>
            <Form.Item name="tag" label="Tag" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </div>

          <Form.Item name="posterURL" label="Poster URL">
            <Input />
          </Form.Item>
          <Form.Item name="seatImgUrl" label="Seat map URL">
            <Input />
          </Form.Item>
          <Form.Item name="organizer" label="Ban tổ chức">
            <Select
              showSearch
              options={Object.keys(organizersMap).map((k) => ({ label: organizersMap[k] || k, value: k }))}
            />
          </Form.Item>
          <Form.Item name="locationAddress" label="Địa điểm" rules={[{ required: true, message: 'Vui lòng nhập địa điểm' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
};

export default EventInforPage;