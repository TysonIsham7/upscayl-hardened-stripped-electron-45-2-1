# Upscayl Hardened (unofficial fork)

**This is an unofficial fork.** It is based on [Upscayl](https://github.com/upscayl/upscayl). It is not affiliated with the Upscayl project. Names and trademarks remain with their owners.

This tree is Tyson Isham’s hardened desktop shell: **Electron 45.2.1**, telemetry removed, auto-update off. The NCNN/Vulkan upscaler and models are the upstream binaries. A Vulkan-capable GPU is still required to upscale.

Source and issues: https://github.com/TysonIsham7/upscayl-hardened-stripped-electron-45-2-1

Do not download release zips from the upstream Upscayl project if you want this fork. Those builds are the stock app. Build this repository from source.

## License

GNU Affero General Public License v3.0. See `LICENSE` and `NOTICE`. Upstream commit this fork started from: `a00d55fee90e0f9435d5eaa86e76700df8199af8`.

Mac builds produced by the scripts below are ad-hoc signed and are not notarized unless you set your own Apple notarization environment variables. Gatekeeper may require a right-click Open the first time.

## No telemetry

This fork does not collect data. PostHog, Firebase, the cloud waitlist, Termbin log upload, and the upstream `news.md` fetch are removed. Nothing sends platform, CPU, GPU, or app version off the machine. Auto-update is off (`ENABLE_AUTO_UPDATE` in `common/feature-flags.ts`), so the app does not check GitHub for updates.

Clicked links (docs, GitHub, donate) and a YouTube embed on a later onboarding step open only after you reach them. They do not run at launch.

## Build

Node.js 22 or newer. Use `npm install`, not `npm ci`. The lockfile may still be the upstream lock and will not match this `package.json`.

```bash
git clone https://github.com/TysonIsham7/upscayl-hardened-stripped-electron-45-2-1.git
cd upscayl-hardened-stripped-electron-45-2-1
npm install
```

Apple Silicon:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:mac-arm64
```

The app is `dist/mac-arm64/Upscayl.app`. macOS 13 or newer. To replace a local Upscayl install, quit it, then copy that `.app` to `/Applications`. The bundle id is still `org.upscayl.Upscayl`.

Universal (Intel + Apple Silicon): `CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:mac`.

Linux unpacked check: `npm run dist:linux-dir`.

## Security

- Electron `45.2.1` exactly. Chromium 156 / Node 24 in the shell.
- `webSecurity: true`. `contextIsolation: true`. `sandbox: true`. `nodeIntegration: false`.
- Image, slider, and lens previews load `media://` URLs. The main process serves a file only if that path was already allowed: an open-dialog selection, a file dropped through `webUtils.getPathForFile`, a paste file this process wrote, or an upscale input/output path this process is handling. Other `media://` paths return 403.
- Bundled comparison images stay on `public://`, limited to the app’s public/out directory.
- The production `file://` handler only serves the packaged renderer. It does not hand out the rest of the disk.
- Auto-update stays off so this build is not replaced by an official Upscayl release.
