import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, message, Spin } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import axiosClient from '../../services/axiosClient';

interface Props {
  open: boolean;
  email: string;
  onClose: () => void;
  onVerificationSuccess: () => void;
}

const OTPVerificationModal: React.FC<Props> = ({ 
  open, 
  email, 
  onClose, 
  onVerificationSuccess 
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!open) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  // Format thời gian hiển thị
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle verify OTP
  const handleVerify = async () => {
    if (!otp.trim()) {
      message.error('Vui lòng nhập mã OTP');
      return;
    }

    if (otp.trim().length !== 6) {
      message.error('Mã OTP phải gồm 6 chữ số');
      return;
    }

    try {
      setLoading(true);
      const response = await axiosClient.post('/api/user/verify-otp', {
        email,
        otp: otp.trim()
      });

      if (response.status === 200) {
        message.success('Email xác thực thành công!');
        setOtp('');
        onVerificationSuccess();
      }
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Xác thực OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    if (!canResend) return;

    try {
      setResendLoading(true);
      const response = await axiosClient.post('/api/user/resend-otp', {
        email
      });

      if (response.status === 200) {
        message.success('OTP mới đã được gửi!');
        setTimeLeft(600);
        setCanResend(false);
        setOtp('');
      }
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Gửi OTP lại thất bại');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
      closeIcon={<CloseOutlined className="text-gray-500" />}
      centered
      maskClosable={false}
    >
      <div className="text-center py-6">
        <h2 className="text-2xl font-semibold mb-2 text-[#23A6F0]">XÁC THỰC EMAIL</h2>
        <p className="text-gray-600 mb-6">
          Mã OTP đã được gửi đến <strong>{email}</strong>
        </p>

        {/* OTP Input */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-3">Nhập mã 6 chữ số:</p>
          <Input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            size="large"
            className="text-center text-2xl font-bold tracking-widest"
            style={{ letterSpacing: '10px' }}
            disabled={loading}
          />
        </div>

        {/* Timer */}
        <div className="mb-6">
          <p className="text-sm">
            Mã OTP hết hạn trong:{' '}
            <span className={timeLeft <= 60 ? 'text-red-500 font-bold' : 'text-[#23A6F0] font-bold'}>
              {formatTime(timeLeft)}
            </span>
          </p>
        </div>

        {/* Verify Button */}
        <Button
          type="primary"
          size="large"
          className="w-full mb-3 h-10 bg-[#23A6F0] border-[#23A6F0]"
          onClick={handleVerify}
          loading={loading}
          disabled={!otp || otp.length !== 6}
        >
          Xác Thực
        </Button>

        {/* Resend OTP */}
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Không nhận được mã?{' '}
            <Button
              type="link"
              className="p-0 h-auto text-[#23A6F0]"
              onClick={handleResend}
              disabled={!canResend}
              loading={resendLoading}
            >
              {canResend ? 'Gửi lại' : `Gửi lại sau ${Math.ceil(timeLeft / 60)}p`}
            </Button>
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default OTPVerificationModal;
