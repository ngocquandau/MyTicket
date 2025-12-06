import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import ClientLayout from '../../../layouts/ClientLayout';
import { getPurchaseByIdAPI } from '../../../services/purchaseService';

const PaymentResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleResult = async () => {
      const params = new URLSearchParams(location.search);
      const resultCode = params.get('resultCode');
      const orderId = params.get('orderId'); // Format: purchaseId_timestamp

      if (!orderId) {
        message.error('Thông tin đơn hàng không hợp lệ');
        navigate('/');
        return;
      }

      // Lấy purchaseId thật từ orderId
      const purchaseId = orderId.split('_')[0];

      if (resultCode === '0') {
        // --- TH1: Thành công ---
        message.success('Thanh toán thành công!');
        navigate('/my-tickets'); // Chuyển sang trang vé của tôi
      } else {
        // --- TH2: Thất bại ---
        message.error('Thanh toán thất bại hoặc bị hủy.');
        try {
          // Gọi API lấy thông tin đơn hàng để biết Event ID
          const purchase = await getPurchaseByIdAPI(purchaseId);
          if (purchase && purchase.event) {
            // Chuyển về trang chi tiết sự kiện
            navigate(`/event/${purchase.event}`);
          } else {
            navigate('/');
          }
        } catch (error) {
          console.error(error);
          navigate('/');
        }
      }
      setLoading(false);
    };

    handleResult();
  }, [location, navigate]);

  return (
    <ClientLayout>
      <div className="h-screen flex items-center justify-center">
        {loading && <Spin size="large" tip="Đang xử lý kết quả thanh toán..." />}
      </div>
    </ClientLayout>
  );
};

export default PaymentResultPage;