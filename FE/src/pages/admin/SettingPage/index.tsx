import React from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { Form, Input, Button, message } from 'antd';

const SettingPage: React.FC = () => {
	const [form] = Form.useForm();

	const onFinish = (values: any) => {
		// Placeholder: save settings via API
		console.log('settings', values);
		message.success('Lưu cài đặt thành công (placeholder)');
	};

	return (
		<AdminLayout>
			<div className="bg-white rounded shadow p-6 max-w-2xl">
				<h2 className="text-lg font-semibold mb-4">Settings</h2>
				<Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ company: '', email: '', phone: '', address: '' }}>
					<Form.Item name="company" label="Company name">
						<Input />
					</Form.Item>
					<Form.Item name="email" label="Email">
						<Input />
					</Form.Item>
					<Form.Item name="phone" label="Phone">
						<Input />
					</Form.Item>
					<Form.Item name="address" label="Address">
						<Input />
					</Form.Item>
					<Form.Item>
						<Button type="primary" htmlType="submit">Save</Button>
					</Form.Item>
				</Form>
			</div>
		</AdminLayout>
	);
};

export default SettingPage;
