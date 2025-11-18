import React from 'react';
import { Modal, Form, Input, DatePicker, Select } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons';
import logo from '../../assets/myticket_logo.png';

interface Props {
  open: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

const RegisterModal: React.FC<Props> = ({ open, onClose, onLoginClick }) => {
  const [form] = Form.useForm();

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      closeIcon={<CloseOutlined className="text-gray-500" />}
      centered
    >
      <div className="flex">
        {/* Logo section - Left side */}
        <div className="w-1/3 bg-[#E6F7FF] flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <img src={logo} alt="MyTicket Logo" className="w-40 mx-auto mb-4" />
          </div>
        </div>

        {/* Form section - Right side */}
        <div className="w-2/3 p-4">
          <h2 className="text-xl font-semibold text-center mb-6">TẠO TÀI KHOẢN</h2>
          
          <Form form={form} layout="vertical">
            {/* Personal Information Section */}
            <div className="mb-6">
              <h3 className="font-medium mb-4">Thông tin cá nhân *</h3>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="lastName" rules={[{ required: true }]}>
                  <Input placeholder="Họ và tên lót" />
                </Form.Item>
                <Form.Item name="firstName" rules={[{ required: true }]}>
                  <Input placeholder="Tên" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="gender">
                  <Select placeholder="Giới tính">
                    <Select.Option value="male">Nam</Select.Option>
                    <Select.Option value="female">Nữ</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item name="birthDate">
                  <DatePicker placeholder="Ngày sinh: dd/mm/yyyy" format="DD/MM/YYYY" className="w-full" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="phone">
                  <Input placeholder="Số điện thoại" />
                </Form.Item>
                <Form.Item name="idCard">
                  <Input placeholder="Số CCCD" />
                </Form.Item>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="mb-6">
              <h3 className="font-medium mb-4">Thông tin tài khoản *</h3>
              <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="Địa chỉ Email" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true }]}>
                <Input.Password 
                  placeholder="Mật khẩu"
                  iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>
              <Form.Item name="confirmPassword" rules={[{ required: true }]}>
                <Input.Password 
                  placeholder="Xác nhận mật khẩu"
                  iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>
            </div>

            <Form.Item>
              <button className="w-full bg-[#23A6F0] text-white py-2 rounded hover:bg-[#1890ff] transition-colors">
                Đăng ký
              </button>
            </Form.Item>

            <div className="text-center">
              <span className="text-gray-600">Đã có tài khoản? </span>
              <button
                type="button"
                onClick={() => { form.resetFields(); onLoginClick(); }}
                className="text-[#23A6F0] hover:underline"
              >
                Đăng nhập
              </button>
            </div>
          </Form>
        </div>
      </div>
    </Modal>
  );
};

export default RegisterModal;