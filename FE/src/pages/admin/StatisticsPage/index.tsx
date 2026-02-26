import React from 'react';
import { Card, Col, Row, Statistic, Table, Tag } from 'antd';
import { CalendarOutlined, TeamOutlined, HomeOutlined } from '@ant-design/icons';
import AdminLayout from '../../../layouts/AdminLayout';

const StatisticsPage: React.FC = () => {
  const overview = {
    totalEvents: 128,
    totalCustomers: 3560,
    totalOrganizers: 42,
  };

  const recentSummary = [
    { key: '1', category: 'Sự kiện mới trong tháng', value: 12, status: 'Tăng' },
    { key: '2', category: 'Khách hàng đăng ký mới', value: 245, status: 'Ổn định' },
    { key: '3', category: 'Ban tổ chức hoạt động', value: 18, status: 'Tăng' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-1">Thống kê</h2>
          <p className="text-gray-500 text-sm">Dữ liệu giả lập giao diện (chưa kết nối API)</p>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card className="shadow-sm">
              <Statistic
                title="Tổng số sự kiện"
                value={overview.totalEvents}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card className="shadow-sm">
              <Statistic
                title="Tổng số khách hàng"
                value={overview.totalCustomers}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card className="shadow-sm">
              <Statistic
                title="Tổng số ban tổ chức"
                value={overview.totalOrganizers}
                prefix={<HomeOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card className="shadow-sm" title="Tổng quan gần đây">
          <Table
            rowKey="key"
            pagination={false}
            dataSource={recentSummary}
            columns={[
              { title: 'Chỉ số', dataIndex: 'category', key: 'category' },
              { title: 'Giá trị', dataIndex: 'value', key: 'value', width: 140 },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                width: 140,
                render: (status: string) => (
                  <Tag color={status === 'Tăng' ? 'success' : 'processing'}>{status.toUpperCase()}</Tag>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </AdminLayout>
  );
};

export default StatisticsPage;
