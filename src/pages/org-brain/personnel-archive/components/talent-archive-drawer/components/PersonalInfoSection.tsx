import type { TalentArchiveBasicInfo } from "#src/api/org-brain/personnel-archive";

import { SectionTitle } from "#src/components";
import { Descriptions } from "antd";
import { PRO_DESCRIPTIONS_LABEL_STYLE } from "./styles";

interface PersonalInfoSectionProps {
	/** 个人信息数据 */
	data: TalentArchiveBasicInfo;
}

/**
 * 个人信息区块组件
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function PersonalInfoSection({ data }: PersonalInfoSectionProps) {
	const displayData = {
		...data,
		gender: data.gender || "/",
		weightLabel: data.weight ? `${data.weight}kg` : data.weight,
	};

	return (
		<div>
			<SectionTitle title="个人信息" className="mb-3" />
			<Descriptions
				column={3}
				colon={false}
				styles={{ label: PRO_DESCRIPTIONS_LABEL_STYLE }}
				items={[
					{ label: "姓名", children: displayData.name },
					{ label: "性别", children: displayData.gender },
					{ label: "出生地", children: displayData.birthplace },
					{ label: "出生日期", children: displayData.birthday },
					{ label: "籍贯", children: displayData.nativePlace },
					{ label: "民族", children: displayData.nation },
					{ label: "身高", children: displayData.height },
					{ label: "体重", children: displayData.weightLabel },
					{ label: "血型", children: displayData.bloodType },
					{ label: "属相", children: displayData.zodiac },
					{ label: "星座", children: displayData.constellation },
					{ label: "政治面貌", children: displayData.politicalStatus },
					{ label: "婚姻状况", children: displayData.maritalStatus },
					{ label: "生育状况", children: displayData.fertilityStatus },
					{ label: "手机号码", children: displayData.phone },
					{ label: "现居地", children: displayData.address, span: 2 },
				]}
			/>
		</div>
	);
}
