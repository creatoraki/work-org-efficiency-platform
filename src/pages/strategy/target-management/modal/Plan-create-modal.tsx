import { checkPlanName, updateTargetPlan } from "#src/api/strategy";
import { fetchTargetPlanDetail } from "#src/api/strategy/target-plan";
import yellowConfirm from "#src/assets/svg/yellow-confirm.svg";
import PeriodPicker from "#src/components/period-picker";
import { request } from "#src/utils/request";
import { Button, Form, Input, message, Modal } from "antd";
import React from "react";

interface Props {
	open: boolean;
	record?: any;
	onClose: (res?: any) => void;
}

interface PlanPayload {
	id?: string | number;
	name: string;
	year?: number;
	subperiod?: number;
	remark?: string;
	synVersion?: number;
}

// PeriodPicker extracted to ./PeriodPicker

export default function PlanCreateModal({ open, record, onClose }: Props) {
	const [form] = Form.useForm();
	React.useEffect(() => {
		if (open) {
			if (record) {
				// If editing, populate form
				const initialValues = { ...record };
				if (record.year && record.subperiod !== undefined) {
					// PeriodPicker expects [year, subperiod]
					initialValues.period = [Number(record.year), Number(record.subperiod)];
				}
				form.setFieldsValue(initialValues);

				if (record.id) {
					fetchTargetPlanDetail({ id: record.id }).then((res: any) => {
						if (res && res.data) {
							form.setFieldsValue({
								remark: res.data.remark,
							});
						}
					});
				}
			} else {
				form.resetFields();
			}
		}
	}, [open, record, form]);

	const handleOk = async () => {
		const vals = await form.validateFields();
		const period = vals.period;
		let year: number | undefined;
		let subperiod: number | undefined;

		// period can be several shapes:
		// 1) legacy date range: [Date, Date]
		// 2) object: { year: number, period: number }
		// 3) new PeriodPicker: [yearNumber, periodNumber]
		if (Array.isArray(period) && period.length === 2 && period[0] instanceof Date) {
			// 兼容老的日期区间，取开始时间的年份，subperiod 设为 0
			year = period[0].getFullYear();
			subperiod = 0;
		} else if (
			Array.isArray(period) &&
			period.length === 2 &&
			typeof period[0] === "number" &&
			typeof period[1] === "number"
		) {
			// new PeriodPicker returns [year, period]
			year = period[0];
			subperiod = period[1];
		} else if (
			period &&
			typeof period === "object" &&
			typeof period.year === "number" &&
			typeof period.period === "number"
		) {
			const sel = period as { year: number; period: number };
			year = sel.year;
			subperiod = sel.period;
		} else {
			message.error("请选择有效的周期");
			return;
		}

		const payload: PlanPayload = {
			name: vals.name,
			year,
			subperiod,
			remark: vals.remark,
		};

		try {
			let resp: any;
			if (record && record.id) {
				// Edit mode
				payload.id = record.id;
				payload.synVersion = record.synVersion;
				// In edit mode, only remark is editable, but we send other fields if needed or just id and remark
				// Requirement: only remark is editable.
				// However, updateTargetPlan might expect full object or partial.
				// Assuming we just send what changed or full object.
				// But UI prevents editing other fields.
				resp = await updateTargetPlan(payload);
			} else {
				// Create mode
				resp = await request.post("target/plan", { json: payload }).json();
			}
			if (resp && (resp.code === 200 || (resp.data && !resp.code))) {
				onClose(resp);
			} else {
				message.error(resp?.msg || (record && record.id ? "编辑计划失败" : "新增计划失败"));
			}
		} catch (e) {
			console.error("save target plan failed", e);
			message.error(record && record.id ? "编辑计划失败" : "新增计划失败");
		}
	};

	const isEdit = !!(record && record.id);

	return (
		<Modal
			title={<>{isEdit ? "编辑计划" : "新增计划"}</>}
			open={open}
			onOk={handleOk}
			onCancel={() => onClose(null)}
			okText="确认"
			cancelText="取消"
			centered
			styles={{
				content: { padding: 0 },
			}}
			footer={
				<>
					<Button onClick={() => onClose(null)}>取消</Button>
					<Button type="primary" onClick={handleOk}>
						确认
					</Button>
				</>
			}
		>
			<div
				className="plan-note"
				style={{
					background: "rgba(255, 239, 224, 1)",
					height: 38,
					lineHeight: "38px",
					padding: "0 12px",
					borderRadius: 4,
					marginBottom: 12,
				}}
			>
				<span>
					<img
						src={yellowConfirm}
						alt=""
						style={{
							marginLeft: 8,
							marginRight: 16,
							width: 16,
							height: 16,
							transform: "translateY(-1px)",
						}}
					/>
				</span>
				<span>注：周期、计划名称一旦确认，将不可再进行修改</span>
			</div>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ span: 6 }}
				wrapperCol={{ span: 16 }}
				colon={false}
			>
				<Form.Item
					name="period"
					label="周期"
					rules={[{ required: true, message: "请选择目标周期" }]}
				>
					<PeriodPicker parentOpen={open} disabled={isEdit} />
				</Form.Item>

				<Form.Item
					name="name"
					label="计划名称"
					validateTrigger="onBlur"
					rules={[
						{ required: true, message: "请输入计划名称" },
						{
							validator: async (_: any, value: any) => {
								const v = (value || "").toString().trim();
								if (!v) return Promise.resolve();
								// If editing and name unchanged, skip remote check
								if (
									record &&
									(record as any).id &&
									String((record as any).name || "") === v
								)
									return Promise.resolve();
								try {
									const res: any = await checkPlanName({
										name: v,
										id: record ? (record as any).id : undefined,
									});
									// assume res.exists === true means name already exists
									const exists =
										res && typeof res.exists !== "undefined"
											? res.exists
											: !!(res && (res === true || res.exists === true));
									if (exists)
										return Promise.reject(
											new Error("计划名称已存在，请重新输入"),
										);
									return Promise.resolve();
								} catch (e) {
									// network or server error: do not block user, just resolve
									console.error("checkPlanName error", e);
									return Promise.resolve();
								}
							},
						},
					]}
				>
					<Input placeholder="请输入" disabled={isEdit} />
				</Form.Item>

				<Form.Item name="remark" label="备注">
					<Input.TextArea rows={3} placeholder="请输入" />
				</Form.Item>
			</Form>
		</Modal>
	);
}
