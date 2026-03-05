import React from 'react';
import { Card, Col, Row, Table, Tag, message, Spin, Button } from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  HomeOutlined,
  RiseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import axiosClient from '../../../services/axiosClient';
import { handleAuthError } from '../../../utils/httpError';

type OverviewStatistic = {
  _id?: string;
  totalEvents: number;
  totalUsers: number;
  totalOrganizers: number;
  newEventsthisMonth: number;
  newUsersThisMonth: number;
  activeOrganizersThisMonth: number;
  createdAt?: string;
  updatedAt?: string;
};

const EMPTY_OVERVIEW: OverviewStatistic = {
  totalEvents: 0,
  totalUsers: 0,
  totalOrganizers: 0,
  newEventsthisMonth: 0,
  newUsersThisMonth: 0,
  activeOrganizersThisMonth: 0,
};

// Format số
const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(value || 0);

const StatisticsPage: React.FC = () => {
  // Chu kỳ tự động làm mới thống kê: 10 phút
  const AUTO_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [overview, setOverview] = React.useState<OverviewStatistic>(EMPTY_OVERVIEW);
  const [lastFetchedAt, setLastFetchedAt] = React.useState<string>('');

  const fetchOverview = React.useCallback(async () => {
    try {
      setLoading(true);
      // Thêm _t để tránh cache trung gian, luôn lấy dữ liệu mới từ server
      const res = await axiosClient.get('/api/statistic/overview', {
        params: { _t: Date.now() },
      });
      const data = res?.data || {};
      setOverview({
        ...EMPTY_OVERVIEW,
        ...data,
      });
      // Lưu thời điểm FE fetch thành công gần nhất để hiển thị trên UI
      setLastFetchedAt(new Date().toISOString());
    } catch (error: any) {
      if (handleAuthError(error, navigate, { includeForbidden: true, showMessage: false })) {
        return;
      }
      const msg = error?.response?.data?.message || 'Không thể tải dữ liệu thống kê';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleReload = React.useCallback(() => {
    fetchOverview();
  }, [fetchOverview]);

  React.useEffect(() => {
    // Khi mới vào trang: tải dữ liệu ngay lập tức
    fetchOverview();

    // Sau đó tự động cập nhật mỗi 10 phút
    const intervalId = window.setInterval(() => {
      fetchOverview();
    }, AUTO_REFRESH_INTERVAL_MS);

    // Dọn dẹp interval khi rời trang để tránh leak
    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchOverview, AUTO_REFRESH_INTERVAL_MS]);

  // Cấu hình 3 thẻ thống kê với icon và màu sắc riêng
  const topCards = [
    {
      key: 'events',
      title: 'Tổng số sự kiện',
      value: overview.totalEvents || 0,
      icon: <CalendarOutlined />,
      iconBg: '#E6F0FF',
      iconColor: '#2A6DF4'
    },
    {
      key: 'users',
      title: 'Tổng số khách hàng',
      value: overview.totalUsers || 0,
      icon: <TeamOutlined />,
      iconBg: '#F9F0FF',
      iconColor: '#722ED1',
    },
    {
      key: 'organizers',
      title: 'Tổng số ban tổ chức',
      value: overview.totalOrganizers || 0,
      icon: <HomeOutlined />,
      iconBg: '#E0F2FE',
      iconColor: '#06B6D4',
    },
  ];

  const recentSummary = [
    {
      key: '1',
      category: 'Sự kiện mới trong tháng',
      value: overview.newEventsthisMonth || 0,
      status:
        (overview.newEventsthisMonth || 0) > 0
          ? 'Tăng'
          : (overview.newEventsthisMonth || 0) < 0
          ? 'Giảm'
          : 'Ổn định',
    },
    {
      key: '2',
      category: 'Khách hàng đăng ký mới',
      value: overview.newUsersThisMonth || 0,
      status:
        (overview.newUsersThisMonth || 0) > 0
          ? 'Tăng'
          : (overview.newUsersThisMonth || 0) < 0
          ? 'Giảm'
          : 'Ổn định',
    },
    {
      key: '3',
      category: 'Ban tổ chức hoạt động',
      value: overview.activeOrganizersThisMonth || 0,
      status:
        (overview.activeOrganizersThisMonth || 0) > 0
          ? 'Tăng'
          : (overview.activeOrganizersThisMonth || 0) < 0
          ? 'Giảm'
          : 'Ổn định',
    },
  ];

  // Ưu tiên mốc cập nhật từ BE; nếu BE chưa đổi thì vẫn có mốc fetch gần nhất từ FE
  const updatedText = (overview.updatedAt || lastFetchedAt)
    ? new Date(overview.updatedAt || lastFetchedAt).toLocaleString('vi-VN')
    : '—';

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#f1f9ff] p-4 flex flex-col gap-3 rounded-2xl">
        {/* Header với border-left */}
        <Card bordered={false} className="rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="border-l-4 border-[#2A6DF4] pl-4 py-1">
              <h2 className="text-2xl font-bold text-gray-800">Thống kê hệ thống</h2>
              <p className="text-gray-500 text-xs mt-1">
                Dữ liệu tổng quan từ toàn bộ hệ thống
              </p>
              <p className="text-gray-400 text-xs mt-1">Cập nhật lúc: {updatedText}</p>
            </div>

            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={handleReload}
              loading={loading}
            >
              Reload
            </Button>
          </div>
        </Card>

        {/* Nội dung chính */}
        <Card bordered={false} className="rounded-2xl shadow-sm border border-gray-100">
          <Spin spinning={loading} size="large">
            {overview.totalEvents !== undefined ? (
              <div className="flex flex-col gap-5">
                {/* Hàng 1: 3 thẻ tổng quan */}
                <Row gutter={[20, 20]}>
                  {topCards.map((card) => (
                    <Col key={card.key} xs={24} md={8} className="flex">
                      <div className="bg-gradient-to-r from-[#FFF7ED] to-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-1 w-full h-full">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-gray-900 text-base font-medium mb-1">
                              {card.title}
                            </p>
                            <p className={"text-3xl font-bold text-red-600"}>
                              {formatNumber(card.value)}
                            </p>
                          </div>
                          <span
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: card.iconBg, color: card.iconColor }}
                          >
                            {card.icon}
                          </span>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>

                {/* Bảng tổng quan gần đây */}
                <Card
                  bordered={false}
                  className="bg-gradient-to-r from-[#F0FDF4] to-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                  bodyStyle={{ padding: 0 }}
                >
                  <div className="p-3 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-green-600">Tổng quan gần đây</h3>
                  </div>
                  <Table
                    rowKey="key"
                    dataSource={recentSummary}
                    pagination={false}
                    showHeader={false}
                    bordered={false}
                    className="custom-admin-table"
                    columns={[
                      {
                        title: 'Chỉ số',
                        dataIndex: 'category',
                        key: 'category',
                        render: (text) => (
                          <span className="text-black font-semibold">{text}</span>
                        ),
                      },
                      {
                        title: 'Thay đổi',
                        dataIndex: 'value',
                        key: 'value',
                        align: 'right',
                        render: (value) => (
                          <span className="text-black font-semibold text-lg">
                            {value}
                          </span>
                        ),
                      },
                      {
                        title: 'Trạng thái',
                        dataIndex: 'status',
                        key: 'status',
                        align: 'right',
                        render: (status) => (
                          <Tag
                            color={
                              status === 'Tăng' ? 'success' : status === 'Giảm' ? 'error' : 'processing'
                            }
                            className="px-3 py-1 rounded-full text-sm font-medium"
                          >
                            {status === 'Tăng' ? '▲ Tăng' : status === 'Giảm' ? '▼ Giảm' : '● Ổn định'}
                          </Tag>
                        ),
                      },
                    ]}
                    components={{
                      body: {
                        row: (props: any) => (
                          <tr
                            {...props}
                            className="hover:bg-gray-50/80 transition-colors"
                          />
                        ),
                      },
                    }}
                  />
                </Card>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Không có dữ liệu thống kê.
              </div>
            )}
          </Spin>
        </Card>
      </div>

      {/* Tuỳ chỉnh style cho table (nếu cần thêm) */}
      <style>{`
        .custom-admin-table .ant-table {
          background: transparent;
        }
        .custom-admin-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f0f0f0;
          padding: 16px 20px;
        }
        .custom-admin-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none;
        }
      `}</style>
    </AdminLayout>
  );
};

export default StatisticsPage;