#!/usr/bin/env python3
"""Mix: Gemini voice + brag music bed (ducked under the voice) + brag/Kenney SFX on visible actions + soft air whooshes
on the camera whips. Times come from src/timeline.js (exported to audio/timeline.json by scripts/cues.mjs)."""
import json, pathlib, subprocess
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io.wavfile import write

SR = 48000
here = pathlib.Path(__file__).parent
REPO = here.parents[2]
SFX = REPO / 'skills/brag/assets/sfx'
MUSIC = REPO / 'skills/brag/assets/music/happy-beats-business-moves-vol-11-by-ende-dot-app.mp3'
tl = json.loads((here / 'timeline.json').read_text())
T, ITEMS, DUR = tl['T'], tl['ITEMS'], tl['DURATION']
N = int(SR * DUR)

def load(path, ch=2):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le', '-ac', str(ch), '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).copy()

fx = np.zeros((N, 2), np.float32)
def put(name, t, db=0.0, pan=0.0):
    y = load(SFX / name)
    y = y / (np.max(np.abs(y)) + 1e-9) * 10 ** (db / 20)
    y[:, 0] *= np.sqrt((1 - pan) / 2) * 1.414; y[:, 1] *= np.sqrt((1 + pan) / 2) * 1.414
    i = int(t * SR); j = min(N, i + len(y)); fx[i:j] += y[:j - i]

rng = np.random.default_rng(3)
def whoosh(t, d=0.6, db=-14, direction=1):
    n = int(d * SR); tt = np.arange(n) / SR; x = rng.standard_normal(n)
    out = np.zeros(n); blk = 1024
    centers = 350 + 2400 * np.sin(np.pi * tt / d) ** 2
    for i in range(0, n, blk):
        c = centers[min(i + blk // 2, n - 1)]
        seg = x[max(0, i - 2048):i + blk]
        f = sosfilt(butter(2, [max(80, c * 0.45), min(SR / 2 - 100, c * 1.6)], fs=SR, btype='bandpass', output='sos'), seg)
        out[i:i + blk] = f[-len(out[i:i + blk]):]
    env = np.exp(-((tt / d - 0.55) / 0.22) ** 2); y = out * env; y /= np.max(np.abs(y)) + 1e-9; y *= 10 ** (db / 20)
    p = np.linspace(-0.6 * direction, 0.6 * direction, n)
    i = int(t * SR); j = min(N, i + n)
    fx[i:j, 0] += (y * np.sqrt((1 - p) / 2) * 1.414)[:j - i]; fx[i:j, 1] += (y * np.sqrt((1 + p) / 2) * 1.414)[:j - i]

# hook: one card lands per spoken item, the dollar card lands harder
put('impact/impactSoft_heavy_002.ogg', 0.0, -8)
for k, it in enumerate(ITEMS):
    put('casino/card-place-%d.ogg' % (k % 4 + 1), it['at'] + 0.05, -10, pan=(k - 2) * 0.2)
    if k == len(ITEMS) - 1: put('impact/impactSoft_medium_001.ogg', it['at'] + 0.12, -6)
put('casino/card-fan-2.ogg', T['merge'] + 0.02, -12)
put('impact/impactBell_heavy_000.ogg', T['merge'] + 0.45, -16)
# camera whips through the world
for i, key in enumerate(['toGlobal', 'toLocal', 'reveal', 'toTg', 'toKh', 'toTech', 'toEnd']):
    whoosh(T[key] - 0.05, 0.65 if key != 'reveal' else 0.85, -13, 1 if i % 2 == 0 else -1)
# tiles leaving each screen
for i in range(4): put('casino/card-slide-%d.ogg' % (i + 1), T['toGlobal'] + 0.6 + i * 0.1, -16, pan=0.4)
for i in range(3): put('casino/card-slide-%d.ogg' % (i + 5), T['toLocal'] + 0.6 + i * 0.1, -16, pan=-0.4)
put('casino/card-slide-8.ogg', T['toKh'] + 0.65, -16, pan=-0.4)
# rows the voice names
for t in [12.0, 12.75, 17.65, 18.35, 19.05]: put('ui/rollover2.ogg', t, -18)
# typing the username, then the taps
for i in range(8): put('keyboard/keypress-%03d.wav' % (i % 10 + 1), T['typeStart'] + i * T['typeStep'], -15)
for t in [15.4, T['tgTap'], T['khTap'], T['techTap'], T['ordersTap']]: put('interface/click_003.ogg', t, -9)
put('interface/switch_007.ogg', T['tgChip'], -16)
for t in [T['toTg'] + 0.7, T['toKh'] + 0.75, T['ordersTap'] + 0.1]: put('ui/rollover2.ogg', t, -18)
# the end: the mark lands, the store button
put('impact/impactSoft_heavy_004.ogg', T['toEnd'] + 0.5, -7)
put('impact/impactBell_heavy_003.ogg', T['toEnd'] + 0.55, -15)
put('interface/click_002.ogg', T['toEnd'] + 1.6, -14)

voice = load(here / 'voice.wav')[:N]
v = np.zeros((N, 2), np.float32); v[:len(voice)] = voice
v /= np.max(np.abs(v)) + 1e-9; v *= 0.8

music = load(MUSIC)[:N]
m = np.zeros((N, 2), np.float32); m[:len(music)] = music
m /= np.max(np.abs(m)) + 1e-9
# duck the bed under the voice: envelope from the voice level, smoothed
env = np.abs(v[:, 0]); win = int(0.25 * SR)
env = np.convolve(env, np.ones(win) / win, mode='same'); env /= env.max() + 1e-9
duck = 10 ** ((-20 - 9 * np.clip(env * 6, 0, 1)) / 20)  # -20 dB bed, down to -29 dB under speech
t = np.arange(N) / SR
fade = np.clip(t / 0.6, 0, 1) * np.clip((DUR - t) / 2.5, 0, 1)
m *= (duck * fade)[:, None]
# lift the bed on the end card when the voice stops
lift = 1 + 1.2 * np.clip((t - (T['toEnd'] + 5.3)) / 0.8, 0, 1) * np.clip((DUR - 0.3 - t) / 1.5, 0, 1)
m *= lift[:, None]

mix = v + m + fx * 0.9
mix /= max(1.0, np.max(np.abs(mix)) / 0.95)
write(here / 'mix_raw.wav', SR, (mix * 32767).astype(np.int16))
print('ok', DUR)
