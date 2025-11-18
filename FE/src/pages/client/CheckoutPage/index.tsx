import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography, Button, Input, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  MinusOutlined,
  PlusOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import ClientLayout from '../../../layouts/ClientLayout';
import { formatEventDate, formatEventTimeRange } from '../../../data/mockEvents';

const { Title, Text } = Typography;

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as {
    state?: { event?: any; ticket?: { type: string; price: string | number } };
  };

  const event = state?.event;
  const ticket = state?.ticket;

  React.useEffect(() => {
    if (!event || !ticket) {
      navigate('/', { replace: true });
    }
  }, [event, ticket, navigate]);

  if (!event || !ticket) return null;

  const priceNumber = React.useMemo(
    () => parseInt(String(ticket.price).replace(/[^\d]/g, '')) || 0,
    [ticket.price]
  );

  const [qty, setQty] = React.useState(1);
  const [voucher, setVoucher] = React.useState('');
  const [discount, setDiscount] = React.useState(0);

  const applyVoucher = () => {
    const code = voucher.trim().toUpperCase();
    let d = 0;
    if (code === 'MYTICKET10') d = Math.floor(priceNumber * qty * 0.1);
    else if (code === 'GIAM50K') d = 50000;
    else d = 0;
    setDiscount(Math.min(d, priceNumber * qty));
  };

  const minus = () => setQty((q) => Math.max(1, q - 1));
  const plus = () => setQty((q) => Math.min(99, q + 1));

  const subtotal = priceNumber * qty;
  const total = Math.max(0, subtotal - discount);

  const timeRange = formatEventTimeRange(event.startDateTime, event.endDateTime);
  const dateDisplay = formatEventDate(event.startDateTime);

  const money = (n: number) => n.toLocaleString('vi-VN');

  return (
    <ClientLayout>
      <div className="bg-gradient-to-b from-[#F4FAFF] to-white">
        <div className="container mx-auto px-6 py-6">
          {/* Top bar */}
          <button
            className="flex items-center gap-2 text-[#23A6F0] hover:text-[#1890ff] mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftOutlined className="text-lg" />
            <span className="font-medium">Trở về</span>
          </button>

          {/* Title */}
          <div className="flex items-center justify-between mb-3">
            <Title level={2} className="!text-[#E04646] !mb-0 uppercase">{event.title}</Title>
            <Tag color="blue" className="h-fit">Thanh toán</Tag>
          </div>
          <div className="border-t border-dotted border-gray-300 mb-6" />

          {/* Grid layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left content */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Event card */}
              <div className="bg-white border rounded-xl p-5 shadow-sm">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-4">
                    <div className="w-full h-44 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img
                        src={event.posterURL}
                        alt={event.title}
                        className="block w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-8">
                    <div className="flex items-center gap-3 text-gray-700 mb-3">
                      <CalendarOutlined className="text-gray-600" />
                      <Text>{timeRange}, {dateDisplay}</Text>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <EnvironmentOutlined className="text-gray-600" />
                      <Text>{event.location?.address}, {event.location?.city}</Text>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket selection */}
              <div className="bg-white border rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[#23A6F0] text-lg font-semibold">{ticket.type}</div>
                    <div className="text-[#E04646]">{money(priceNumber)} VND</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      shape="circle"
                      onClick={minus}
                      disabled={qty <= 1}
                      icon={<MinusOutlined />}
                    />
                    <div className="w-12 text-center border rounded-md py-1 font-medium">{qty}</div>
                    <Button
                      shape="circle"
                      onClick={plus}
                      icon={<PlusOutlined />}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right summary */}
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-white border rounded-xl p-5 shadow-sm lg:sticky lg:top-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCartOutlined className="text-[#23A6F0]" />
                  <Title level={4} className="!m-0">Tóm tắt đơn hàng</Title>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Loại vé</span>
                    <span className="font-medium">{ticket.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Đơn giá</span>
                    <span className="font-medium">{money(priceNumber)} VND</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số lượng</span>
                    <span className="font-medium">{qty}</span>
                  </div>
                  <div className="border-t border-dotted my-2" />
                  <div className="flex justify-between">
                    <span>Tạm tính</span>
                    <span className="font-semibold">{money(subtotal)} VND</span>
                  </div>

                  {/* Voucher */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <GiftOutlined className="text-amber-500" />
                      <span className="font-medium">Mã giảm giá</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Nhập mã (MYTICKET10 / GIAM50K)"
                        value={voucher}
                        onChange={(e) => setVoucher(e.target.value)}
                      />
                      <Button onClick={applyVoucher}>Áp dụng</Button>
                    </div>
                    {discount > 0 && (
                      <div className="mt-2 text-green-600 text-sm">
                        Đã áp dụng: -{money(discount)} VND
                      </div>
                    )}
                  </div>
                  <div className="border-t border-dotted my-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold">TỔNG TIỀN</span>
                    <span className="text-xl font-bold text-[#23A6F0]">{money(total)} VND</span>
                  </div>
                </div>

                <Button
                  type="primary"
                  className="!bg-[#22C55E] w-full !h-11 mt-5"
                >
                  Xác nhận thanh toán
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default CheckoutPage;