# في الخدمة — Motion film

A 36-second vertical (1080×1920, 30 fps) motion piece for the Libyan app **في الخدمة** (`ly.zeko.inwork`), built from the app's real screens.

## What's in it

| Part | Source |
|---|---|
| 3D iPhone (Cosmic Orange), shadows, camera | **Center Stage** engine from [React Bits](https://github.com/DavidHDev/react-bits) (`src/tools/center-stage/engine`, MIT), vendored in `vendor/center-stage-engine` with one added `script` motion kind so the film drives every frame |
| Backgrounds | React Bits **Grainient** shaders, ported to the film clock (`src/grainient.js`) |
| Text motion | React Bits BlurText, RotatingText, ShinyText, CountUp, DecryptedText, re-written as pure functions of time |
| UI satellites | **stageshow** kit parts: `Notification`, `Chip`, `Badge` (`vendor/stageshow-kit`) |
| Screens | The user's own screenshots; the phone number on the profile screen is masked |
| Logos | App icon from its Google Play listing; Google Play mark from m0usasvg |
| Sound | Procedural foley (`audio/mix.py`): hits, whooshes on each spin, key clicks while typing, taps. No music |

Scenes: hook → global cards (floating 3D tiles) → local cards (Libyana, Al Madar, LTT) → Telegram (live typing) → Khalis electricity → streamers (live rings) → five-phone gallery → profile → end card.

## Build

```bash
npm i
node build.mjs                      # bundles src/film.tsx → hf/ (also a HyperFrames composition)
node scripts/serve.mjs . 5177 &     # static server
node scripts/record.mjs stills out/st 2.7 5.5 13.3      # check frames
Q="?samples=4&preview=1&res=0.75" node scripts/record.mjs frames out/frames 0 1080   # fast path, ~10 min on CPU
node scripts/cues.mjs && python3 audio/mix.py
ffmpeg -i audio/mix_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 audio/mix.wav
ffmpeg -framerate 30 -i out/frames/f%05d.jpg -i audio/mix.wav -c:v libx264 -crf 23 -maxrate 10M -bufsize 20M -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart fil-khidma.mp4
```

All timing lives in `src/timeline.js`; the picture and the sound both read it.
