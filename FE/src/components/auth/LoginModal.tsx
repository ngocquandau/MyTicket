import React, { useState } from 'react';
import { forgotPasswordAPI, loginAPI } from "../../services/authService";
import { saveToken, getUserRole, getUserFromToken } from "../../utils/auth";
import { getAllOrganizersAPI } from "../../services/organizerService";
import { message } from "antd";
import { Modal, Form, Input } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons';
import logo from '../../assets/myticket_logo.png';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
  onRegisterClick: () => void;
  onLoginSuccess?: (options?: { skipPendingRedirect?: boolean }) => void; // ✅ Thêm dòng này (dấu ? để là optional)
}

const FORGOT_PASSWORD_EMAIL_KEY = 'forgot_password_email_forced_profile';

const normalizeEmail = (email?: string) => (email || '').trim().toLowerCase();

const LoginModal: React.FC<Props> = ({ open, onClose, onRegisterClick, onLoginSuccess }) => {
  const [form] = Form.useForm();
  const [forgotForm] = Form.useForm();
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      const res = await loginAPI(values);
      saveToken(res.data.token); // Lưu token
      message.success("Đăng nhập thành công!");
      
      // Kiểm tra role và chuyển hướng
      const role = getUserRole();
        // Nếu là organizer thì cố gắng lấy organizerId và lưu vào localStorage
        if (role === 'organizer') {
          try {
            const payload = getUserFromToken();
            const userId = payload?.id;
            if (userId) {
              const organizers = await getAllOrganizersAPI();
              const found = organizers.find((o: any) => String(o.user) === String(userId));
              if (found) {
                localStorage.setItem('organizerId', found._id);
              }
            }
          } catch (e) {
            // Không bắt buộc — nếu không tìm được organizerId thì vẫn tiếp tục đăng nhập
            console.warn('Không thể lấy organizerId:', e);
          }
        }
      const forgotPasswordEmail = sessionStorage.getItem(FORGOT_PASSWORD_EMAIL_KEY);
      const shouldForceProfile =
        (role === 'user' || role === 'organizer' || role === 'admin') &&
        !!forgotPasswordEmail &&
        forgotPasswordEmail === normalizeEmail(values?.email);

      if (shouldForceProfile) {
        sessionStorage.removeItem(FORGOT_PASSWORD_EMAIL_KEY);
        navigate(
          role === 'organizer'
            ? '/organizer/profile'
            : role === 'admin'
              ? '/admin/settings'
              : '/profile'
        );
        message.info('Vui lòng đổi mật khẩu mới ngay sau khi đăng nhập.');
      } else if (role === 'admin') {
        navigate('/admin/events');
      } else if (role === 'organizer') {
        navigate('/organizer/events');
      } else {
        // user hoặc không có role, chuyển về home
        navigate('/');
      }

      if (onLoginSuccess) {
        onLoginSuccess({ skipPendingRedirect: shouldForceProfile }); // ✅ Gọi callback nếu có
      }
      
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.error || "Lỗi đăng nhập");
    }
  };

  const handleForgotPassword = async (values: { email: string }) => {
    try {
      setForgotLoading(true);
      const res = await forgotPasswordAPI(values);
      sessionStorage.setItem(FORGOT_PASSWORD_EMAIL_KEY, normalizeEmail(values.email));
      message.success(res?.data?.message || "Mật khẩu mới đã được gửi tới email của bạn");
      form.setFieldValue('email', values.email);
      forgotForm.resetFields();
      setForgotOpen(false);
    } catch (err: any) {
      message.error(err.response?.data?.message || "Không thể gửi mật khẩu mới");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={800} // Giảm width một chút cho cân đối
      closeIcon={<CloseOutlined className="text-gray-500" />}
      centered
    >
      <div className="flex flex-col md:flex-row"> {/* Responsive flex */}
        {/* Logo section */}
        <div className="w-full md:w-1/3 bg-[#E6F7FF] p-6 flex items-center justify-center rounded-l-lg">
          <div className="text-center">
            <img src={logo} alt="MyTicket Logo" className="w-32 mx-auto mb-4" onError={(e) => e.currentTarget.style.display='none'} />
          </div>
        </div>

        {/* Form section */}
        <div className="w-full md:w-2/3 p-8">
          <h2 className="text-2xl font-semibold text-center mb-6 text-[#23A6F0]">ĐĂNG NHẬP</h2>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="w-full"
            size="large"
          >
            <Form.Item 
              name="email" 
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' }
              ]}
            >
              <Input placeholder="Email" className="rounded-md" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password 
                placeholder="Mật khẩu"
                className="rounded-md"
                iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <div className="text-right -mt-2 mb-4">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-[#23A6F0] text-sm font-medium hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>

            <Form.Item className="mb-4">
              <button
                type="submit"
                className="w-full bg-[#23A6F0] text-white py-2 rounded-md hover:bg-[#1890ff] font-semibold transition-colors"
              >
                Đăng nhập
              </button>
            </Form.Item>

            <div className="text-center">
              <span className="text-gray-600">Chưa có tài khoản? </span>
              <button
                type="button"
                onClick={() => {
                  form.resetFields();
                  onRegisterClick();
                }}
                className="text-[#23A6F0] font-medium hover:underline"
              >
                Đăng ký ngay
              </button>
            </div>
          </Form>

          <Modal
            open={forgotOpen}
            onCancel={() => {
              setForgotOpen(false);
              forgotForm.resetFields();
            }}
            onOk={() => forgotForm.submit()}
            okText="Gửi mật khẩu mới"
            okButtonProps={{
              className: "!bg-[#23A6F0] !border-[#23A6F0] !text-white !font-semibold hover:!bg-[#1890ff] hover:!border-[#1890ff]"
            }}
            cancelText="Huỷ"
            confirmLoading={forgotLoading}
            title="Quên mật khẩu"
            centered
          >
            <p className="text-gray-600 mb-4">
              Nhập email đã đăng ký. Nếu email tồn tại, hệ thống sẽ gửi mật khẩu ngẫu nhiên mới.
            </p>
            <Form
              form={forgotForm}
              layout="vertical"
              onFinish={handleForgotPassword}
            >
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' }
                ]}
              >
                <Input placeholder="Nhập email của bạn" />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </div>
    </Modal>
  );
};

export default LoginModal;