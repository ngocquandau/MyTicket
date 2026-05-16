import React, { useState } from 'react';
import { registerAPI } from "../../services/authService";
import { message } from "antd";
import { Modal, Form, Input, DatePicker, Select } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined, CloseOutlined, CheckCircleFilled } from '@ant-design/icons';
import logo from '../../assets/myticket_logo.png';
import dayjs from "dayjs";
import { validateEmail, validatePhoneNumber, validateName, validateAge, getValidationErrorMessage } from '../../utils/validationUtils';
import OTPVerificationModal from './OTPVerificationModal';

interface Props {
  open: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

const RegisterModal: React.FC<Props> = ({ open, onClose, onLoginClick }) => {
  const [form] = Form.useForm();
  const [passwordValue, setPasswordValue] = useState('');
  const [isOTPOpen, setIsOTPOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Các quy tắc kiểm tra mật khẩu
  const passwordRequirements = [
    { label: "Từ 8 - 32 ký tự", regex: /^.{8,32}$/ },
    { label: "Bao gồm chữ thường và số", regex: /(?=.*[a-z])(?=.*\d)/ },
    { label: "Bao gồm ký tự đặc biệt (!, $, @, %,...)", regex: /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/ },
    { label: "Có ít nhất 1 ký tự in hoa", regex: /(?=.*[A-Z])/ }
  ];

  const getRequirementStatus = (regex: RegExp) => regex.test(passwordValue);

  // =============================
  // Submit Register
  // =============================
  const onFinish = async (values: any) => {
    try {
      if (values.password !== values.confirmPassword) {
        message.error("Mật khẩu xác nhận không khớp!");
        return;
      }

      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        gender: values.gender,
        birthday: values.birthDate ? dayjs(values.birthDate).toISOString() : null,
        email: values.email,
        phoneNumber: values.phone || "",
        password: values.password,

        // BE yêu cầu location => tạm set mặc định, FE chưa có map
        location: {
          type: "Point",
          coordinates: [0, 0],
        }
      };

      const res = await registerAPI(payload);

      if (res.status === 201) {
        message.success("Đăng ký thành công! Vui lòng xác thực email.");
        setRegisteredEmail(values.email);
        setIsOTPOpen(true);
        form.resetFields();
        setPasswordValue('');
      }
    } catch (err: any) {
      message.error(err.response?.data?.error || "Đăng ký thất bại");
    }
  };

  const handleOTPVerificationSuccess = () => {
    message.success('Email đã xác thực thành công! Bạn có thể đăng nhập ngay.');
    setIsOTPOpen(false);
    setRegisteredEmail('');
    onLoginClick();
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={() => {
          form.resetFields();
          setPasswordValue('');
          onClose();
        }}
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
            
            <Form 
              form={form} 
              layout="vertical" 
              onFinish={onFinish}
              onValuesChange={(changedValues) => {
                if (changedValues.password !== undefined) {
                  setPasswordValue(changedValues.password);
                }
              }}
            >
              {/* Personal Information Section */}
              <div className="mb-6">
                <h3 className="font-medium mb-4">Thông tin cá nhân *</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item 
                    name="lastName" 
                    rules={[
                      { required: true, message: 'Vui lòng nhập họ' },
                      {
                        validator(_, value) {
                          if (!value) return Promise.resolve();
                          if (!validateName(value)) {
                            return Promise.reject(new Error(getValidationErrorMessage('lastName')));
                          }
                          return Promise.resolve();
                        },
                      }
                    ]}
                  >
                    <Input placeholder="Họ và tên lót" />
                  </Form.Item>
                  <Form.Item 
                    name="firstName" 
                    rules={[
                      { required: true, message: 'Vui lòng nhập tên' },
                      {
                        validator(_, value) {
                          if (!value) return Promise.resolve();
                          if (!validateName(value)) {
                            return Promise.reject(new Error(getValidationErrorMessage('firstName')));
                          }
                          return Promise.resolve();
                        },
                      }
                    ]}
                  >
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

                  <Form.Item 
                    name="birthDate"
                    rules={[
                      {
                        validator(_, value) {
                          if (!value) return Promise.resolve();
                          if (!validateAge(value)) {
                            return Promise.reject(new Error(getValidationErrorMessage('birthDate')));
                          }
                          return Promise.resolve();
                        },
                      }
                    ]}
                  >
                    <DatePicker 
                      placeholder="Ngày sinh: dd/mm/yyyy"
                      format="DD/MM/YYYY"
                      className="w-full"
                      defaultPickerValue={dayjs().subtract(16, 'years')}
                      disabledDate={(current) => {
                        if (!current) return false;
                        // Chỉ cho phép chọn ngày sao cho đủ 16 tuổi
                        const today = dayjs();
                        const minDate = today.subtract(16, 'years');
                        return current.isAfter(minDate, 'day');
                      }}
                    />
                  </Form.Item>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item 
                    name="phone"
                    rules={[
                      {
                        validator(_, value) {
                          if (!value) return Promise.resolve();
                          if (!validatePhoneNumber(value)) {
                            return Promise.reject(new Error(getValidationErrorMessage('phone')));
                          }
                          return Promise.resolve();
                        },
                      }
                    ]}
                  >
                    <Input placeholder="Số điện thoại" />
                  </Form.Item>
                </div>
              </div>

              {/* Account Information Section */}
              <div className="mb-6">
                <h3 className="font-medium mb-4">Thông tin tài khoản *</h3>

                <Form.Item 
                  name="email" 
                  rules={[
                    { required: true, message: 'Vui lòng nhập Email' },
                    {
                      validator(_, value) {
                        if (!value) return Promise.resolve();
                        if (!validateEmail(value)) {
                          return Promise.reject(new Error(getValidationErrorMessage('email')));
                        }
                        return Promise.resolve();
                      },
                    }
                  ]}
                >
                  <Input placeholder="Địa chỉ Email" />
                </Form.Item>

                <Form.Item 
                  name="password" 
                  style={{ marginBottom: 12 }}
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu' },
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
                  <Input.Password
                    placeholder="Mật khẩu"
                    iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                  />
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

                <Form.Item name="confirmPassword" rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu' },
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
                  <Input.Password
                    placeholder="Xác nhận mật khẩu"
                    iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>
              </div>

              <Form.Item>
                <button
                  type="submit"
                  className="w-full bg-[#23A6F0] text-white py-2 rounded hover:bg-[#1890ff] transition-colors font-medium"
                >
                  Đăng ký
                </button>
              </Form.Item>

              <div className="text-center">
                <span className="text-gray-600">Đã có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => { 
                    form.resetFields(); 
                    setPasswordValue('');
                    onLoginClick(); 
                  }}
                  className="text-[#23A6F0] hover:underline font-medium"
                >
                  Đăng nhập
                </button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        open={isOTPOpen}
        email={registeredEmail}
        onClose={() => {
          setIsOTPOpen(false);
          setRegisteredEmail('');
          onClose();
        }}
        onVerificationSuccess={handleOTPVerificationSuccess}
      />
    </>
  );
};

export default RegisterModal;