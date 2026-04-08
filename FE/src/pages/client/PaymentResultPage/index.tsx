import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import ClientLayout from '../../../layouts/ClientLayout';
import { getPurchaseByIdAPI, cancelPurchaseAPI } from '../../../services/purchaseService';

const PaymentResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleResult = async () => {
      const params = new URLSearchParams(location.search);
      const resultCode = params.get('resultCode');
      const orderId = params.get('orderId'); // URL trả về của PayOS đã đính kèm orderId là purchase._id gốc

      if (!orderId) {
        message.error('Thông tin đơn hàng không hợp lệ');
        navigate('/');
        return;
      }

      // Lấy purchaseId thật từ orderId
      const purchaseId = orderId; 

      if (resultCode === '0') {
        // --- TH1: Thành công ---
        message.success('Thanh toán thành công!');
        navigate('/my-tickets'); // Chuyển sang trang vé của tôi
      } else {
        // --- TH2: Thất bại hoặc bị người dùng chủ động Hủy ---
        message.error('Thanh toán thất bại hoặc đã bị hủy. Hệ thống đang hoàn trả vé...');
        try {
          // GỌI API HỦY ĐƠN VÀ NHẢ VÉ TRƯỚC KHI ĐIỀU HƯỚNG
          await cancelPurchaseAPI(purchaseId);

          // Gọi API lấy thông tin đơn hàng để biết Event ID nhằm trả về đúng trang sự kiện
          const purchase = await getPurchaseByIdAPI(purchaseId);
          if (purchase && purchase.event) {
            navigate(`/event/${purchase.event}`);
          } else {
            navigate('/');
          }
        } catch (error) {
          console.error("Lỗi khi gọi API nhả vé:", error);
          navigate('/');
        }
      }
      setLoading(false);
    };

    handleResult();
  }, [location, navigate]);

  return (
    <ClientLayout >
      <div className="h-screen flex items-center justify-center">
        {loading && <Spin size="large" tip="Đang xử lý kết quả thanh toán..." />}
      </div>
    </ClientLayout>
  );
};

export default PaymentResultPage;