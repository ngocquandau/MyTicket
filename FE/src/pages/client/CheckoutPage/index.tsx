import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography, Button, Input, Tag, message, Spin, Select, Modal } from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  MinusOutlined,
  PlusOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  ExclamationCircleOutlined // Icon cảnh báo
} from '@ant-design/icons';
import ClientLayout from '../../../layouts/ClientLayout';
import { createPaymentUrlAPI, createPurchaseAPI } from '../../../services/purchaseService';

const { Title, Text } = Typography;
const { confirm } = Modal; // Sử dụng Modal.confirm của Ant Design

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location as {
    state?: { 
      event?: any; 
      ticketInfo?: { 
        type: string; 
        price: string | number; 
        ticketClassId: string; 
        isReserved?: boolean;
        availableSeats?: { _id: string, seat: string, isSold: boolean }[]; 
      } 
    };
  };

  const event = state?.event;
  const ticket = state?.ticketInfo;
  
  const isReserved = ticket?.isReserved;
  const availableSeats = ticket?.availableSeats?.filter((s) => !s.isSold) || [];

  const [loading, setLoading] = React.useState(false);
  const [qty, setQty] = React.useState(1);
  const [selectedSeats, setSelectedSeats] = React.useState<string[]>([]);
  const [voucher, setVoucher] = React.useState('');
  const [discount, setDiscount] = React.useState(0);

  React.useEffect(() => {
    if (!event || !ticket) {
      message.error("Dữ liệu vé không hợp lệ, vui lòng chọn lại.");
      navigate('/', { replace: true });
    }
  }, [event, ticket, navigate]);

  React.useEffect(() => {
    if (isReserved) {
        setQty(selectedSeats.length);
    }
  }, [selectedSeats, isReserved]);

  if (!event || !ticket) return null;

  const priceNumber = parseInt(String(ticket.price).replace(/[^\d]/g, '')) || 0;

  const applyVoucher = () => {
    const code = voucher.trim().toUpperCase();
    let d = 0;
    if (code === 'MYTICKET10') d = Math.floor(priceNumber * qty * 0.1);
    else if (code === 'GIAM50K') d = 50000;
    
    setDiscount(Math.min(d, priceNumber * qty));
    if(d > 0) message.success("Áp dụng mã giảm giá thành công!");
    else message.warning("Mã giảm giá không hợp lệ");
  };

  const minus = () => setQty((q) => Math.max(1, q - 1));
  const plus = () => setQty((q) => Math.min(ticket.isReserved ? availableSeats.length : 10, q + 1));

  const subtotal = priceNumber * qty;
  const total = Math.max(0, subtotal - discount);
  const money = (n: number) => n.toLocaleString('vi-VN');

  // --- Hàm xử lý thanh toán chính (gọi API) ---
  const processPayment = async () => {
    try {
      setLoading(true);

      const purchaseRes = await createPurchaseAPI({
        ticketClassId: ticket.ticketClassId,
        quantity: qty,
        selectedTicketIds: isReserved ? selectedSeats : [],
        paymentMethod: 'Momo',
        voucherCode: voucher
      });

      if (!purchaseRes || !purchaseRes.purchaseId) {
        throw new Error("Không thể tạo đơn hàng");
      }

      message.loading("Đang chuyển hướng sang cổng thanh toán...", 1);

      const paymentRes = await createPaymentUrlAPI({
        purchaseId: purchaseRes.purchaseId,
        paymentMethodType: 'Napas'
      });

      if (paymentRes && paymentRes.payUrl) {
        window.location.href = paymentRes.payUrl;
      } else {
        throw new Error("Không nhận được link thanh toán");
      }

    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || "Lỗi thanh toán";
      message.error(errorMsg);
      setLoading(false); // Tắt loading nếu lỗi
    }
  };

  // --- Hàm kiểm tra và xác nhận trước khi thanh toán ---
  const handleCheckoutClick = () => {
    // 1. Kiểm tra Token
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning("Vui lòng đăng nhập để mua vé");
      navigate('/login'); 
      return;
    }

    // 2. Validate dữ liệu
    if (isReserved && selectedSeats.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 ghế!");
      return;
    }
    if (!isReserved && qty <= 0) {
      message.warning("Số lượng vé không hợp lệ!");
      return;
    }

    // 3. Kiểm tra Độ tuổi (Age Limit)
    if (event.ageLimit && event.ageLimit > 0) {
      confirm({
        title: 'Lưu ý về độ tuổi',
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        content: (
          <div className="py-2">
            <p className="text-base">Sự kiện này dành cho khán giả từ <span className="font-bold text-red-500">{event.ageLimit} tuổi</span> trở lên.</p>
            <p className="text-gray-500 text-sm mt-2">Bằng việc nhấn "Tiếp tục", bạn xác nhận rằng mình hoặc người tham dự đáp ứng đủ điều kiện về độ tuổi này.</p>
          </div>
        ),
        okText: 'Tôi đã hiểu và Tiếp tục',
        cancelText: 'Quay lại',
        okButtonProps: { className: '!bg-[#22C55E] hover:!bg-[#1ea851]' },
        onOk() {
          processPayment(); // Người dùng đồng ý -> Gọi API
        },
        onCancel() {
          // Người dùng hủy -> Không làm gì (đóng modal)
        },
        centered: true,
      });
    } else {
      // Không có giới hạn tuổi -> Thanh toán luôn
      processPayment();
    }
  };

  const timeRange = `${new Date(event.startDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.endDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  const dateDisplay = new Date(event.startDateTime).toLocaleDateString('vi-VN');
  const address = event.location?.address || 'Đang cập nhật';

  return (
    <ClientLayout>
      <div className="bg-gradient-to-b from-[#F4FAFF] to-white min-h-screen">
        <div className="container mx-auto px-6 py-6">
          <button className="flex items-center gap-2 text-[#23A6F0] mb-4" onClick={() => navigate(-1)}>
            <ArrowLeftOutlined /> <span className="font-medium">Trở về</span>
          </button>

          <div className="flex items-center justify-between mb-3">
            <Title level={2} className="!text-[#E04646] !mb-0 uppercase">{event.title}</Title>
            <Tag color="blue" className="h-fit text-sm px-3 py-1">Thanh toán an toàn</Tag>
          </div>
          <div className="border-t border-dotted border-gray-300 mb-6" />

          <Spin spinning={loading} tip="Đang xử lý giao dịch...">
            <div className="grid grid-cols-12 gap-6">
              {/* Left Content */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                {/* Event Info */}
                <div className="bg-white border rounded-xl p-5 shadow-sm">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-4">
                        <img src={event.posterURL} alt={event.title} className="w-full h-44 rounded-lg object-contain bg-gray-100" />
                    </div>
                    <div className="col-span-12 md:col-span-8">
                      <div className="flex items-center gap-3 text-gray-700 mb-3">
                        <CalendarOutlined className="text-gray-600 text-lg" />
                        <Text className="text-base">{timeRange}, {dateDisplay}</Text>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <EnvironmentOutlined className="text-gray-600 text-lg" />
                        <Text className="text-base">{address}</Text>
                      </div>
                      {/* Hiển thị Age Limit ở đây để user dễ thấy */}
                      {event.ageLimit > 0 && (
                         <div className="mt-3">
                             <Tag color="warning" className="text-sm px-3 py-1 border-orange-300 text-orange-600 font-medium">
                                 ⚠️ Giới hạn độ tuổi: {event.ageLimit}+
                             </Tag>
                         </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ticket Selection */}
                <div className="bg-white border rounded-xl p-5 shadow-sm">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-[#23A6F0] text-lg font-bold">{ticket.type}</div>
                            <div className="text-[#E04646] font-semibold mt-1">{money(priceNumber)} VND</div>
                        </div>
                        
                        {isReserved ? (
                            <div className="w-1/2 text-right">
                                <div className="mb-2 text-gray-600 text-sm">Chọn vị trí ngồi:</div>
                                <Select
                                    mode="multiple"
                                    placeholder="Chọn ghế"
                                    style={{ width: '100%' }}
                                    onChange={(values) => setSelectedSeats(values)}
                                    maxTagCount="responsive"
                                    value={selectedSeats}
                                    options={availableSeats.map((s) => ({ label: s.seat, value: s._id }))}
                                    status={selectedSeats.length === 0 ? 'warning' : ''}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Button shape="circle" onClick={minus} disabled={qty <= 1} icon={<MinusOutlined />} />
                                <div className="w-12 text-center text-lg font-medium">{qty}</div>
                                <Button shape="circle" onClick={plus} icon={<PlusOutlined />} />
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Summary */}
              <div className="col-span-12 lg:col-span-4">
                <div className="bg-white border rounded-xl p-5 shadow-sm lg:sticky lg:top-6">
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                    <ShoppingCartOutlined className="text-[#23A6F0] text-xl" />
                    <Title level={4} className="!m-0">Tóm tắt đơn hàng</Title>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loại vé</span>
                      <span className="font-medium text-right max-w-[60%]">{ticket.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Đơn giá</span>
                      <span className="font-medium">{money(priceNumber)} VND</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số lượng</span>
                      <span className="font-medium">x {qty}</span>
                    </div>
                    
                    {isReserved && selectedSeats.length > 0 && (
                        <div className="flex justify-between items-start">
                            <span className="text-gray-600">Ghế chọn</span>
                            <span className="font-medium text-right text-blue-600">
                                {availableSeats.filter(s => selectedSeats.includes(s._id)).map(s => s.seat).join(', ')}
                            </span>
                        </div>
                    )}

                    <div className="border-t border-dotted my-2" />
                    <div className="flex justify-between">
                      <span className="font-semibold">Tạm tính</span>
                      <span className="font-semibold">{money(subtotal)} VND</span>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Input size="small" placeholder="Mã giảm giá..." value={voucher} onChange={(e) => setVoucher(e.target.value)} />
                        <Button size="small" onClick={applyVoucher}>Áp dụng</Button>
                      </div>
                      {discount > 0 && <div className="mt-2 text-green-600 text-sm">Giảm: -{money(discount)} VND</div>}
                    </div>

                    <div className="border-t border-gray-200 my-4" />
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-gray-800">TỔNG TIỀN</span>
                      <span className="text-2xl font-bold text-[#E04646]">{money(total)} VND</span>
                    </div>
                  </div>

                  <Button 
                    type="primary" 
                    size="large" 
                    className="!bg-[#22C55E] w-full mt-6 h-12 text-lg font-semibold" 
                    onClick={handleCheckoutClick} // Sử dụng hàm xử lý mới có kiểm tra tuổi
                    loading={loading}
                  >
                    Thanh toán qua MoMo
                  </Button>
                  
                  <div className="text-center mt-3 text-xs text-gray-500">
                    Bảo mật thanh toán 100%
                  </div>
                </div>
              </div>
            </div>
          </Spin>
        </div>
      </div>
    </ClientLayout>
  );
};

export default CheckoutPage;