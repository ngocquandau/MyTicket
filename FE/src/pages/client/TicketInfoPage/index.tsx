import React from 'react';
import { Card, Spin, Typography, Tag, Result, Button } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { getPaidTicketPublicInfoAPI } from '../../../services/purchaseService';
import logo from '../../../assets/myticket_logo.png';
import Barcode from 'react-barcode';

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
    <div className="min-h-screen p-4 md:p-6 flex items-center justify-center bg-[radial-gradient(circle_at_20%_20%,#e9f6ff_0%,#eef2f7_45%,#e5eaf2_100%)]">
      <Card className="w-full max-w-4xl rounded-[28px] shadow-[0_18px_60px_rgba(32,68,120,0.18)] border border-[#d8e4f2] overflow-hidden" bodyStyle={{ padding: 0 }}>
        <div className="relative">
          <div className="h-2 bg-gradient-to-r from-[#1a77d4] via-[#2aa7e7] to-[#66d0ff]" />

          <div className="absolute inset-0 pointer-events-none select-none z-0 flex items-center justify-center">
            <img
              src={logo}
              alt="MyTicket watermark"
              className="w-[86%] max-w-[560px] h-auto opacity-[0.12]"
            />
          </div>

          <div className="absolute -top-20 -left-24 w-72 h-40 rounded-full bg-[#45b3ff]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-24 w-72 h-40 rounded-full bg-[#1c75dd]/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 p-5 md:p-8">
            <div className="text-center mb-6 md:mb-2">
              <Title level={2} className="!mb-2 !text-[#1d84de] !tracking-wide">THÔNG TIN VÉ ĐIỆN TỬ</Title>
              <div className="flex justify-center">
                <Tag color="success" className="!m-0 !px-4 !py-1 !text-sm !font-semibold !rounded-full !border-[#8fda8f]">
                  ĐÃ THANH TOÁN
                </Tag>
              </div>
              <p className="mt-3 mb-0 text-[#4f6580] text-sm md:text-base">Vé hợp lệ để check-in tại cổng sự kiện</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-stretch">
              {infoRows.map((row) => (
                <div
                  key={row.label}
                  className="h-[112px] md:h-[85px] bg-white/86 backdrop-blur-[1px] border border-[#dbe7f3] rounded-xl px-4 py-3 shadow-[0_4px_10px_rgba(18,78,139,0.05)] flex flex-col justify-between"
                >
                  <div className="text-[14px] md:text-xs uppercase tracking-[0.08em] text-[#376fa2] font-bold mb-1">{row.label}</div>
                  <div className="text-[15px] md:text-[15px] text-[#13253c] break-words font-semibold leading-snug line-clamp-2">{row.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 bg-white/88 border border-[#dbe7f3] rounded-xl px-4 py-4 shadow-[0_4px_10px_rgba(18,78,139,0.05)]">
              <div className="text-center text-[10px] md:text-xs uppercase tracking-[0.08em] text-[#65809b] font-bold mb-3">
                Mã vạch check-in
              </div>
              <div className="flex justify-center overflow-x-auto">
                <Barcode
                  value={String(data.ticketId || '')}
                  format="CODE128"
                  width={1.5}
                  height={50}
                  displayValue={false}
                  background="transparent"
                  lineColor="#16304a"
                  margin={0}
                />
              </div>
              <div className="text-center mt-2">
                <Text copyable className="!text-[#16304a] !font-semibold !tracking-[0.04em]">
                  {data.ticketId}
                </Text>
              </div>
            </div>

            <div className="mt-6 text-center text-xs md:text-sm text-[#627890]">
              Mỗi mã vé chỉ được sử dụng một lần. Vui lòng không chia sẻ mã vé cho người khác.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TicketInfoPage;
