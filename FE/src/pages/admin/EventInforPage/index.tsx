import React from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { Button, Table, Input, message, Image, Tag, Modal, Descriptions, Popconfirm, Form, DatePicker, InputNumber, Select } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { getAllEventsAPI, createEventAPI, updateEventAPI } from '../../../services/eventService';
import { getAllOrganizersAPI } from '../../../services/organizerService';

const { Search } = Input;

const EventInforPage: React.FC = () => {
	const [loading, setLoading] = React.useState(false);
	const [data, setData] = React.useState<any[]>([]);
	const [query, setQuery] = React.useState('');
	const navigate = useNavigate();
	const [organizersMap, setOrganizersMap] = React.useState<Record<string, string>>({});

	const fetch = React.useCallback(async () => {
		try {
			setLoading(true);
			const res = await getAllEventsAPI();
			setData(Array.isArray(res) ? res : []);
		} catch (err) {
			console.error(err);
			const status = (err as any)?.response?.status;
			if (status === 401 || status === 403) {
				// silently redirect to home for unauthorized
				navigate('/', { replace: true });
				return;
			}
			message.error('Không thể tải danh sách sự kiện');
		} finally {
			setLoading(false);
		}
	}, [navigate]);

	React.useEffect(() => { fetch(); }, [fetch]);

	// load organizers map to resolve organizer id -> name
	React.useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const res = await getAllOrganizersAPI();
				if (!mounted) return;
				const map: Record<string, string> = {};
				if (Array.isArray(res)) {
					res.forEach((o: any) => { if (o && o._id) map[o._id] = o.name || o.email || '' });
				}
				setOrganizersMap(map);
			} catch (err) {
				console.error('Failed to load organizers', err);
			}
		})();
		return () => { mounted = false };
	}, []);

	const [viewOpen, setViewOpen] = React.useState(false);
	const [selected, setSelected] = React.useState<any | null>(null);

	const [tableHeight, setTableHeight] = React.useState<number>(560);

	// compute table height dynamically so table fits viewport nicely
	React.useEffect(() => {
		const calc = () => {
			// estimate space taken by header, paddings and controls
			const offset = 280; // tweakable
			const h = Math.max(300, window.innerHeight - offset);
			setTableHeight(h);
		};
		calc();
		window.addEventListener('resize', calc);
		return () => window.removeEventListener('resize', calc);
	}, []);

	const openView = (record: any) => {
		setSelected(record);
		setViewOpen(true);
	};

	const [isModalOpen, setIsModalOpen] = React.useState(false);
	const [editing, setEditing] = React.useState<any | null>(null);
	const [submitting, setSubmitting] = React.useState(false);
	const [form] = Form.useForm();

	const closeView = () => {
		setViewOpen(false);
		setSelected(null);
	};

	const handleEdit = (record: any) => {
    // Placeholder: navigate to edit page or open edit modal in future
    setEditing(record);
    form.setFieldsValue({
        title: record.title,
        genre: record.genre,
        description: record.description,
        posterURL: record.posterURL,
        startDateTime: record.startDateTime ? moment(record.startDateTime) : null,
        endDateTime: record.endDateTime ? moment(record.endDateTime) : null,
        maxCapacity: record.maxCapacity,
        status: record.status,
        ageLimit: record.ageLimit,
        seatImgUrl: record.seatImgUrl,
        organizer: typeof record.organizer === 'string' ? record.organizer : (record.organizer?._id || ''),
        locationAddress: typeof record.location === 'string' ? record.location : (record.location?.address || ''),
    });
    setIsModalOpen(true);
	};

    const handleDelete = async (id: string) => {
        try {
            setLoading(true);
            const axiosClient = (await import('../../../services/axiosClient')).default;
            await axiosClient.delete(`/api/event/${id}`);
            message.success('Xóa sự kiện thành công');
            fetch();
        } catch (err) {
            console.error(err);
            message.error('Xóa thất bại');
        } finally {
            setLoading(false);
        }
    };

	const openCreate = () => {
		setEditing(null);
		form.resetFields();
		setIsModalOpen(true);
	};

	const handleModalCancel = () => {
		setIsModalOpen(false);
		setEditing(null);
		form.resetFields();
	};

	const handleModalSubmit = async () => {
    try {
        const values = await form.validateFields();
        setSubmitting(true);
        const payload: any = {
            title: values.title,
            genre: values.genre,
            description: values.description,
            posterURL: values.posterURL,
            startDateTime: values.startDateTime ? values.startDateTime.toISOString() : null,
            endDateTime: values.endDateTime ? values.endDateTime.toISOString() : null,
            maxCapacity: values.maxCapacity,
            status: values.status,
            ageLimit: values.ageLimit,
            seatImgUrl: values.seatImgUrl,
            organizer: values.organizer,
            location: {
                address: values.locationAddress,
                // Include coordinates if available, e.g., from record or default; otherwise, omit or set to existing
                ...(editing?.location?.coordinates ? { coordinates: editing.location.coordinates, type: editing.location.type } : {}),
            },
            // Remove 'tag' if not expected by API
        };

        // Add validation: ensure required fields and valid dates
        if (!payload.title || !payload.startDateTime || !payload.endDateTime) {
            message.error('Required fields missing or invalid dates');
            return;
        }
        if (payload.startDateTime >= payload.endDateTime) {
            message.error('Start date must be before end date');
            return;
        }

        console.log('Payload:', payload); // Debug log

        if (editing) {
            await updateEventAPI(editing._id, payload);
            message.success('Cập nhật sự kiện thành công');
        } else {
            await createEventAPI(payload);
            message.success('Tạo sự kiện thành công');
        }
        handleModalCancel();
        fetch();
    } catch (err: any) {
        console.error('Error details:', err.response?.data || err); // Enhanced logging
        const errorMsg = err.response?.data?.message || 'Lưu không thành công';
        message.error(errorMsg);
    } finally {
        setSubmitting(false);
    }
};

	// Build columns dynamically: omit organizer column if we don't have names
	const baseColumns: any[] = [
		{ title: '#', key: 'index', render: (_: any, __: any, idx: number) => idx + 1, width: 40 },
		{ title: 'Poster', dataIndex: 'posterURL', key: 'posterURL', width: 80, render: (url: string) => url ? <Image src={url} width={72} height={48} style={{ objectFit:'cover' }} alt="poster" /> : null },
		{ title: 'Title', dataIndex: 'title', key: 'title', width: 360, sorter: (a: any, b: any) => (a.title || '').localeCompare(b.title || '' ), render: (text: any) => <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{text}</div> },
		{ title: 'Location', dataIndex: 'location', key: 'location', width: 240, render: (loc: any) => {
			if (!loc) return '';
			if (typeof loc === 'string') return loc;
			return [loc.venue, loc.address, loc.city].filter(Boolean).join(' - ');
		} },
		{ title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => <Tag color={s === 'active' ? 'green' : s === 'draft' ? 'default' : 'red'}>{s}</Tag> },
	];

	// Include organizer column only if we loaded at least one organizer name
	const organizerKeys = Object.keys(organizersMap || {});
	if (organizerKeys.length > 0) {
		baseColumns.splice(3, 0, { // insert before Location
			title: 'Organizer', dataIndex: 'organizer', key: 'organizer', width: 160, render: (o: any) => {
				const id = typeof o === 'string' ? o : (o?._id || '');
				return organizersMap[id] || id || '—';
			}
		});
	}

	// Action column as last
	baseColumns.push({ title: 'Action', key: 'action', width: 96, render: (_: any, record: any) => (
		<div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
			<Button type="text" size="small" icon={<EyeOutlined />} onClick={() => openView(record)} />
			<Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
			<Popconfirm title="Xóa sự kiện này?" onConfirm={() => handleDelete(record._id)}>
				<Button danger type="text" size="small" icon={<DeleteOutlined />} />
			</Popconfirm>
		</div>
	) });

	const columns = baseColumns;

	const filtered = data.filter(d => {
		if (!query) return true;
		const q = query.toLowerCase();
		const organizerName = (() => {
			try {
				const id = typeof d.organizer === 'string' ? d.organizer : (d.organizer?._id || '');
				return organizersMap[id] || '';
			} catch {
				return '';
			}
		})();

		return (
			String(d.title || '').toLowerCase().includes(q) ||
			String(d.genre || '').toLowerCase().includes(q) ||
			String(d.description || '').toLowerCase().includes(q) ||
			String(d.location?.venue || d.location?.address || d.location || '').toLowerCase().includes(q) ||
			String(d.organizer || '').toLowerCase().includes(q) ||
			organizerName.toLowerCase().includes(q)
		);
	});

	return (
		<AdminLayout>
			<div className="bg-white rounded shadow p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold">Event Information</h2>
					<div className="flex items-center gap-3">
						<Search placeholder="Tìm sự kiện" onSearch={val => setQuery(val)} style={{ width: 240 }} allowClear />
						<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Tạo mới</Button>
					</div>
				</div>

				<Table
					rowKey={(r) => r._id}
					dataSource={filtered}
					columns={columns}
					loading={loading}
					size="middle"
					pagination={{ pageSize: 10}}
					scroll={{ y: tableHeight }}
					sticky
				/>
			</div>

					{/* View Modal */}
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
								<Descriptions.Item label="Title">{selected.title}</Descriptions.Item>
								<Descriptions.Item label="Genre">{selected.genre || '—'}</Descriptions.Item>
								<Descriptions.Item label="Description">{selected.description || '—'}</Descriptions.Item>
								<Descriptions.Item label="Poster">{selected.posterURL ? <Image src={selected.posterURL} width={240} alt="poster" /> : '—'}</Descriptions.Item>
								<Descriptions.Item label="Start">{selected.startDateTime ? new Date(selected.startDateTime).toLocaleString() : '—'}</Descriptions.Item>
								<Descriptions.Item label="End">{selected.endDateTime ? new Date(selected.endDateTime).toLocaleString() : '—'}</Descriptions.Item>
								<Descriptions.Item label="Max Capacity">{selected.maxCapacity ?? '—'}</Descriptions.Item>
								<Descriptions.Item label="Status">{selected.status ? <Tag color={selected.status === 'active' ? 'green' : selected.status === 'draft' ? 'default' : 'red'}>{selected.status}</Tag> : '—'}</Descriptions.Item>
								<Descriptions.Item label="Age Limit">{selected.ageLimit ? `${selected.ageLimit}+` : 'All'}</Descriptions.Item>
								<Descriptions.Item label="Seat Map">{selected.seatImgUrl ? <Image src={selected.seatImgUrl} width={420} alt="seat" /> : '—'}</Descriptions.Item>
								<Descriptions.Item label="Organizer">{typeof selected.organizer === 'string' ? selected.organizer : (selected.organizer?._id || '—')}</Descriptions.Item>
								<Descriptions.Item label="Location">{(selected.location && (typeof selected.location === 'string' ? selected.location : [selected.location.venue, selected.location.address, selected.location.city].filter(Boolean).join(' - '))) || '—'}</Descriptions.Item>
							</Descriptions>
						)}
                    </Modal>

			{/* Create / Edit Modal */}
			<Modal
				title={editing ? 'Chỉnh sửa sự kiện' : 'Tạo mới sự kiện'}
				open={isModalOpen}
				onCancel={handleModalCancel}
				onOk={handleModalSubmit}
				confirmLoading={submitting}
				width={800}
				centered
				styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' } }}
				destroyOnHidden
			>
				<Form form={form} layout="vertical">
					<Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
						<Input />
					</Form.Item>
					<Form.Item name="genre" label="Thể loại">
						<Input />
					</Form.Item>
					<Form.Item name="description" label="Mô tả">
						<Input.TextArea rows={4} />
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
						<Form.Item name="status" label="Trạng thái" style={{ flex: 1 }}>
							<Select options={[{ label: 'active', value: 'active' }, { label: 'draft', value: 'draft' }, { label: 'cancelled', value: 'cancelled' }, { label: 'published', value: 'published' }]} />
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
						<Select showSearch options={Object.keys(organizersMap).map(k => ({ label: organizersMap[k] || k, value: k }))} />
					</Form.Item>
					<Form.Item name="locationAddress" label="Địa điểm">
						<Input />
					</Form.Item>
				</Form>
			</Modal>

		</AdminLayout>
	);
};

export default EventInforPage;
