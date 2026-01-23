import React from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { Table, Tag } from 'antd';

const MessagesPage: React.FC = () => {
	const [data, setData] = React.useState<any[]>([]);

	React.useEffect(() => {
		// Placeholder: load messages via API later
		setData([]);
	}, []);

	const columns = [
		{ title: '#', key: 'index', render: (_: any, __: any, idx: number) => idx + 1, width: 60 },
		{ title: 'From', dataIndex: 'from', key: 'from' },
		{ title: 'Subject', dataIndex: 'subject', key: 'subject' },
		{ title: 'Date', dataIndex: 'date', key: 'date', width: 160 },
		{ title: 'Tags', dataIndex: 'tags', key: 'tags', render: (tags: string[]) => (tags || []).map(t => <Tag key={t}>{t}</Tag>) }
	];

	return (
		<AdminLayout>
			<div className="bg-white rounded shadow p-6">
				<h2 className="text-lg font-semibold mb-4">Messages</h2>
				<Table rowKey={(r) => r._id} dataSource={data} columns={columns} pagination={{ pageSize: 10 }} />
			</div>
		</AdminLayout>
	);
};

export default MessagesPage;
