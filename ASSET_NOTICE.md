# 素材、商标与第三方许可声明

本项目区分**应用代码许可**与**素材使用权**。仓库公开和网页可访问，不代表所有内嵌资源可以自由转载、销售或再授权。

## 原创代码

项目原创应用代码、样式、HTML 模板、本地预览服务及构建脚本适用根目录 [LICENSE](LICENSE) 中的 MIT License。第三方代码继续适用其原始许可。

## 不属于 MIT 授权的素材

以下内容不因本项目代码开源而获得额外许可：

- KingSpec 金胜维、YANSEN 元存、ONEBOOM、MIXAGE、MemoStone 等品牌名称、商标与 Logo；
- `source/assets/` 中的产品照片、品牌 PNG / SVG、龙头图形和其他视觉素材；
- `source/products.json` 等文件中的产品资料及其来源内容；
- `models/` 中的 GLB / glTF 模型及其贴图、造型与设计内容；
- HDR / EXR 环境贴图、Blender 工程、渲染图及其他制作资产，无论是否以独立文件发布；
- 上述素材在 `index.html` 或 GLB 内的 Base64、二进制、纹理或其他内嵌形式。

这些内容的权利由各相应权利人保留。需要将素材用于本项目以外的用途、制作衍生品牌内容或再分发时，应确认对应使用授权。本仓库不授予商标使用权，也不表示第三方改编作品受到品牌背书。

四展台品牌资源来自用户提供的企业 Logo 文件；产品图片与资料来自项目中记录的官方来源。展台品牌陈列是设计安排，不代表每款产品属于该展台标志对应的子品牌。

## HDR 来源记录与尚未确认的授权

当前环境图 `source/assets/environments/studio-neutral-1k.hdr` 是原完整项目中 `models/tex/hdr-light-studio_01.exr` 的缩小衍生文件。源图尺寸为 3000 × 1500，网页 HDR 为 1024 × 512。转换元数据记录在同目录 JSON 中。

**原 EXR 的外部作者与许可未在现有项目记录中明确。** 因此本仓库不能宣称该原图及其衍生 HDR 已获得开源再许可，不能将它们并入 MIT 授权，也不为它们补造署名或许可。当前 HDR 已内嵌于构建页面，公开页面中同样适用这一说明。

项目外使用或再分发前，应向项目维护者取得原始授权依据，或自行使用已确认可用的环境图并重新构建。此项来源说明不等于已经完成素材权利核验。

## 第三方软件

| 组件 | 版本 | 许可记录 |
| --- | --- | --- |
| Three.js | 0.180.0 | [MIT 许可](licenses/three-MIT.txt) |
| esbuild | 0.25.10 | [MIT 许可](licenses/esbuild-MIT.txt) |

构建输出保留依赖中的法定许可注释。安装的其他间接依赖按其包内许可执行。本公开主展厅不依赖历史测试设备场景的 Draco 资源；若后续引入，应同时携带其对应许可。

## Embedded assets are excluded

The MIT license covers original application and build code only. Brand marks,
product imagery and information, 3D models, textures, and environment maps are
excluded, including when embedded in the generated HTML. Their availability in
this repository does not grant a sublicense. The external author and license of
the inherited HDR environment are not documented; no open-source relicensing of
that asset is asserted.
