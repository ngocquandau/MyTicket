import React from 'react';
import { Card, Spin, Typography, Tag, Result, Button } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { getPaidTicketPublicInfoAPI } from '../../../services/purchaseService';

const { Title, Text } = Typography;

const TicketInfoPage: React.FC = () => {
  const { ticketId = '' } = useParams();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const loadTicket = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getPaidTicketPublicInfoAPI(ticketId);
        setData(res);
      } catch (err: any) {
        const msg = err?.response?.data?.error || 'Không thể xác thực thông tin vé';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) {
      loadTicket();
    } else {
      setLoading(false);
      setError('Mã vé không hợp lệ');
    }
  }, [ticketId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" tip="Đang tải thông tin vé..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Result
          status="warning"
          title="Không thể hiển thị thông tin vé"
          subTitle={error || 'Vui lòng kiểm tra lại mã QR'}
          extra={<Link to="/"><Button type="primary">Về trang chủ</Button></Link>}
        />
      </div>
    );
  }

  const event = data.event || {};

  const infoRows = [
    { label: 'Mã vé', value: <Text copyable>{data.ticketId}</Text> },
    { label: 'Loại vé', value: data.ticketClass?.name || '—' },
    { label: 'Ghế', value: data.seat || 'Vé tự do' },
    { label: 'Sự kiện', value: event.title || '—' },
    {
      label: 'Thời gian',
      value: event.startDateTime ? new Date(event.startDateTime).toLocaleString('vi-VN') : '—',
    },
    { label: 'Địa điểm', value: event.location?.address || 'Đang cập nhật địa điểm' },
    {
      label: 'Tổng thanh toán',
      value: `${(data.payment?.totalAmount || 0).toLocaleString('vi-VN')} VND`,
    },
    {
      label: 'Ngày mua',
      value: data.payment?.purchasedAt ? new Date(data.payment.purchasedAt).toLocaleString('vi-VN') : '—',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl rounded-2xl shadow-sm">
        <div className="text-center mb-5">
          <Title level={3} className="!mb-2 !text-[#23A6F0]">THÔNG TIN VÉ</Title>
          <Tag color="success" className="px-3 py-1 text-sm font-medium">ĐÃ THANH TOÁN</Tag>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {infoRows.map((row) => (
            <div key={row.label} className="bg-[#F8FAFC] border border-gray-100 rounded-lg px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">{row.label}</div>
              <div className="text-[15px] text-gray-800 break-words font-medium leading-snug">{row.value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TicketInfoPage;
