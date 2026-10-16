# Current State

## 应用与发布基线

- Current Version：**V2.1.3**。
- Accepted Visual Baseline：**2026-10-15**，来自同批 Complete / Source / Preview 交付；三包原始页面相同。
- 本公开目录以 Source 包建立最小源码基线，不接入旧私有仓库历史，不取代本地完整制作备份。
- 2026-10-16 已完成独立公开 GitHub 仓库及 HTTPS Pages 发布；匿名访问 HTTP 200，线上网页与接受的成品 SHA-256 一致。
- 公开仓库：`zhoulianhui0602-collab/KingSpec-Digital-Showroom-Public`，分支 `main`。
- 在线网页：`https://zhoulianhui0602-collab.github.io/KingSpec-Digital-Showroom-Public/`。
- 构建与访问证据见 `PUBLICATION_20261016.md`；旧私有仓库仍保留私有。

## Current Features

- 内置存储、内存、外置与移动存储、存储卡四个三维消费展区。
- 消费 / 工业 / 企业级目录共 26 个子分类、28 款代表产品；非官网全型号镜像。
- 真实产品图片、技术参数、容量选项、来源链接、分类筛选、同子类最多三款比较及返回上下文。
- 六层存储核心与玻璃罩、透明夹层基座、实体 PCB 橙色沿线流光、HDR 环境照明、底座柔光、细框与玻璃顶盖龙头。
- 默认展开视图控制、透明 / 工程线框、自动与手动展开、环绕观察、暂停动态与持续显示的四展区标注。

## 源码与构建

原生 HTML / CSS / JavaScript，Three.js 0.180.0、esbuild 0.25.10，Node 24.18.0。npm 清单与 lockfile 在 `source/`。根目录 `npm ci --prefix source`、`npm run build --prefix source`，预览 `node preview-server.cjs`。

`index.html` 是正式自包含产物，原始交付大小 14,323,622 bytes，包含主 GLB、图片与 HDR。日常构建无需 Blender。原始页面 SHA-256 为 `AF52DE685288C2DF8641E6F5C600D52FD2DBD3EBB53BF92250890FAC6ED806A4`；文本 LF 归一化可能改变字节哈希。

## QA Status 与 Known Issues

- 三份交付中 `index.html` 字节一致；Complete / Source 排除 Git 元数据后的工作文件一致。
- Windows 干净依赖安装与 Git checkout 后重新构建均通过；GitHub Actions 的 Ubuntu 构建及已提交产物一致性检查通过。
- Chromium 检查 1920×1080、2560×1440、390×844、430×932：场景加载、四标注、无横向溢出，无脚本错误；SSD 展区至 P3 产品图及参数路径可用。
- 线上网页匿名 HTTP 200、14,323,622 bytes、与原始成品 SHA-256 相同。未登录的全新 Chromium 环境中桌面与移动场景均正常加载。
- 本轮使用软件渲染浏览器，检查范围为发布及基本功能，不作硬件性能结论。此前视觉 QA 仍属于历史阶段。
- 首访下载并解码 14.3 MB 自包含页面有成本，移动设备和高分辨率 GPU 性能依设备而异。
- 真实手机、Safari 与长期 GPU 稳定性尚未验收；不承诺统一帧率。
- 原 HDR 的外部作者与许可未记录，且其衍生图内嵌于网页。代码 MIT 不包含这一资产，详见 `../ASSET_NOTICE.md`。
- 当前发布后的实测结果应单独记录，不覆盖或夸大上述历史边界。

## Do Not Change

公开发布阶段保持接受的画面与交互。未经新任务，不改 Camera、FOV、模型 Scale、六层关系、透明 / 线框体系、展开节奏、产品参数、官网链接、比较与返回逻辑。不要自动增加展区或开发新版本。

不将内部评审、制作备份、原私有历史、凭据、本机隐私或无关原始 CAD 加入公开仓库。Pages 只需静态产物、辅助入口与许可说明。
