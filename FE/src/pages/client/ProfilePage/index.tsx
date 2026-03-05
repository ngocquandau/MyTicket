import React from 'react';
import { Card, Form, Input, Button, Select, DatePicker, Typography, Spin, message, Upload, Avatar } from 'antd';
import type { RcFile, UploadProps } from 'antd/es/upload';
import dayjs, { Dayjs } from 'dayjs';
import { UserOutlined } from '@ant-design/icons';
import ClientLayout from '../../../layouts/ClientLayout';
import { getMyProfileAPI, updateMyProfileAPI, UserProfile } from '../../../services/userService';
import axiosClient from '../../../services/axiosClient';
import { handleAuthError } from '../../../utils/httpError';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

type ProfileFormValues = {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  birthday?: Dayjs;
  phoneNumber?: string;
  profileImage?: string;
};

const ProfilePage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [form] = Form.useForm<ProfileFormValues>();
  const navigate = useNavigate();

  const fillForm = (user: UserProfile) => {
    form.setFieldsValue({
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      birthday: user.birthday ? dayjs(user.birthday) : undefined,
      phoneNumber: user.phoneNumber || '',
      profileImage: user.profileImage || '',
    });
  };

  const fetchProfile = React.useCallback(async () => {
    try {
      setLoading(true);
      const user = await getMyProfileAPI();
      setProfile(user);
      fillForm(user);
    } catch (error: any) {
      if (handleAuthError(error, navigate, { notify: message.warning })) {
        return;
      }
      message.error(error?.response?.data?.error || 'Không thể tải thông tin tài khoản');
    } finally {
      setLoading(false);
    }
  }, [form, navigate]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onFinish = async (values: ProfileFormValues) => {
    try {
      setSaving(true);

      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        gender: values.gender,
        birthday: values.birthday ? values.birthday.toISOString() : undefined,
        phoneNumber: values.phoneNumber?.trim() || '',
        profileImage: values.profileImage?.trim() || '',
      };

      const updated = await updateMyProfileAPI(payload);
      setProfile(updated);
      fillForm(updated);
      message.success('Cập nhật thông tin thành công');
    } catch (error: any) {
      if (handleAuthError(error, navigate, { notify: message.warning })) {
        return;
      }
      message.error(error?.response?.data?.error || 'Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: RcFile) => {
    const fd = new FormData();
    fd.append('file', file);

    if (profile?._id) {
      // gửi cả 2 key để tương thích nếu BE đang đọc khác tên field
      fd.append('userId', profile._id);
      fd.append('userid', profile._id);
    }

    fd.append('imageType', 'avatar');

    try {
      setUploadingAvatar(true);
      const res = await axiosClient.post('/api/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const url = res.data?.url || res.data?.secure_url;
      if (!url) throw new Error('No url returned');

      form.setFieldValue('profileImage', url);
      message.success('Tải ảnh thành công');
      return url;
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Không thể tải ảnh lên');
      throw err;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const uploadBefore: UploadProps['beforeUpload'] = async (file) => {
    const isImage = file.type?.startsWith('image/');
    if (!isImage) {
      message.error('Chỉ hỗ trợ file ảnh');
      return Upload.LIST_IGNORE;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Ảnh phải nhỏ hơn 5MB');
      return Upload.LIST_IGNORE;
    }

    try {
      await handleUpload(file as RcFile);
    } catch {
      // đã notify ở handleUpload
    }

    // chặn Upload tự gửi request mặc định
    return Upload.LIST_IGNORE;
  };

  return (
    <ClientLayout>
      <div className="min-h-screen py-8 px-4 bg-[#1d3f73]">
        <div className="max-w-3xl mx-auto">
          <Card className="rounded-xl shadow-sm shadow-slate-400 border-0" styles={{ body: { padding: 24 } }}>
            <div className="flex items-center gap-3 mb-6">
              <UserOutlined className="text-2xl text-[#23A6F0]" />
              <div>
                <Title level={3} className="!mb-0 !text-[#23A6F0]">Thông tin tài khoản</Title>
                <Text type="secondary">Cập nhật thông tin cá nhân của bạn</Text>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-48">
                <Spin size="large" />
              </div>
            ) : (
              <Form layout="vertical" form={form} onFinish={onFinish}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Họ và tên lót"
                    name="lastName"
                    rules={[{ required: true, message: 'Vui lòng nhập họ và tên lót' }]}
                  >
                    <Input placeholder="Nhập họ và tên lót" maxLength={50} />
                  </Form.Item>

                  <Form.Item
                    label="Tên"
                    name="firstName"
                    rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                  >
                    <Input placeholder="Nhập tên" maxLength={30} />
                  </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Giới tính"
                    name="gender"
                    rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
                  >
                    <Select placeholder="Chọn giới tính">
                      <Select.Option value="male">Nam</Select.Option>
                      <Select.Option value="female">Nữ</Select.Option>
                      <Select.Option value="other">Khác</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Ngày sinh" name="birthday">
                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                  </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Email"
                    tooltip="Email được dùng để đăng nhập"
                  >
                    <Input value={profile?.email || ''} disabled />
                  </Form.Item>

                  <Form.Item label="Số điện thoại" name="phoneNumber">
                    <Input placeholder="Nhập số điện thoại" maxLength={20} />
                  </Form.Item>
                </div>

                <Form.Item label="Ảnh đại diện">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={form.getFieldValue('profileImage') || profile?.profileImage}
                      size={80}
                      icon={<UserOutlined />}
                    />
                    <div>
                      <Upload
                        accept="image/*"
                        showUploadList={false}
                        beforeUpload={uploadBefore}
                        maxCount={1}
                      >
                        <Button loading={uploadingAvatar}>Thay đổi hình đại diện</Button>
                      </Upload>

                      <Form.Item name="profileImage" noStyle>
                        <Input type="hidden" />
                      </Form.Item>
                    </div>
                  </div>
                </Form.Item>

                <div className="flex items-center justify-end gap-3 mt-2">
                  <Button onClick={() => profile && fillForm(profile)} disabled={saving}>
                    Đặt lại
                  </Button>
                  <Button type="primary" htmlType="submit" loading={saving} className="!bg-[#23A6F0]">
                    Lưu thay đổi
                  </Button>
                </div>
              </Form>
            )}
          </Card>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ProfilePage;
