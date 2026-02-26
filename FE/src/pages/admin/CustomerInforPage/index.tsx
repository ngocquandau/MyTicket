import React from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { Button, Table, Input, Space, Popconfirm, message, Modal, Form, Select, DatePicker, Tag, Descriptions } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { handleAuthError } from '../../../utils/httpError';
import {
  getAllUsersAPI,
  updateUserByIdAPI,
  deleteUserByIdAPI,
  UserProfile,
  AdminUpdateUserPayload,
} from '../../../services/userService';

const { Search } = Input;

type UserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  gender: 'male' | 'female' | 'other';
  birthday?: dayjs.Dayjs;
  role: 'user' | 'organizer' | 'admin';
  isActive: 'active' | 'inactive';
};

const CustomerInforPage: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [query, setQuery] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<UserProfile | null>(null);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const [viewingUser, setViewingUser] = React.useState<UserProfile | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [form] = Form.useForm<UserFormValues>();
  const navigate = useNavigate();

  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllUsersAPI();
      setUsers(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error(error);
      if (handleAuthError(error, navigate, { includeForbidden: true, showMessage: false })) {
        return;
      }
      message.error('Không thể tải danh sách tài khoản người dùng');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openEdit = (record: UserProfile) => {
    setEditing(record);
    form.setFieldsValue({
      firstName: record.firstName || '',
      lastName: record.lastName || '',
      email: record.email || '',
      phoneNumber: record.phoneNumber || '',
      gender: record.gender || 'other',
      birthday: record.birthday ? dayjs(record.birthday) : undefined,
      role: record.role || 'user',
      isActive: record.isActive === false ? 'inactive' : 'active',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const openView = (record: UserProfile) => {
    setViewingUser(record);
    setIsViewOpen(true);
  };

  const closeView = () => {
    setIsViewOpen(false);
    setViewingUser(null);
  };

  const handleSubmit = async () => {
    if (!editing?._id) return;

    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload: AdminUpdateUserPayload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phoneNumber: values.phoneNumber?.trim() || '',
        gender: values.gender,
        birthday: values.birthday ? values.birthday.toISOString() : undefined,
        role: values.role,
        isActive: values.isActive === 'active',
      };

      await updateUserByIdAPI(editing._id, payload);
      message.success('Cập nhật tài khoản thành công');
      closeModal();
      fetchUsers();
    } catch (error) {
      console.error(error);
      message.error('Cập nhật tài khoản thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUserByIdAPI(userId);
      message.success('Xóa tài khoản thành công');
      fetchUsers();
    } catch (error) {
      console.error(error);
      message.error('Không thể xóa tài khoản');
    }
  };

  const customerUsers = users.filter((user) => user.role !== 'admin' && user.role !== 'organizer');

  const filteredUsers = customerUsers.filter((user) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const fullName = `${user.lastName || ''} ${user.firstName || ''}`.toLowerCase();
    return (
      fullName.includes(q) ||
      String(user.email || '').toLowerCase().includes(q) ||
      String(user.phoneNumber || '').toLowerCase().includes(q)
    );
  });

  const formatDateTime = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('vi-VN');
  };

  const getTimeValue = (value?: string) => {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const formatGender = (value?: UserProfile['gender']) => {
    if (value === 'male') return 'Nam';
    if (value === 'female') return 'Nữ';
    if (value === 'other') return 'Khác';
    return '—';
  };

  const formatBirthday = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('vi-VN');
  };

  const getUsername = (user: UserProfile) => {
    const email = String(user.email || '').trim();
    if (email.includes('@')) {
      return email.split('@')[0];
    }
    const fullName = `${user.lastName || ''} ${user.firstName || ''}`.trim();
    if (fullName) {
      return fullName.replace(/\s+/g, '.').toLowerCase();
    }
    return user._id?.slice(-8) || '—';
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_: unknown, __: UserProfile, index: number) => index + 1,
    },
    {
      title: 'Họ và tên lót',
      key: 'lastName',
      dataIndex: 'lastName',
      width: 180,
      ellipsis: true,
      render: (value: string) => (
        <span className="block max-w-[160px] truncate" title={value || '—'}>{value || '—'}</span>
      ),
    },
    {
      title: 'Tên người dùng',
      key: 'firstName',
      dataIndex: 'firstName',
      width: 180,
      ellipsis: true,
      render: (value: string) => (
        <span className="block max-w-[160px] truncate" title={value || '—'}>{value || '—'}</span>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 260,
      ellipsis: true,
      render: (value: string) => (
        <span className="block max-w-[220px] truncate" title={value || '—'}>{value || '—'}</span>
      ),
    },
    {
      title: 'SĐT',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 140,
      render: (value: string) => value || '—',
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      render: (_: unknown, record: UserProfile) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} onClick={() => openView(record)} />
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Bạn có chắc muốn xóa tài khoản này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="bg-white rounded shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserOutlined />
            Customer Information
          </h2>
          <Search
            placeholder="Tìm theo tên, email, số điện thoại"
            onSearch={(value) => setQuery(value)}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 320 }}
            allowClear
          />
        </div>

        <Table
          rowKey={(record) => record._id}
          dataSource={filteredUsers}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 10 }}
          tableLayout="fixed"
          scroll={{ x: 980, y: 500 }}
          sticky
        />
      </div>

      <Modal
        title="CHI TIẾT TÀI KHOẢN"
        open={isViewOpen}
        onCancel={closeView}
        footer={null}
        centered
        width={760}
      >
        <Descriptions bordered size="middle" column={1}>
          <Descriptions.Item label="Họ tên">{`${viewingUser?.lastName || ''} ${viewingUser?.firstName || ''}`.trim() || '—'}</Descriptions.Item>
          <Descriptions.Item label="Identifier">{viewingUser ? getUsername(viewingUser) : '—'}</Descriptions.Item>
          <Descriptions.Item label="Email">{viewingUser?.email || '—'}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{viewingUser?.phoneNumber || '—'}</Descriptions.Item>
          <Descriptions.Item label="Giới tính">{formatGender(viewingUser?.gender)}</Descriptions.Item>
          <Descriptions.Item label="Ngày sinh">{formatBirthday(viewingUser?.birthday)}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={viewingUser?.isActive === false ? 'default' : 'success'}>
              {viewingUser?.isActive === false ? 'INACTIVE' : 'ACTIVE'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{formatDateTime(viewingUser?.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Cập nhật cuối">{formatDateTime(viewingUser?.updatedAt)}</Descriptions.Item>
        </Descriptions>
      </Modal>

      <Modal
        title="CHỈNH SỬA TÀI KHOẢN NGƯỜI DÙNG"
        open={isModalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        confirmLoading={submitting}
        centered
        width={720}
        bodyStyle={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="lastName" label="Họ và tên lót" rules={[{ required: true, message: 'Vui lòng nhập họ' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="firstName" label="Tên" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
              <Input />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="phoneNumber" label="Số điện thoại">
              <Input />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="gender" label="Giới tính" rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}>
              <Select>
                <Select.Option value="male">Nam</Select.Option>
                <Select.Option value="female">Nữ</Select.Option>
                <Select.Option value="other">Khác</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="birthday" label="Ngày sinh">
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="role" label="Vai trò" rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}>
              <Select>
                <Select.Option value="user">User</Select.Option>
                <Select.Option value="organizer">Organizer</Select.Option>
                <Select.Option value="admin">Admin</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="isActive" label="Trạng thái" rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}>
              <Select>
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </AdminLayout>
  );
};

export default CustomerInforPage;
