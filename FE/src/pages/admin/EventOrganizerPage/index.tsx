import React from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { Button, Table, Input, Space, Popconfirm, message, Modal, Form } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAllOrganizersAPI, deleteOrganizerAPI, createOrganizerAPI, updateOrganizerAPI } from '../../../services/organizerService';
import { useNavigate } from 'react-router-dom';
import { handleAuthError } from '../../../utils/httpError';

const { Search } = Input;

const EventOrganizerPage: React.FC = () => {
	const [loading, setLoading] = React.useState(false);
	const [data, setData] = React.useState<any[]>([]);
	const [query, setQuery] = React.useState('');
	const navigate = useNavigate();

	const [isModalOpen, setIsModalOpen] = React.useState(false);
	const [editing, setEditing] = React.useState<any | null>(null);
	const [submitting, setSubmitting] = React.useState(false);
	const [form] = Form.useForm();

	const fetch = async () => {
		try {
			setLoading(true);
			const res = await getAllOrganizersAPI();
			setData(Array.isArray(res) ? res : []);
		} catch (err) {
			console.error(err);
			if (handleAuthError(err, navigate, { includeForbidden: true, showMessage: false })) {
				return;
			}
			message.open({ type: 'error', content: 'Không thể tải danh sách ban tổ chức', key: 'organizer-load' });
		} finally {
			setLoading(false);
		}
	};

	React.useEffect(() => { fetch(); }, []);

	const openCreate = () => {
		setEditing(null);
		form.resetFields();
		setIsModalOpen(true);
	};

	const openEdit = (record: any) => {
		setEditing(record);
		form.setFieldsValue({
			name: record.name,
			email: record.email,
			phoneNumber: record.phoneNumber,
			address: record.address,
			taxCode: record.taxCode,
			user: record.user || ''
		});
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
			if (editing) {
				await updateOrganizerAPI(editing._id, values);
				message.success('Cập nhật ban tổ chức thành công');
			} else {
				await createOrganizerAPI(values);
				message.success('Tạo ban tổ chức thành công');
			}
			handleModalCancel();
			fetch();
		} catch (err) {
			console.error(err);
			message.error('Lưu không thành công');
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteOrganizerAPI(id);
			message.success('Xóa thành công');
			fetch();
		} catch (err) {
			console.error(err);
			message.error('Xóa thất bại');
		}
	};

	const columns = [
		{ title: '#', key: 'index', render: (_: any, __: any, idx: number) => idx + 1, width: 60 },
		{ title: 'Tên tổ chức', dataIndex: 'name', key: 'name', sorter: (a: any, b: any) => (a.name || '').localeCompare(b.name || '') },
		{ title: 'Mã số thuế', dataIndex: 'taxCode', key: 'taxCode', width: 140 },
		{ title: 'Email', dataIndex: 'email', key: 'email' },
		{ title: 'Số điện thoại', dataIndex: 'phoneNumber', key: 'phoneNumber', width: 140 },
		{ title: 'Địa chỉ', dataIndex: 'address', key: 'address' },
		{
			title: 'Action', key: 'action', width: 140, render: (_: any, record: any) => (
				<Space>
					<Button type="text" icon={<EyeOutlined />} />
					<Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
					<Popconfirm title="Bạn có chắc muốn xóa?" onConfirm={() => handleDelete(record._id)}>
						<Button danger type="text" icon={<DeleteOutlined />} />
					</Popconfirm>
				</Space>
			)
		}
	];

	const filtered = data.filter(d => {
		if (!query) return true;
		const q = query.toLowerCase();
		return (
			String(d.name || '').toLowerCase().includes(q) ||
			String(d.email || '').toLowerCase().includes(q) ||
			String(d.taxCode || '').toLowerCase().includes(q)
		);
	});

	return (
		<AdminLayout>
			<div className="bg-white rounded shadow p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold">Event Organizers</h2>
					<div className="flex items-center gap-3">
						<Search
							placeholder="Tìm kiếm"
							onSearch={val => setQuery(val)}
							onChange={e => setQuery((e.target as HTMLInputElement).value)}
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
							Thêm mới
						</Button>
					</div>
				</div>

				<Table
					rowKey={(r) => r._id}
					dataSource={filtered}
					columns={columns}
					loading={loading}
					pagination={{ pageSize: 10 }}
					scroll={{ y: 480 }}
					sticky
				/>
			</div>

			{/* Modal: Create / Edit Organizer */}
			<Modal
				title={editing ? 'CHỈNH SỬA THÔNG TIN BAN TỔ CHỨC' : 'THÊM MỚI BAN TỔ CHỨC'}
				open={isModalOpen}
				onCancel={handleModalCancel}
				onOk={handleModalSubmit}
				confirmLoading={submitting}
				centered
				width={720}
				// ensure modal body scrolls while footer (OK) stays visible
				bodyStyle={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}
				destroyOnClose
			>
				<Form form={form} layout="vertical">
					<Form.Item name="name" label="Tên tổ chức" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
						<Input />
					</Form.Item>
					<Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
						<Input />
					</Form.Item>
					<Form.Item name="phoneNumber" label="Số điện thoại" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
						<Input />
					</Form.Item>
					<Form.Item name="address" label="Địa chỉ">
						<Input />
					</Form.Item>
					<Form.Item name="taxCode" label="Mã số thuế">
						<Input />
					</Form.Item>
					<Form.Item name="user" label="User ID (đại diện)" rules={[{ required: true, message: 'Vui lòng chỉ định user đại diện' }]}>
						<Input />
					</Form.Item>
				</Form>
			</Modal>
		</AdminLayout>
	);
};

export default EventOrganizerPage;
