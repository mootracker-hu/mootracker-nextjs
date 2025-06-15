[00:06:26.969] Running build in Washington, D.C., USA (East) – iad1
[00:06:26.970] Build machine configuration: 2 cores, 8 GB
[00:06:26.985] Cloning github.com/mootracker-hu/mootracker-nextjs (Branch: main, Commit: 50bb96e)
[00:06:27.249] Cloning completed: 264.000ms
[00:06:28.289] Restored build cache from previous deployment (HdhPVSC9pAfKSCizHttTpwZ241ME)
[00:06:28.769] Running "vercel build"
[00:06:29.210] Vercel CLI 42.2.0
[00:06:29.504] Installing dependencies...
[00:06:30.823] 
[00:06:30.824] up to date in 1s
[00:06:30.824] 
[00:06:30.825] 155 packages are looking for funding
[00:06:30.825]   run `npm fund` for details
[00:06:30.858] Detected Next.js version: 15.3.3
[00:06:30.863] Running "npm run build"
[00:06:30.981] 
[00:06:30.982] > mootracker-nextjs@0.1.0 build
[00:06:30.982] > next build
[00:06:30.982] 
[00:06:31.806]  ⚠ Found lockfile missing swc dependencies, run next locally to automatically patch
[00:06:31.978]    ▲ Next.js 15.3.3
[00:06:31.979] 
[00:06:32.012]    Creating an optimized production build ...
[00:06:32.714]  ⚠ Found lockfile missing swc dependencies, run next locally to automatically patch
[00:06:35.449]  ⚠ Found lockfile missing swc dependencies, run next locally to automatically patch
[00:06:36.481]  ⚠ Found lockfile missing swc dependencies, run next locally to automatically patch
[00:06:38.884]  ✓ Compiled successfully in 3.0s
[00:06:38.889]    Linting and checking validity of types ...
[00:06:43.365] Failed to compile.
[00:06:43.365] 
[00:06:43.365] ./src/app/dashboard/animals/new/page.tsx:241:72
[00:06:43.366] Type error: This comparison appears to be unintentional because the types '"hímivar" | "nőivar"' and '""' have no overlap.
[00:06:43.366] 
[00:06:43.366] [0m [90m 239 |[39m[0m
[00:06:43.366] [0m [90m 240 |[39m   [90m// Kategória előnézet[39m[0m
[00:06:43.366] [0m[31m[1m>[22m[39m[90m 241 |[39m   [36mconst[39m previewCategory [33m=[39m formData[33m.[39mszuletesi_datum [33m&&[39m formData[33m.[39mivar [33m&&[39m formData[33m.[39mivar [33m!==[39m [32m''[39m[0m
[00:06:43.367] [0m [90m     |[39m                                                                        [31m[1m^[22m[39m[0m
[00:06:43.367] [0m [90m 242 |[39m     [33m?[39m calculateCategory(formData[33m.[39mszuletesi_datum[33m,[39m formData[33m.[39mivar [36mas[39m [32m'hímivar'[39m [33m|[39m [32m'nőivar'[39m)[0m
[00:06:43.367] [0m [90m 243 |[39m     [33m:[39m [32m''[39m[33m;[39m[0m
[00:06:43.367] [0m [90m 244 |[39m[0m
[00:06:43.389] Next.js build worker exited with code: 1 and signal: null
[00:06:43.409] Error: Command "npm run build" exited with 1
[00:06:44.114] 
[00:06:46.878] Exiting build container
