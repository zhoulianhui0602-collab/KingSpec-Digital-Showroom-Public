# Studio environment

`studio-neutral-1k.hdr` is a 1024 × 512 Radiance RGBE derivative of the existing
project asset `models/tex/hdr-light-studio_01.exr` (3000 × 1500, Linear Rec.709).
No new external image or third-party download was added. The original asset's
external author/license is not documented in this repository; this derivative
retains that existing provenance rather than inventing an attribution.

Conversion downsamples linear radiance and keeps highlights above 1. It does not
bake Blender's AgX/Filmic display transform, exposure, gamma, or normalization.
`studio-neutral-1k.json` records source/output hashes, radiance statistics and the
measured RGBE quantization error. The original EXR and its one-time conversion
script remain in the complete local authoring project; they are not included in
this minimal public website repository. The following command is for that full
authoring project only, not a required website build step:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python source/scripts/prepare_studio_hdr.py
```

The conversion uses Blender's bundled NumPy and image writer; no package install
is required. It does not edit the main `.blend` or GLB. Three.js 0.180.0 can read
the result with `three/addons/loaders/HDRLoader.js`; use the returned linear HDR
texture with equirectangular reflection mapping / PMREM for environment lighting.
