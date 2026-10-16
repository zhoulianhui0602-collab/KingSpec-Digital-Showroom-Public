# KingSpec Digital Showroom — 公开源码仓库协作约定

## 项目与当前基线

- 名称：KingSpec Digital Showroom / KingSpec Storage Architecture。
- 品牌：KingSpec 金胜维；用途为品牌数字展厅与交互式存储架构展示。
- 本文件所在目录是独立公开仓库根目录，源于 `KingSpec-Source-20261015`。
- 当前应用版本为 V2.1.3，采用 2026-10-15 的细框、玻璃顶盖龙头、实体 PCB 流光与 HDR 视觉基线。不要回退到旧工作目录的画面。
- 四个三维消费展区，完整目录覆盖消费 / 工业 / 企业级 26 个子分类、28 款代表产品。不要声称包含官网所有型号。
- 先读 `docs/CURRENT_STATE.md`、`docs/NEXT_TASK.md` 和 `ASSET_NOTICE.md`。用户当前明确要求优先于历史制作记录。

## 技术与构建

- 原生 HTML / CSS / JavaScript，Three.js 0.180.0，esbuild 0.25.10；Node.js 24.18.0 见 `.nvmrc`。
- npm 清单与 lockfile 位于 `source/`；根目录执行 `npm ci --prefix source`、`npm run build --prefix source`。
- `index.html` 是内嵌脚本、GLB、图片和 HDR 的正式构建产物。修改源码后构建，不手改产物替代源码变更。
- `node preview-server.cjs` 启动本机预览，地址 `http://127.0.0.1:4173/`。不存在热更新开发服务。
- Windows / macOS 分别安装依赖。不要复制或提交 `node_modules`，不要擅自升级依赖。
- 日常构建只需要主 GLB 和 `source/` 内正式资源，不要求 Blender 或历史 CAD。

## 视觉与功能边界

黑色 / 深灰、银灰工程结构、玻璃与 KingSpec 橙 #E8380D。表达工业、精密、理性、克制与专业的 Engineering Exhibition。

除非任务明确要求，不修改 Camera、FOV、模型 Scale、GLB、核心六层关系、自动展开节奏、透明 / 线框视觉体系、既有 Bloom、产品数据或官网链接。不要自行重建设计，不添加蓝紫霓虹、RGB Gaming、大面积 Glow、无意义粒子或额外 HUD。

保留展厅 → 展区 → 产品 → 参数 / 容量 / 来源 → 同子类比较与返回上下文。参数不得编造，需来自官网、规格书或用户资料。

## 公开发布边界

- 本仓库是公开发布的最小源码基线，不是内部项目总备份。
- 不上传原私有 Git 历史、凭据、`.env`、日志、Cookie、内部评审 PPT、个人本机路径、旧备份、无关 CAD 或备用测试设备工程。
- 保留运行与构建必需的 GLB、图片、JSON、HDR；不能仅因文件较大而删除资源。
- Pages 部署仅包括 `index.html`、辅助 HTML 入口和许可说明；不要直接公开本地开发服务器目录。
- `LICENSE` 仅覆盖原创应用与构建代码。品牌素材、图片、模型、HDR 与产品资料依照 `ASSET_NOTICE.md`；不得把公开访问等同于开放素材再许可。
- 当前 HDR 原作者及许可未记录，不为其编造授权或署名；保留此事实。
- 不把旧文档中的发布计划当作部署成功。仓库、分支、Pages 与匿名访问需要分别确认。

## 验证与后续开发

按用户要求执行核验，区分代码静态检查、构建结果、浏览器实测和历史 QA。不得以单次采样宣称全设备性能保证；真机、Safari 与长期 GPU 状态未验收时必须如实说明。

没有明确任务时不开发下一版本、不重新设计、不自动增加功能。公开发布后的进一步开发等待用户指令。
