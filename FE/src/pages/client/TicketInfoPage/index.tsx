import React from 'react';
import { Card, Spin, Typography, Tag, Result, Button } from 'antd';
import { CalendarOutlined, CheckCircleFilled, CreditCardOutlined, EnvironmentOutlined, IdcardOutlined, QrcodeOutlined, TagOutlined } from '@ant-design/icons';
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
  const formatDateTime = (value?: string) => {
    if (!value) return 'Đang cập nhật';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Thời gian không hợp lệ';

    return `${date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })} • ${date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })}`;
  };

  const formatCurrency = (value?: number) => `${(value || 0).toLocaleString('vi-VN')} VND`;

  const eventStatus = (event.status || '').toLowerCase();
  const eventStatusMeta = eventStatus === 'completed'
    ? {
        label: 'Đã diễn ra',
        className: '!bg-amber-50 !text-amber-700 !border-amber-200'
      }
    : eventStatus === 'cancelled' || eventStatus === 'canceled'
      ? {
          label: 'Đã hủy',
          className: '!bg-rose-50 !text-rose-700 !border-rose-200'
        }
      : {
          label: 'Sắp diễn ra',
          className: '!bg-sky-50 !text-sky-700 !border-sky-200'
        };

  const primaryInlineFields = [
    {
      label: 'Mã vé',
      value: <Text copyable className="!text-[#13253c] !font-semibold">{data.ticketId}</Text>,
      icon: <IdcardOutlined className="text-[#1d84de]" />,
    },
    {
      label: 'Loại vé',
      value: data.ticketClass?.name || '—',
      icon: <TagOutlined className="text-[#1d84de]" />,
    },
    {
      label: 'Ghế / Khu vực',
      value: data.seat || 'Vé tự do',
      icon: <QrcodeOutlined className="text-[#1d84de]" />,
    },
  ];

  const secondaryInlineFields = [
    {
      label: 'Ngày mua',
      value: formatDateTime(data.payment?.purchasedAt),
      icon: <CalendarOutlined className="text-[#1d84de]" />,
    },
    {
      label: 'Tổng thanh toán',
      value: formatCurrency(data.payment?.totalAmount),
      icon: <CreditCardOutlined className="text-[#1d84de]" />,
    },
  ];

  const verticalStubHoles = Array.from({ length: 11 });
  const horizontalStubHoles = Array.from({ length: 14 });

  return (
    <div className="min-h-screen px-3 py-4 md:px-5 md:py-5 flex items-center justify-center bg-[radial-gradient(circle_at_20%_20%,#e9f6ff_0%,#eef2f7_45%,#e5eaf2_100%)]">
      <Card className="w-full max-w-6xl rounded-[28px] shadow-[0_22px_72px_rgba(32,68,120,0.16)] border border-[#d8e4f2] overflow-hidden" bodyStyle={{ padding: 0 }}>
        <div className="relative">
          <div className="h-2 bg-gradient-to-r from-[#1a77d4] via-[#2aa7e7] to-[#66d0ff]" />

          <div className="absolute -top-20 -left-24 w-72 h-40 rounded-full bg-[#45b3ff]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-24 w-72 h-40 rounded-full bg-[#1c75dd]/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 p-4 md:p-5 lg:p-6">
            <div className="rounded-[26px] border border-[#dbe7f3] bg-white/78 shadow-[0_18px_48px_rgba(32,68,120,0.1)] backdrop-blur-[2px] overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="relative overflow-hidden p-4 md:p-5 lg:p-6">
                  <div className="absolute inset-0 pointer-events-none select-none z-0 flex items-center justify-center overflow-hidden">
                    <div className="relative flex items-center justify-center w-[82%] max-w-[500px]">
                      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.88)_0%,rgba(231,239,249,0.42)_52%,transparent_76%)] blur-2xl" />
                      <img
                        src={logo}
                        alt=""
                        className="absolute w-full h-auto"
                        style={{
                          opacity: 0.08,
                          transform: 'translate(3px, 3px)',
                          filter: 'grayscale(1) brightness(0.78) blur(1px)',
                        }}
                      />
                      <img
                        src={logo}
                        alt=""
                        className="absolute w-full h-auto"
                        style={{
                          opacity: 0.12,
                          transform: 'translate(-2px, -2px)',
                          filter: 'grayscale(1) brightness(1.28) contrast(0.95) blur(0.35px)',
                        }}
                      />
                      <img
                        src={logo}
                        alt="MyTicket watermark"
                        className="relative w-full h-auto"
                        style={{
                          opacity: 0.15,
                          filter: 'grayscale(1) brightness(1.02) contrast(0.92) drop-shadow(0 1px 0 rgba(255,255,255,0.92)) drop-shadow(0 -1px 1px rgba(124,149,180,0.22))',
                        }}
                      />
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f2f8ff] border border-[#dbe7f3]">
                          <img src={logo} alt="MyTicket" className="h-8 w-8 object-contain" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-[#6486ab] font-bold">MyTicket E-Ticket</div>
                          <Title level={3} className="!mb-1 !mt-1 !text-[#173354] !leading-tight">Vé điện tử hợp lệ để check-in</Title>
                          <div className="text-sm text-[#56718c]">Xuất trình mã vé hoặc mã vạch tại cổng sự kiện.</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <Tag color="success" className="!m-0 !px-3 !py-1 !text-xs !font-semibold !rounded-full !border-[#8fda8f]">
                          ĐÃ THANH TOÁN
                        </Tag>
                        <Tag className={`!m-0 !px-3 !py-1 !text-xs !font-semibold !rounded-full ${eventStatusMeta.className}`}>
                          {eventStatusMeta.label}
                        </Tag>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[#dbe7f3] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(241,247,255,0.9))] px-4 py-4 shadow-[0_8px_24px_rgba(18,78,139,0.06)]">
                      <div className="flex flex-col gap-4">
                        <div className="rounded-[22px] border border-[#dbe7f3] bg-white/90 px-4 py-4 shadow-[0_5px_14px_rgba(18,78,139,0.04)]">
                          <div className="text-[10px] uppercase tracking-[0.16em] text-[#5d7ea3] font-bold mb-2">Sự kiện</div>
                          <Title level={3} className="!mb-0 !text-[#18324d] !leading-tight !text-[24px] md:!text-[28px]">
                            {event.title || 'Sự kiện không xác định'}
                          </Title>
                        </div>

                        <div className="rounded-[22px] border border-[#dbe7f3] bg-white/92 px-4 py-3.5 shadow-[0_5px_14px_rgba(18,78,139,0.04)]">
                          <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-x-6 gap-y-3">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef6ff] text-[#1d84de]">
                                <CalendarOutlined />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] uppercase tracking-[0.12em] text-[#6d88a5] font-bold mb-1">Thời gian</div>
                                <div className="text-[14px] font-semibold text-[#18324d] leading-snug">{formatDateTime(event.startDateTime)}</div>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef6ff] text-[#1d84de]">
                                <EnvironmentOutlined />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] uppercase tracking-[0.12em] text-[#6d88a5] font-bold mb-1">Địa điểm</div>
                                <div className="text-[14px] font-semibold text-[#18324d] leading-snug">{event.location?.address || 'Đang cập nhật địa điểm'}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[22px] border border-[#dbe7f3] bg-white/92 px-4 py-1.5 shadow-[0_5px_14px_rgba(18,78,139,0.05)]">
                          <div className="divide-y divide-[#e6eef8]">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-3">
                              {primaryInlineFields.map((row) => (
                                <div key={row.label} className="min-w-0">
                                  <div className="flex items-center gap-1.5 whitespace-nowrap text-[9px] md:text-[10px] uppercase tracking-[0.12em] text-[#5f7fa3] font-bold mb-1.5">
                                    {row.icon}
                                    <span>{row.label}</span>
                                  </div>
                                  <div className="text-[14px] md:text-[15px] text-[#13253c] break-words font-semibold leading-snug">{row.value}</div>
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-3 py-3">
                              {secondaryInlineFields.map((row) => (
                                <div key={row.label} className="min-w-0">
                                  <div className="flex items-center gap-1.5 whitespace-nowrap text-[9px] md:text-[10px] uppercase tracking-[0.12em] text-[#5f7fa3] font-bold mb-1.5">
                                    {row.icon}
                                    <span>{row.label}</span>
                                  </div>
                                  <div className={`text-[14px] md:text-[15px] break-words font-semibold leading-snug ${row.label === 'Tổng thanh toán' ? 'text-[#9a6700]' : 'text-[#13253c]'}`}>
                                    {row.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dbe7f3] bg-[#f7fbff] px-4 py-3 text-xs md:text-sm text-[#56718c]">
                      <div className="flex items-center gap-2">
                        <CheckCircleFilled className="text-[#1d84de]" />
                        <span>Mỗi mã vé chỉ được sử dụng một lần.</span>
                      </div>
                      <div>Vui lòng mở sẵn màn hình vé trước khi đến cổng.</div>
                    </div>
                  </div>
                </div>

                <div className="relative bg-[linear-gradient(180deg,#12345a_0%,#102843_100%)] p-4 md:p-5 text-white border-t lg:border-t-0 lg:border-l border-white/10">
                  <div className="lg:hidden pointer-events-none absolute left-5 right-5 top-0 -translate-y-1/2 flex items-center justify-between">
                    {horizontalStubHoles.map((_, index) => (
                      <span
                        key={`mobile-hole-${index}`}
                        className="h-4 w-4 rounded-full bg-[#eef2f7] border border-[#d8e4f2] shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)]"
                      />
                    ))}
                  </div>

                  <div className="hidden lg:flex pointer-events-none absolute left-0 top-5 bottom-5 -translate-x-1/2 flex-col items-center justify-between z-10">
                    {verticalStubHoles.map((_, index) => (
                      <span
                        key={`desktop-hole-${index}`}
                        className="h-5 w-5 rounded-full bg-[#eef2f7] border border-[#d8e4f2] shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)]"
                      />
                    ))}
                  </div>

                  <div className="hidden lg:block absolute left-0 top-6 bottom-6 border-l border-dashed border-white/20" />
                  <div className="flex h-full flex-col justify-between gap-4 lg:pl-4">
                    <div>
                      <div className="flex items-center gap-2 text-[#9dd7ff] text-[10px] md:text-xs uppercase tracking-[0.16em] font-bold mb-2">
                        <CheckCircleFilled />
                        Check-in stub
                      </div>
                      <Title level={4} className="!text-white !mb-1">Mã vạch xác thực vé</Title>
                      <p className="text-[#d6e6f6] text-sm leading-relaxed mb-0">Nhân viên có thể quét trực tiếp hoặc nhập mã vé thủ công.</p>
                    </div>

                    <div className="rounded-[24px] bg-white px-4 py-4 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
                      <div className="text-center text-[10px] uppercase tracking-[0.08em] text-[#65809b] font-bold mb-2.5">
                        Mã vạch check-in
                      </div>
                      <div className="flex justify-center overflow-x-auto">
                        <Barcode
                          value={String(data.ticketId || '')}
                          format="CODE128"
                          width={1.35}
                          height={56}
                          displayValue={false}
                          background="transparent"
                          lineColor="#16304a"
                          margin={0}
                        />
                      </div>
                      <div className="text-center mt-2.5">
                        <Text copyable className="!text-[#16304a] !font-semibold !tracking-[0.04em] !text-[13px] md:!text-[14px]">
                          {data.ticketId}
                        </Text>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-[#d7e6f5]">
                      <div className="rounded-2xl border border-white/10 bg-white/8 px-3.5 py-3">
                        <div className="font-semibold text-white mb-1">Lưu ý</div>
                        <div>Không chia sẻ mã vé cho người khác để tránh phát sinh check-in ngoài ý muốn.</div>
                      </div>
                      <div className="text-[12px] text-[#a9c4dd] text-center lg:text-left">
                        Vé điện tử được phát hành bởi MyTicket.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TicketInfoPage;
