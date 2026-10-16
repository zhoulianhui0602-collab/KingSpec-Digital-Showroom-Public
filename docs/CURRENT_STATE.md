# Current State

## 应用与发布基线

- Current Version：**V2.1.3**。
- Accepted Visual Baseline：**2026-10-15**，来自同批 Complete / Source / Preview 交付；三包原始页面相同。
- 本公开目录以 Source 包建立最小源码基线，不接入旧私有仓库历史，不取代本地完整制作备份。
- 当前工作为公开 GitHub 仓库与 Pages 发布。本文编写时未完成远端创建与部署；不能据此文档宣称已上线。
- 目标仓库：`zhoulianhui0602-collab/KingSpec-Digital-Showroom-Public`。
- 目标网页：`https://zhoulianhui0602-collab.github.io/KingSpec-Digital-Showroom-Public/`。

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
- 这些只读比对不是新构建、网站功能或匿名访问验证。
- 同事的最后细框 / 龙头增量记录称：离线模型与构建检查已完成，未做最新网页四视口截图复核。此前视觉 QA 属于历史阶段。
- 首访下载并解码 14.3 MB 自包含页面有成本，移动设备和高分辨率 GPU 性能依设备而异。
- 真实手机、Safari 与长期 GPU 稳定性尚未验收；不承诺统一帧率。
- 原 HDR 的外部作者与许可未记录，且其衍生图内嵌于网页。代码 MIT 不包含这一资产，详见 `../ASSET_NOTICE.md`。
- 当前发布后的实测结果应单独记录，不覆盖或夸大上述历史边界。

## Do Not Change

公开发布阶段保持接受的画面与交互。未经新任务，不改 Camera、FOV、模型 Scale、六层关系、透明 / 线框体系、展开节奏、产品参数、官网链接、比较与返回逻辑。不要自动增加展区或开发新版本。

不将内部评审、制作备份、原私有历史、凭据、本机隐私或无关原始 CAD 加入公开仓库。Pages 只需静态产物、辅助入口与许可说明。
