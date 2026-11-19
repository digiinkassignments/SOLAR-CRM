# Website 3D dependency

`solar_landing_page/assets/vendor/three-0.187.0.min.js` is a local ESM bundle built from the official npm `three@0.187.0` package. Only exports referenced by `solar-scene.js` are retained. It was bundled using the existing frontend Rolldown 1.2.1 toolchain. The MIT license is retained in `solar_landing_page/assets/vendor/THREE-LICENSE.txt` and the generated bundle.

The original scene implementation is `solar_landing_page/solar-scene.js`. It creates geometry locally; no customer data, external models or remote texture services are used.

Inter/Manrope fonts are self-hosted in `solar_landing_page/assets/fonts/` with their SIL Open Font Licenses. Font sources: the Google Fonts Inter and Manrope repositories. The public page uses Latin subsets with system-font fallback for other scripts.

Keep the package pinned and re-run visual, fallback and mobile loading checks when rebuilding or upgrading the renderer.
