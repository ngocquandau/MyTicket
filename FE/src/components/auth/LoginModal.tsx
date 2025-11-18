import React from 'react';
import { Modal, Form, Input } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons';
import logo from '../../assets/myticket_logo.png';

interface Props {
  open: boolean;
  onClose: () => void;
  onRegisterClick: () => void;
}

const LoginModal: React.FC<Props> = ({ open, onClose, onRegisterClick }) => {
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    // mock login - will integrate with API later
    console.log('Login attempt:', values);
    onClose();
  };

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
        <div className="w-1/3 bg-[#E6F7FF] p-2 flex items-center justify-center">
          <div className="text-center">
            <img src={logo} alt="MyTicket Logo" className="w-40 mx-auto mb-4" />
          </div>
        </div>

        {/* Form section - Right side */}
        <div className="w-2/3 p-2">
          <h2 className="text-xl font-semibold text-center mb-6">ĐĂNG NHẬP</h2>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="max-w-md mx-auto"
          >
            <div className="mb-6">
              <h3 className="font-medium mb-4">Thông tin tài khoản *</h3>
              
              <Form.Item 
                name="email" 
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' }
                ]}
              >
                <Input 
                  placeholder="Địa chỉ Email" 
                  size="large"
                  className="rounded"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
              >
                <Input.Password 
                  placeholder="Mật khẩu"
                  size="large"
                  className="rounded"
                  iconRender={visible => (
                    visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                  )}
                />
              </Form.Item>
            </div>

            <Form.Item className="mb-2">
              <button
                type="submit"
                className="w-full bg-[#23A6F0] text-white py-2 rounded hover:bg-[#1890ff] transition-colors h-10"
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
                className="text-[#23A6F0] hover:underline"
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