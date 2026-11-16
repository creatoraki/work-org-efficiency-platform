import { fetchTargetPlanDetail } from "#src/api/strategy/target-plan";
import { Button, DatePicker, Drawer, Form, Input } from "antd";
import React from "react";
import { commonDrawerProps } from "../constants/base";

interface Props {
	open: boolean;
	record?: any;
	onClose: (res?: any) => void;
}

export default function PlanDrawer({ open, record, onClose }: Props) {
	const [form] = Form.useForm();

	React.useEffect(() => {
		if (open && record?.id) {
			fetchTargetPlanDetail({ id: record.id }).then((res: any) => {
				if (res && res.data) {
					form.setFieldsValue({
						remark: res.data.remark,
						name: res.data.name,
					});
				}
			});
		}
	}, [open, record, form]);

	return (
		<Drawer
			title={record ? "编辑计划" : "新增计划"}
			placement="right"
			width={720}
			open={open}
			{...commonDrawerProps(onClose)}
		>
			关闭
			<Form form={form} layout="vertical" initialValues={record || {}}>
				<Form.Item label="周期" name="period" rules={[{ required: true }]}>
					<DatePicker.RangePicker style={{ width: "100%" }} />
				</Form.Item>
				<Form.Item label="计划名称" name="name" rules={[{ required: true }]}>
					<Input />
				</Form.Item>
				<Form.Item label="备注" name="remark">
					<Input.TextArea rows={3} />
				</Form.Item>
				<div style={{ textAlign: "right" }}>
					<Button style={{ marginRight: 8 }} onClick={() => onClose(null)}>
						取消
					</Button>
					<Button
						type="primary"
						onClick={() => {
							form.validateFields()
								.then((v) => {
									onClose(v);
								})
								.catch(() => {});
						}}
					>
						保存
					</Button>
				</div>
			</Form>
		</Drawer>
	);
}
