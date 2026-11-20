# 年终述职 · 接口对接说明（待审核）

| 项       | 内容                                                                                        |
| -------- | ------------------------------------------------------------------------------------------- |
| 契约来源 | `docs/swagger/11-20.md`（OpenAPI 3.1，善数组织效能平台接口文档 v3.9.0）                     |
| 涉及 tag | 年终述职-文件夹 / 年终述职-述职人 / 年终述职-AI听记记录 / 年终述职-组织树（共 19 个接口）   |
| 前端 API | `src/api/performance-management/yearly-performance/{api,types}.ts`                          |
| 页面     | `src/pages/performance-management/yearly-performance`（菜单「述职管理」，页签「年终述职」） |
| 设计稿   | `figma/11-20`（11-20 版）                                                                   |
| 文档范例 | `figma/无锡地区_2026年度述职备课材料.pdf`：备课材料 / 评分报告均以该 A4 PDF 形式展示        |
| 更新日期 | 2026-11-20                                                                                  |

## 一、对接约定

1. **请求封装**：使用 `#src/utils/axios-request`（与档案、组织大脑等新模块一致），接口前缀 `/shanshu-efficiency-api` 由实例 baseURL 拼接；业务码非 `0/200` 时抛 `BizError` 并默认 toast `msg`。
2. **数据流**：页面只通过 React Query Hook（`hooks/use-yearly-report-queries.ts`）调用 API 层；变更成功后按 `yearly-performance` 前缀整体失效（PDF Blob 缓存除外）。
3. **字段命名**：前端类型字段名与后端一致（`userId` / `appraisalStatus` / `belongToOrgCode` …），仅做两处统一归一：
    - int64 主键（`userId` / `folderId` / `id`）在映射层转为 **string**，回传时 Jackson 会把数字字符串反序列化为 Long；
    - AI 听记记录 `status` 统一转为字符串。
4. **日期入参**：`date-time` 字段统一传 `YYYY-MM-DD HH:mm:ss`；日期区间按天补齐（开始 `00:00:00`，结束 `23:59:59`）。
5. **原 mock 已删除**：`mock.ts` 及手写的备课材料 / 评分报告 HTML 文档组件已移除，页面全部走真实接口。

## 二、接口登记

状态说明：✅ 已接入页面　📋 已登记、页面暂未使用　—— 与本页无关

| #   | 方法   | 路径                                      | 用途                   | 前端函数                                                 | 页面使用点                                          | 状态 |
| --- | ------ | ----------------------------------------- | ---------------------- | -------------------------------------------------------- | --------------------------------------------------- | ---- |
| 1   | GET    | `appraisal/org/tree`                      | 组织树                 | `fetchAppraisalOrgTree`                                  | 左侧组织架构、所属组织级联                          | ✅   |
| 2   | POST   | `appraisal/folder/list`                   | 文件夹分页             | `fetchAppraisalFolderPage` / `fetchAppraisalFolders`     | 文件夹面板、批量移动弹窗                            | ✅   |
| 3   | GET    | `appraisal/folder/{id}`                   | 文件夹详情             | ——                                                       | 列表行已含全部字段，暂不需要                        | 📋   |
| 4   | POST   | `appraisal/folder`                        | 新增文件夹             | `createAppraisalFolder`                                  | 新增文件夹弹窗 + 成功提示定位                       | ✅   |
| 5   | PUT    | `appraisal/folder`                        | 修改文件夹             | `updateAppraisalFolder`                                  | 文件夹「编辑」（重命名，回传原述职日期）            | ✅   |
| 6   | DELETE | `appraisal/folder/{ids}`                  | 删除文件夹（批量）     | `deleteAppraisalFolders`                                 | 文件夹「删除」                                      | ✅   |
| 7   | POST   | `appraisal/folder/addUsers`               | 批量移入文件夹         | `addAppraisalFolderUsers`                                | 批量移动、卡片拖入文件夹                            | ✅   |
| 8   | POST   | `appraisal/user/list`                     | 述职人员分页           | `fetchAppraisalUserPage` / `fetchAppraisalFolderUserIds` | 人员卡片、分页；排序前拉取文件夹全量顺序            | ✅   |
| 9   | POST   | `appraisal/user/statistic`                | 述职状态统计           | `fetchAppraisalUserStatistics`                           | 概览卡片、组织架构总人数、文件夹「全部」人数        | ✅   |
| 10  | GET    | `appraisal/user/{id}`                     | 述职人员详情           | `fetchAppraisalUserDetail`                               | 详情抽屉（含备课材料 / 评分报告 Url、听记记录）     | ✅   |
| 11  | POST   | `appraisal/user/sort`                     | 文件夹内排序           | `sortAppraisalUsers`                                     | 卡片拖拽排序、序号框输入                            | ✅   |
| 12  | POST   | `appraisal/user/presentation/start`       | 开始述职               | `startAppraisalPresentation`                             | 卡片 / 抽屉「开始述职」、抽屉「追加录音」（待确认） | ✅   |
| 13  | POST   | `appraisal/user/presentation/redo`        | 重新开始述职           | `redoAppraisalPresentation`                              | 抽屉「重新开启」                                    | ✅   |
| 14  | POST   | `appraisal/user/presentation/end`         | 结束述职               | `endAppraisalPresentation`                               | 卡片「结束录音」、抽屉「提交 / 结束录音」           | ✅   |
| 15  | POST   | `appraisal/record/list/{appraisalUserId}` | 按述职人查听记记录     | ——                                                       | 详情接口已带 `appraisalRecords`                     | 📋   |
| 16  | GET    | `appraisal/record/{id}`                   | 听记记录详情           | ——                                                       | 暂无场景                                            | 📋   |
| 17  | GET    | `appraisal/record/getByTaskUuid/{uuid}`   | 按 taskUuid 查听记记录 | ——                                                       | 暂无场景                                            | 📋   |
| 18  | DELETE | `appraisal/record/{id}`                   | 删除听记记录           | ——                                                       | 暂无场景（重新开启走 redo）                         | 📋   |
| 19  | POST   | `appraisal/record/mockMinutesEvent`       | 模拟钉钉 AI 听记事件   | ——                                                       | 后端联调工具，前端不接入                            | 📋   |
| -   | POST   | `file/pdf/task`                           | PDF 导出任务           | ——                                                       | `bizType` 枚举不含年终述职，与本页无关              | ——   |

## 三、字段映射

### 3.1 人员卡片（`EffAnnualAppraisalUserPageListBO`）

| 设计稿元素             | 后端字段          | 说明                                                      |
| ---------------------- | ----------------- | --------------------------------------------------------- |
| 勾选 / 拖拽 / 详情 key | `userId`          | 转为字符串                                                |
| 序号框                 | `sort`            | 空值显示「-」；仅在具体文件夹内可编辑                     |
| 头像                   | ——                | 契约无头像字段，统一用姓名占位字（中文末字 / 英文首字母） |
| 姓名                   | `userName`        |                                                           |
| 状态标签 / 操作按钮    | `appraisalStatus` | 0 待述职 / 1 述职中 / 2 报告生成中 / 3 报告已生成         |
| 管理者类别             | `jobType`         | 契约名为「岗位类别」                                      |
| 组织架构               | `orgName`         | 设计稿为全路径，契约只有名称                              |
| 述职日期               | `appraisalDate`   | 展示为 `YYYY-MM-DD 周X`                                   |
| （开始述职入参）       | `folderId`        | 为空时提示「请先将该人员归入文件夹（述职会）」            |

### 3.2 详情抽屉（`EffAnnualAppraisalUserDetailBO`）

| 设计稿元素                       | 后端字段                                            | 说明                                                      |
| -------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| 头部状态                         | `appraisalStatus`                                   | 以详情为准；与列表不一致时同步并刷新列表                  |
| 管理者类别 / 组织架构 / 述职日期 | `jobType` / `orgName` / `appraisalDate`             |                                                           |
| 工号                             | ——                                                  | 契约无工号，暂以「所属文件夹」`folderName` 补位           |
| 步骤 1 · 备课材料                | `materialUrl`                                       | PDF 预览；为空提示「备课材料尚未从千问办公同步」          |
| 步骤 2 · 闪记                    | `appraisalRecords[].status / title`                 | `status=4` 视为录制完成，展示闪记名称                     |
| 步骤 2 · 存档列表                | `appraisalRecords[].startTime/endTime/duration/url` | 述职结束后回看                                            |
| 步骤 3 · 报告生成中              | `realEndTime`                                       | 有值 → 设计稿 19（含存档时间说明）；无值 → 设计稿 18 空态 |
| 步骤 3 · 评分报告 / 下载         | `evaluationReportUrl`                               | PDF 预览；工具栏下载 + 底栏「下载报告」                   |

### 3.3 文件夹 / 组织树

| 设计稿元素     | 后端字段                        | 说明                                       |
| -------------- | ------------------------------- | ------------------------------------------ |
| 文件夹名称     | `name`                          |                                            |
| 新增：所属组织 | `belongToOrgCode`               | 级联末级组织 code                          |
| 新增：述职日期 | `appraisalDate`                 | `YYYY-MM-DD 00:00:00`                      |
| 编辑           | `id` + `name` + `appraisalDate` | 修改接口要求述职日期必传，重命名时原样回传 |
| 组织节点       | `code` / `name` / `children`    | 查询条件统一用 `code`                      |
| 不可选组织     | `accessible=false`              | 置灰、可展开、不可选中                     |

## 四、交互 ↔ 接口流程

| 交互                  | 接口与处理                                                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 选中组织              | 根节点 = 全部可见范围，不传组织；其他节点传 `orgCode` + `currentOrgOnly=false`（含下级）；文件夹列表传 `belongToOrgCode`                        |
| 筛选                  | `userName`、`jobType`（级联路径以 `>` 拼接）、`appraisalStatus`、`appraisalDateStart/End`；统计与列表同条件（统计不带状态）                     |
| 开始述职              | `presentation/start {folderId,userId}`，关闭全局 toast；业务错误以确认弹窗原样展示 `msg`（设计稿 02「【XX】已开启…」/ 22「你正在录制【XX】…」） |
| 重新开启              | 二次确认后 `presentation/redo`，错误同上                                                                                                        |
| 追加录音              | 暂复用 `presentation/start`（见待确认 4）                                                                                                       |
| 结束录音 / 提交       | 二次确认后 `presentation/end` → 报告生成中                                                                                                      |
| 拖拽排序 / 序号输入   | 先 `user/list {folderId,pageSize:500}` 取文件夹全量顺序，前端移动后 `user/sort {folderId,userIdsSorted}` 整体提交；仅具体文件夹视图可排序       |
| 批量移动 / 拖入文件夹 | `folder/addUsers`；成功后选中目标文件夹并清空勾选（设计稿 12）                                                                                  |
| 新增文件夹            | `POST folder`；提示 3 秒消失，点击蓝字定位：优先用返回 ID，未返回时按「组织 + 名称」回查（设计稿 09）                                           |
| 批量下载              | 无打包接口：逐个取详情 `evaluationReportUrl` 顺序下载，跳过未生成报告的人员                                                                     |
| PDF 预览              | 拉取为 Blob → `blob:` 地址 + 浏览器内置预览（隐藏工具栏、按宽适配）；相对路径走 axios 带鉴权，绝对地址 fetch，失败回退直接加载原地址            |
| 自动刷新              | 列表含「述职中 / 报告生成中」时 30s 刷新；详情述职中 5s、报告生成中 30s 刷新（全局已关闭聚焦 / 重连自动重拉）                                   |

## 五、与设计稿的差异（契约限制）

1. 文件夹面板**不展示「未归入文件夹」节点**：列表 / 统计只支持 `folderId` 精确过滤，无法查询未归入人员。
2. 组织树节点、文件夹行**不展示人数**：`DeptTreeV`、`FolderPageListBO` 无人数字段；「组织架构 · 总人数」「全部」人数由统计接口求和得到。
3. 详情头部「工号」以「所属文件夹」补位；卡片头像统一为文字占位；「组织架构」只显示末级组织名。
4. 自适应稿（15）仍为「卡片在上、筛选在下」的旧顺序，实现统一按 01 稿「筛选在上、卡片在下」。

## 六、待后端确认

按影响程度排序，确认后前端只需改 API 层或对应常量。

| #   | 优先级 | 问题                                                                                                                        | 前端当前处理                                                |
| --- | ------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | P0     | `appraisal/user/statistic` 的 `data` 为无结构 Object，具体格式？建议补充 VO                                                 | 兼容 `[{appraisalStatus,count}]` 与 `{"0":13,...}` 两种形态 |
| 2   | P0     | 「管理者类别」筛选如何映射 `jobType`？取值范围、匹配方式（等值 / 前缀）、是否有字典                                         | 选项按设计稿固定，传 `地区公司>三级及以上管理者` 形式       |
| 3   | P0     | `presentation/start` 在「他人已开启」「本人正在录制他人」时是否以业务错误返回设计稿文案？                                   | 原样展示 `msg`                                              |
| 4   | P0     | 「追加录音」无独立接口：述职中再次调用 `start` 是否允许？或提供 append 接口                                                 | 暂调 `start`                                                |
| 5   | P0     | 卡片「结束录音」与抽屉「提交」是否都对应 `end`？是否需要单独的「停止录音（结束闪记）」接口                                  | 都调 `end`                                                  |
| 6   | P0     | `materialUrl` / `evaluationReportUrl` 是 OSS 绝对地址还是后端相对路径？是否需鉴权？OSS 需开启 CORS 并返回 `application/pdf` | 两种都支持；跨域失败时回退直接加载                          |
| 7   | P0     | 「未归入文件夹」查询：建议 list / statistic 增加如 `unassigned: true` 参数                                                  | 节点暂不展示                                                |
| 8   | P1     | 文件夹人数：建议 `FolderPageListBO` 增加 `userCount`                                                                        | 不展示                                                      |
| 9   | P1     | 组织树人数：建议 `DeptTreeV` 增加人数，或提供按组织统计接口                                                                 | 不展示                                                      |
| 10  | P1     | 列表 / 详情缺少工号、头像、组织全路径（建议 `userCode`、`avatar`、`orgNamePath`）                                           | 见「五、差异 3」                                            |
| 11  | P1     | `folder/list` 的 `belongToOrgCode` 语义：只查本级，还是含上 / 下级组织的文件夹？                                            | 选根节点不传，其他传选中组织 code                           |
| 12  | P1     | `orgCode` + `currentOrgOnly=false` 是否即「含下级组织」？                                                                   | 按含下级处理                                                |
| 13  | P1     | `user/sort` 的 `userIdsSorted` 是否要求文件夹完整 ID 列表？`user/list` 默认是否按 `sort` 升序？                             | 传完整列表；前端按 `sort` 兜底排序                          |
| 14  | P1     | `POST folder` 的 `data` 是否返回新文件夹 ID？                                                                               | 兼容数字 / `{id}` / 空（空则按名称回查）                    |
| 15  | P1     | `date-time` 入参格式是否为 `YYYY-MM-DD HH:mm:ss`？                                                                          | 按该格式传                                                  |
| 16  | P1     | int64 ID 是否已全局序列化为字符串？若为雪花 ID 且以数字返回，超过 2^53 会丢精度                                             | 映射层转字符串，回传字符串                                  |
| 17  | P2     | 文件夹可建在哪些组织层级（设计稿：集团 / 地区公司 / 业务集团下）？是否由后端校验                                            | 前端不限制层级，依赖后端校验                                |
| 18  | P2     | `period`（述职周期）是否需要前端传，取值如 `2026`？                                                                         | 不传                                                        |
| 19  | P2     | AI 听记 `status` 是否存在 `3`？`contact` 字段描述与 `url` 相同，含义？                                                      | 未知状态显示「同步中」；`contact` 不使用                    |
| 20  | P2     | 是否提供评分报告批量打包下载接口（zip）？                                                                                   | 前端逐个下载                                                |
| 21  | P2     | 删除文件夹后其中人员去向（是否回到未归入）？                                                                                | 提示「移出该文件夹」                                        |

## 七、自测记录

- 单测：`tests/performance-management/yearly-performance.test.ts`（API 映射、统计归一、排序移动、筛选参数、级联路径、日期格式）。
- 页面：本地 `pnpm dev` + Playwright 在浏览器侧按本契约拦截全部接口，核对设计稿 01 / 02 / 08 / 09 / 16–20 / 22 / 24 状态；PDF 以 `figma/无锡地区_2026年度述职备课材料.pdf` 作为备课材料与评分报告的返回内容。
- 尚未与真实后端联调：需 `pnpm dev`（代理 10.0.20.189:10013）或 `pnpm dev:local` 验证第六节各项。
