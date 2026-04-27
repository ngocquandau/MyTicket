import React, { useEffect, useState } from 'react';
import OrganizerLayout from '../../../layouts/OrganizerLayout';
import axiosClient from '../../../services/axiosClient';
import { Descriptions, Spin, message, Button, Divider, Form, Input } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

const SettingPage: React.FC = () => {
  const [organizer, setOrganizer] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm] = Form.useForm();
  const [passwordValue, setPasswordValue] = useState('');

  // Các quy tắc kiểm tra mật khẩu
  const passwordRequirements = [
      { label: "Từ 8 - 32 ký tự", regex: /^.{8,32}$/ },
      { label: "Bao gồm chữ thường và số", regex: /(?=.*[a-z])(?=.*\d)/ },
      { label: "Bao gồm ký tự đặc biệt (!, $, @, %,...)", regex: /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/ },
      { label: "Có ít nhất 1 ký tự in hoa", regex: /(?=.*[A-Z])/ }
  ];

  const getRequirementStatus = (regex: RegExp) => regex.test(passwordValue);

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

  const handleChangePassword = async (values: { password: string; confirmPassword: string }) => {
    try {
      setChangingPassword(true);
      await axiosClient.put('/api/user/profile', { password: values.password.trim() });
      message.success('Đổi mật khẩu thành công');
      passwordForm.resetFields();
      setPasswordValue('');
      setShowChangePassword(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Không thể đổi mật khẩu.';
      message.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

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
          <>
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

            <Divider />

            <div className="mt-2 rounded-xl border border-[#dbe7f3] bg-[#f6fbff] p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Bảo mật tài khoản</h3>
                  <p className="text-gray-500 mb-0">Hãy đổi mật khẩu thường xuyên để tăng độ an toàn cho tài khoản organizer.</p>
                </div>
                {!showChangePassword ? (
                  <Button
                    type="primary"
                    className="!bg-[#23A6F0] hover:!bg-[#1890ff] !border-[#23A6F0] hover:!border-[#1890ff] !font-semibold !rounded-lg !h-10 !px-5"
                    onClick={() => setShowChangePassword(true)}
                  >
                    Đổi mật khẩu
                  </Button>
                ) : null}
              </div>

              {showChangePassword ? (
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handleChangePassword}
                  onValuesChange={(changedValues) => {
                      if (changedValues.password !== undefined) {
                          setPasswordValue(changedValues.password);
                      }
                  }}
                  className="max-w-[460px] mt-5"
                >
                  <Form.Item
                      name="password"
                      label="Mật khẩu mới"
                      style={{ marginBottom: 12 }}
                      rules={[
                          { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                          () => ({
                              validator(_, value) {
                                  if (!value) return Promise.resolve();
                                  const allMet = passwordRequirements.every(req => req.regex.test(value));
                                  if (!allMet) {
                                      return Promise.reject(new Error('Mật khẩu chưa đáp ứng đủ yêu cầu bảo mật'));
                                  }
                                  return Promise.resolve();
                              },
                          }),
                      ]}
                  >
                      <Input.Password placeholder="Nhập mật khẩu mới" className="!rounded-lg" />
                  </Form.Item>

                  {/* Bảng yêu cầu mật khẩu trực quan */}
                  <div className="mb-4 pl-2">
                      {passwordRequirements.map((req, index) => {
                          const isMet = getRequirementStatus(req.regex);
                          return (
                              <div key={index} className="flex items-center mb-1.5" style={{ color: isMet ? '#52c41a' : '#8c8c8c', fontSize: '13px' }}>
                                  {isMet ? (
                                      <CheckCircleFilled className="text-[#52c41a] mr-2 text-[14px]" />
                                  ) : (
                                      <div className="w-[14px] h-[14px] rounded-full bg-[#bfbfbf] text-white flex items-center justify-center text-[10px] font-bold mr-2">
                                          X
                                      </div>
                                  )}
                                  <span>{req.label}</span>
                              </div>
                          );
                      })}
                  </div>

                  <Form.Item
                    name="confirmPassword"
                    label="Xác nhận mật khẩu mới"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password placeholder="Nhập lại mật khẩu mới" className="!rounded-lg" />
                  </Form.Item>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={changingPassword}
                      className="!bg-[#23A6F0] hover:!bg-[#1890ff] !border-[#23A6F0] hover:!border-[#1890ff] !font-semibold !rounded-lg !h-10 !px-5"
                    >
                      Cập nhật mật khẩu
                    </Button>
                    <Button
                      className="!rounded-lg !h-10 !px-4"
                      onClick={() => {
                        setShowChangePassword(false);
                        passwordForm.resetFields();
                        setPasswordValue('');
                      }}
                    >
                      Hủy
                    </Button>
                  </div>
                </Form>
              ) : null}
            </div>
          </>
        )}
      </div>
    </OrganizerLayout>
  );
};

export default SettingPage;