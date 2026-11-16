import { Button, Modal, Select, Spin, Tag } from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";

const AMAP_API_KEY = "77f3315a05eccb944c0107dc8b6dcd5f";
const AMAP_VERSION = "2.0";

export interface ProjectPoint {
	id: string;
	name: string;
	orgName: string;
	lng: number;
	lat: number;
}

interface ProjectDistributionMapModalProps {
	open: boolean;
	onClose: () => void;
	/** 选中的组织名称列表（用于筛选显示） */
	selectedOrgNames: string[];
	/** 待渲染的项目点位（来自真实接口数据） */
	projects: ProjectPoint[];
}

/** 动态加载高德地图 JS API */
function loadAMapScript(): Promise<void> {
	return new Promise((resolve, reject) => {
		if ((window as any).AMap) {
			resolve();
			return;
		}

		const existing = document.getElementById("amap-script");
		if (existing) {
			existing.addEventListener("load", () => resolve());
			existing.addEventListener("error", () => reject(new Error("高德地图加载失败")));
			return;
		}

		const script = document.createElement("script");
		script.id = "amap-script";
		script.src = `https://webapi.amap.com/maps?v=${AMAP_VERSION}&key=${AMAP_API_KEY}`;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error("高德地图加载失败"));
		document.head.appendChild(script);
	});
}

const TAG_COLORS = ["blue", "green", "orange", "purple", "cyan", "magenta", "gold", "lime"];

// 与 antd Tag 预设色对应的 hex 值，用于地图标注与围栏配色
const TAG_COLOR_HEX: Record<string, string> = {
	blue: "#1677ff",
	green: "#52c41a",
	orange: "#fa8c16",
	purple: "#722ed1",
	cyan: "#13c2c2",
	magenta: "#eb2f96",
	gold: "#faad14",
	lime: "#a0d911",
};

const DEFAULT_COLOR_HEX = "#4169E1";

function getOrgColorHex(orgName: string, orgList: string[]): string {
	const idx = orgList.indexOf(orgName);
	if (idx < 0) {
		return DEFAULT_COLOR_HEX;
	}
	const colorName = TAG_COLORS[idx % TAG_COLORS.length];
	return TAG_COLOR_HEX[colorName] || DEFAULT_COLOR_HEX;
}

export const ProjectDistributionMapModal: React.FC<ProjectDistributionMapModalProps> = ({
	open,
	onClose,
	selectedOrgNames,
	projects,
}) => {
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<any>(null);
	const markersRef = useRef<any[]>([]);
	const polygonsRef = useRef<any[]>([]);
	const [mapLoading, setMapLoading] = useState(false);
	const [mapReady, setMapReady] = useState(false);
	const [filterOrgNames, setFilterOrgNames] = useState<string[]>([]);
	const [searchValue, setSearchValue] = useState<string[]>([]);

	// 打开时初始化筛选条件为所有选中的组织
	useEffect(() => {
		if (open) {
			setFilterOrgNames([...selectedOrgNames]);
			setSearchValue([...selectedOrgNames]);
		}
	}, [open, selectedOrgNames]);

	const filteredProjects = projects.filter(
		(p) => filterOrgNames.length === 0 || filterOrgNames.includes(p.orgName),
	);
	const filteredProjectsRef = useRef(filteredProjects);
	filteredProjectsRef.current = filteredProjects;
	const filterOrgNamesRef = useRef(filterOrgNames);
	filterOrgNamesRef.current = filterOrgNames;

	const clearMapOverlays = useCallback(() => {
		markersRef.current.forEach((marker) => {
			marker.setMap(null);
		});
		markersRef.current = [];
		polygonsRef.current.forEach((polygon) => {
			polygon.setMap(null);
		});
		polygonsRef.current = [];
	}, []);

	const renderMarkers = useCallback(
		(map: any, projects: ProjectPoint[], orgList: string[]) => {
			const AMap = (window as any).AMap;
			if (!AMap || !map) {
				return;
			}

			clearMapOverlays();

			const infoWindow = new AMap.InfoWindow({
				isCustom: true,
				autoMove: false,
				offset: new AMap.Pixel(0, -20),
			});

			// 按组织分组
			const groups = new Map<string, ProjectPoint[]>();
			projects.forEach((p) => {
				const arr = groups.get(p.orgName) || [];
				arr.push(p);
				groups.set(p.orgName, arr);
			});

			const allMarkers: any[] = [];
			const allPolygons: any[] = [];
			const allPositions: any[] = [];

			groups.forEach((groupProjects, orgName) => {
				const colorHex = getOrgColorHex(orgName, orgList);
				const groupPositions: any[] = [];

				groupProjects.forEach((project) => {
					const position = new AMap.LngLat(project.lng, project.lat);
					groupPositions.push(position);
					allPositions.push(position);

					// 自定义彩色圆点标注
					const markerContent = `<div style="width:16px;height:16px;border-radius:50%;background:${colorHex};border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.3);"></div>`;
					const marker = new AMap.Marker({
						position,
						title: project.name,
						content: markerContent,
						offset: new AMap.Pixel(-8, -8),
					});
					marker.on("mouseover", () => {
						infoWindow.setContent(
							`<div style="background:#fff;padding:4px 8px;border-radius:4px;border:1px solid #ddd;font-size:12px;color:#333;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.15);"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colorHex};margin-right:6px;vertical-align:middle;"></span>${project.name}<span style="color:#999;margin-left:6px;">(${orgName})</span></div>`,
						);
						infoWindow.open(map, position);
					});
					marker.on("mouseout", () => {
						infoWindow.close();
					});
					marker.setMap(map);
					allMarkers.push(marker);
				});

				// 每个组织独立绘制围栏
				if (groupPositions.length >= 3) {
					const sortedPositions = computeConvexHull(groupPositions, AMap);
					const polygon = new AMap.Polygon({
						path: sortedPositions,
						strokeColor: colorHex,
						strokeWeight: 2,
						strokeOpacity: 0.8,
						strokeStyle: "dashed",
						fillColor: colorHex,
						fillOpacity: 0.12,
					});
					polygon.setMap(map);
					allPolygons.push(polygon);
				}
			});

			markersRef.current = allMarkers;
			polygonsRef.current = allPolygons;

			// 自适应视野
			if (allPositions.length > 0) {
				map.setFitView(null, false, [60, 60, 60, 60]);
			}
		},
		[clearMapOverlays],
	);

	// Modal 关闭时重置 mapReady，打开动画完成后设为 true
	useEffect(() => {
		if (!open) {
			setMapReady(false);
		}
	}, [open]);

	// mapReady 为 true 时初始化地图（此时 DOM 一定已挂载）
	useEffect(() => {
		if (!mapReady) {
			return;
		}

		let disposed = false;
		setMapLoading(true);

		loadAMapScript()
			.then(() => {
				if (disposed || !mapContainerRef.current) {
					return;
				}

				const AMap = (window as any).AMap;
				const map = new AMap.Map(mapContainerRef.current, {
					zoom: 12,
					center: [120.1551, 30.2741],
					viewMode: "2D",
				});

				mapInstanceRef.current = map;
				setMapLoading(false);
				renderMarkers(map, filteredProjectsRef.current, filterOrgNamesRef.current);
			})
			.catch(() => {
				setMapLoading(false);
			});

		return () => {
			disposed = true;
			if (mapInstanceRef.current) {
				mapInstanceRef.current.destroy();
				mapInstanceRef.current = null;
			}
		};
	}, [mapReady]);

	// 筛选条件变化时更新标注
	useEffect(() => {
		if (mapInstanceRef.current) {
			renderMarkers(mapInstanceRef.current, filteredProjects, filterOrgNames);
		}
	}, [filterOrgNames, projects]);

	const handleSearch = () => {
		setFilterOrgNames([...searchValue]);
	};

	const handleReset = () => {
		setSearchValue([...selectedOrgNames]);
		setFilterOrgNames([...selectedOrgNames]);
	};

	const handleRemoveTag = (orgName: string) => {
		const next = searchValue.filter((n) => n !== orgName);
		setSearchValue(next);
		setFilterOrgNames(next);
	};

	// 获取所有可筛选的组织名称（来自数据 + 选中的）
	const allOrgNameOptions = Array.from(
		new Set([...selectedOrgNames, ...projects.map((p) => p.orgName)]),
	).map((name) => ({ label: name, value: name }));

	return (
		<Modal
			title="项目分布地图"
			open={open}
			onCancel={onClose}
			width={960}
			centered
			footer={null}
			destroyOnHidden
			afterOpenChange={(visible) => {
				if (visible) {
					setMapReady(true);
				}
			}}
		>
			{/* 筛选区域 */}
			<div className="mb-3 flex items-center gap-3">
				<span className="shrink-0 text-sm text-gray-600">组织名称</span>
				<div className="flex h-8 flex-1 items-center gap-1 overflow-x-auto rounded border border-gray-300 px-2">
					{searchValue.map((name, index) => (
						<Tag
							key={name}
							closable
							color={TAG_COLORS[index % TAG_COLORS.length]}
							onClose={() => handleRemoveTag(name)}
							className="m-0 shrink-0"
						>
							{name}
						</Tag>
					))}
					<Select
						mode="multiple"
						value={searchValue}
						onChange={setSearchValue}
						options={allOrgNameOptions}
						placeholder="选择组织"
						variant="borderless"
						className="flex-1"
						style={{ minWidth: 100 }}
						tagRender={() => <span />}
						suffixIcon={null}
						size="small"
					/>
				</div>
				<Button type="primary" onClick={handleSearch}>
					查询
				</Button>
				<Button onClick={handleReset}>重置</Button>
			</div>

			{/* 地图区域 */}
			<Spin spinning={mapLoading} tip="地图加载中...">
				<div
					ref={mapContainerRef}
					style={{
						width: "100%",
						height: 500,
						borderRadius: 4,
						border: "1px solid #e8e8e8",
					}}
				/>
			</Spin>
		</Modal>
	);
};

/**
 * 计算凸包（Graham Scan），用于围栏绘制
 */
function computeConvexHull(points: any[], AMap: any): any[] {
	if (points.length < 3) {
		return points;
	}

	const coords = points.map((p) => ({ lng: p.getLng(), lat: p.getLat(), raw: p }));

	// 找到最下方（lat 最小）的点作为起点
	coords.sort((a, b) => a.lat - b.lat || a.lng - b.lng);
	const origin = coords[0];

	// 按极角排序
	const rest = coords.slice(1).sort((a, b) => {
		const angleA = Math.atan2(a.lat - origin.lat, a.lng - origin.lng);
		const angleB = Math.atan2(b.lat - origin.lat, b.lng - origin.lng);
		return angleA - angleB;
	});

	const stack = [origin, rest[0]];

	for (let i = 1; i < rest.length; i++) {
		while (stack.length > 1) {
			const top = stack[stack.length - 1];
			const belowTop = stack[stack.length - 2];
			const cross =
				(top.lng - belowTop.lng) * (rest[i].lat - belowTop.lat) -
				(top.lat - belowTop.lat) * (rest[i].lng - belowTop.lng);
			if (cross <= 0) {
				stack.pop();
			} else {
				break;
			}
		}
		stack.push(rest[i]);
	}

	return stack.map((c) => new AMap.LngLat(c.lng, c.lat));
}

export default ProjectDistributionMapModal;
