import React from 'react';
import { loginAPI } from "../../services/authService";
import { saveToken } from "../../utils/auth";
import { message } from "antd";
import { Modal, Form, Input } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons';
import logo from '../../assets/myticket_logo.png';

interface Props {
  open: boolean;
  onClose: () => void;
  onRegisterClick: () => void;
  onLoginSuccess?: () => void; // ✅ Thêm dòng này (dấu ? để là optional)
}

const LoginModal: React.FC<Props> = ({ open, onClose, onRegisterClick, onLoginSuccess }) => {
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      const res = await loginAPI(values);
      saveToken(res.data.token); // Lưu token
      message.success("Đăng nhập thành công!");
      
      if (onLoginSuccess) {
        onLoginSuccess(); // ✅ Gọi callback nếu có
      }
      
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.error || "Lỗi đăng nhập");
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
            <h3 className="text-[#23A6F0] font-bold text-xl">MyTicket</h3>
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
        </div>
      </div>
    </Modal>
  );
};

export default LoginModal;