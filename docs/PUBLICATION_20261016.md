# 2026-10-16 公开发布核验

## 结果

- [数字展厅](https://zhoulianhui0602-collab.github.io/KingSpec-Digital-Showroom-Public/)：HTTPS，匿名访问 HTTP 200，无需 GitHub 登录，也不依赖开发电脑开机。
- [公开源码仓库](https://github.com/zhoulianhui0602-collab/KingSpec-Digital-Showroom-Public)：Owner `zhoulianhui0602-collab`，`private=false`，主分支 `main`。
- [首次构建与部署记录](https://github.com/zhoulianhui0602-collab/KingSpec-Digital-Showroom-Public/actions/runs/38834954812)：build / deploy 全部成功。
- 首次公开基线提交：`4d75b8debe6bced11a5e4ffc0a639417b2371321`。后续发布记录提交仅补充文档与证据。

## 接受的版本

应用版本为 V2.1.3，采用同事在 2026-10-15 提供的细框 / 顶盖龙头 / PCB 流光 / HDR 场景。Complete / Source 的工作文件一致，三包 index.html 字节一致。

Windows 重新构建、独立 Git checkout 重新构建，以及 GitHub Actions Ubuntu 构建均通过。线上下载的实际页面为 **14,323,622 bytes**，SHA-256 与三份原始交付完全一致：

```text
AF52DE685288C2DF8641E6F5C600D52FD2DBD3EBB53BF92250890FAC6ED806A4
```

本轮没有修改应用 JS、样式、模板、产品数据、相机、模型或贴图。新增内容为公开说明、许可范围、部署流程及维护文档。

## 浏览器检查

本地 Chromium 检查 1920×1080、2560×1440、390×844、430×932：场景 ready、128 个模型网格、四展区标注可见、无横向溢出、无脚本错误或非有限材质值。SSD 展区显示 6 款产品，P3 官方图片和技术参数正常打开。

线上以没有 GitHub 会话的新浏览器环境再次检查 1920×1080 / 390×844：场景正常加载，无页面脚本错误，无横向溢出。仓库 API 也以无认证请求确认公开可读。

核验使用 Windows Chromium 软件渲染，减少动态以固定截图状态。它不等于真实手机、Safari、macOS 实机或长期 GPU 性能验收，不应将软件渲染帧率作为用户设备性能预测。

## 公开范围

公开源码、锁定依赖清单、当前主 GLB、实际运行图片 / HDR、构建成品和部署配置。首次提交 84 文件，不含 node_modules、凭据文件、旧 Git 历史、内部 PPT、Blender 工程、原 EXR、备用测试柜 / 工作室或本机备份。

常见凭据文件名和 Token / 私钥模式扫描未发现实际命中；这不是对所有隐私或素材权利的全面保证。主 GLB JSON 未见本机绝对路径，二进制资产按 Git binary 规则保持。

原本私有的 `KingSpec-Digital-Showroom` 仓库保留私有。新公开目录是网页日常开发与发布基线，完整制作资料继续保留在原始交付包。

## 发布方式与维护

每次向 `main` 推送，Actions 使用 `.nvmrc` 和 npm lockfile 构建、检查 index.html 与提交一致，再发布 `_site/` 中的网页入口与许可文件。源码和本地预览服务不进入 Pages 网站目录。

`prepare-pages.cjs` 在验证生成路径属于本仓库后重新生成 `_site/`，防止旧文件混入部署。原有 `npm run build --prefix source` 行为保留。

原创代码采用 MIT。Logo、图片、产品资料、模型和 HDR 等不随代码许可再授权；HDR 外部作者与许可仍未记录。详见 [素材声明](../ASSET_NOTICE.md)。
