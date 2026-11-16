import { usePreferencesStore } from "#src/store";

import { useTranslation } from "react-i18next";

import { SwitchItem } from "../../switch-item";

export function Tabbar() {
	const { t } = useTranslation();
	const {
		tabbarEnable,
		tabbarShowIcon,
		tabbarPersist,
		tabbarDraggable,
		tabbarShowMore,
		tabbarShowMaximize,
		setPreferences,
	} = usePreferencesStore();

	return (
		<>
			<SwitchItem
				name="tabbarEnable"
				checked={tabbarEnable}
				onChange={(name, value) => setPreferences(name, value)}
			>
				{t("preferences.tabbar.enable")}
			</SwitchItem>
			<SwitchItem
				name="tabbarPersist"
				checked={tabbarPersist}
				disabled={!tabbarEnable}
				onChange={(name, value) => setPreferences(name, value)}
			>
				{t("preferences.tabbar.persist")}
			</SwitchItem>
			<SwitchItem
				name="tabbarDraggable"
				checked={tabbarDraggable}
				disabled={true || !tabbarEnable}
				onChange={(name, value) => setPreferences(name, value)}
			>
				{t("preferences.tabbar.draggable")}
			</SwitchItem>
			<SwitchItem
				name="tabbarShowIcon"
				checked={tabbarShowIcon}
				disabled={true || !tabbarEnable}
				onChange={(name, value) => setPreferences(name, value)}
			>
				{t("preferences.tabbar.icon")}
			</SwitchItem>
			<SwitchItem
				name="tabbarShowMore"
				checked={tabbarShowMore}
				disabled={!tabbarEnable}
				onChange={(name, value) => setPreferences(name, value)}
			>
				{t("preferences.tabbar.showMore")}
			</SwitchItem>
			<SwitchItem
				name="tabbarShowMaximize"
				checked={tabbarShowMaximize}
				disabled={!tabbarEnable}
				onChange={(name, value) => setPreferences(name, value)}
			>
				{t("preferences.tabbar.showMaximize")}
			</SwitchItem>
		</>
	);
}
