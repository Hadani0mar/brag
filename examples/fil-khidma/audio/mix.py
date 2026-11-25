#!/usr/bin/env python3
"""Procedural foley for the film. Reads audio/cues.json (from src/timeline.js), writes audio/mix_raw.wav.
Every sound sits on a visible event; no music, no bubbles, dings or risers."""
import json, pathlib
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io.wavfile import write

SR = 48000
here = pathlib.Path(__file__).parent
cfg = json.loads((here / 'cues.json').read_text())
N = int(SR * cfg['duration'])
L = np.zeros(N); R = np.zeros(N); SEND = np.zeros(N)
rng = np.random.default_rng(7)

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], fs=SR, btype='bandpass', output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, fs=SR, btype='lowpass', output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, fs=SR, btype='highpass', output='sos'), x)
def tt(d): return np.arange(int(SR * d)) / SR
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
def sweep_sine(f0, f1, d, tau):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t / tau); return np.sin(2 * np.pi * np.cumsum(f) / SR)

def boom(seed):
    t = tt(2.2); body = sweep_sine(70, 34, 2.2, 0.25) * np.exp(-t / 0.75)
    thump = lp(rng.standard_normal(len(t)), 180) * np.exp(-t / 0.08) * 2.5
    return norm(body + thump), 0.0, 0.25

def hit(seed):
    t = tt(1.4); body = sweep_sine(140, 46, 1.4, 0.05) * np.exp(-t / 0.32)
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.004) * 0.5
    crack = bp(rng.standard_normal(len(t)), 300, 2400) * np.exp(-t / 0.05) * 0.6
    return norm(body + click + crack), 0.0, 0.45

def thud(seed):
    t = tt(0.5); body = sweep_sine(170, 62, 0.5, 0.03) * np.exp(-t / 0.13)
    snap = bp(rng.standard_normal(len(t)), 900, 5000) * np.exp(-t / 0.012) * 0.45
    return norm(body + snap), 0.0, 0.3

def air(d):
    t = tt(d); n = lp(hp(rng.standard_normal(len(t)), 200), 2500)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return norm(n * env), 0.0, 0.1

def whoosh(d, pan_from=-0.7, pan_to=0.7):
    t = tt(d); x = rng.standard_normal(len(t)); out = np.zeros(len(t))
    # band sweeps up then settles: a body passing the mic
    centers = 380 + 2600 * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    blk = 1024
    for i in range(0, len(t), blk):
        c = centers[min(i + blk // 2, len(t) - 1)]
        seg = x[max(0, i - 2048):i + blk]
        f = bp(seg, max(80, c * 0.45), min(SR / 2 - 100, c * 1.6))
        out[i:i + blk] = f[-len(out[i:i + blk]):]
    p = np.clip(t / d, 0, 1); env = np.exp(-((p - 0.58) / 0.22) ** 2)
    low = lp(rng.standard_normal(len(t)), 260) * env * 0.6
    return norm(out * env + low), (pan_from, pan_to), 0.25

def card(seed):
    t = tt(0.12); flick = bp(rng.standard_normal(len(t)), 1800, 7000) * np.exp(-t / 0.014)
    tap = np.sin(2 * np.pi * 520 * t) * np.exp(-t / 0.02) * 0.35
    return norm(flick + tap), float(rng.uniform(-0.5, 0.5)), 0.15

def key(seed):
    t = tt(0.06); c = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.0035)
    body = np.sin(2 * np.pi * 1750 * t) * np.exp(-t / 0.008) * 0.45
    return norm(c + body), float(rng.uniform(-0.15, 0.15)), 0.05

def tap(seed):
    t = tt(0.12); h = np.sin(2 * np.pi * 155 * t) * np.exp(-t / 0.022)
    c = bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t / 0.004) * 0.4
    return norm(h + c), 0.0, 0.08

def tick(seed):
    t = tt(0.09); c = bp(rng.standard_normal(len(t)), 2200, 8000) * np.exp(-t / 0.006)
    ring = np.sin(2 * np.pi * 2900 * t) * np.exp(-t / 0.018) * 0.25
    return norm(c + ring), 0.2, 0.2

swaps = 0
for c in cfg['cues']:
    k = c['kind']; g = c.get('gain', 0.5)
    if k == 'boom': y, pan, rv = boom(0)
    elif k == 'hit': y, pan, rv = hit(0)
    elif k == 'thud': y, pan, rv = thud(0)
    elif k == 'air': y, pan, rv = air(c.get('dur', 2))
    elif k in ('whoosh', 'swish'):
        swaps += 1; a = -0.7 if swaps % 2 else 0.7
        y, pan, rv = whoosh(c.get('dur', 0.7), a, -a)
        if k == 'swish': y = hp(y, 700)
    elif k == 'card': y, pan, rv = card(0)
    elif k == 'key': y, pan, rv = key(0)
    elif k == 'tap': y, pan, rv = tap(0)
    elif k == 'tick': y, pan, rv = tick(0)
    else: continue
    i = int(c['t'] * SR); j = min(N, i + len(y)); y = y[:j - i] * g
    if isinstance(pan, tuple):
        p = np.linspace(pan[0], pan[1], len(y))
    else:
        p = np.full(len(y), pan)
    L[i:j] += y * np.sqrt((1 - p) / 2) * 1.414; R[i:j] += y * np.sqrt((1 + p) / 2) * 1.414; SEND[i:j] += y * rv

# a small room for the send
ir_t = tt(1.6); ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.35); ir = lp(ir, 5000); ir /= np.sum(np.abs(ir)) ** 0.5 * 6
rv = fftconvolve(SEND, ir)[:N]; rvR = fftconvolve(SEND, np.roll(ir, 211))[:N]
L += rv; R += rvR
# a faint room tone so the gaps are never digital silence
bed = lp(hp(rng.standard_normal(N), 60), 900) * 0.006
L += bed; R += np.roll(bed, 400)
fade = np.minimum(1, (N - np.arange(N)) / (SR * 1.2)); L *= fade; R *= fade
m = max(np.max(np.abs(L)), np.max(np.abs(R)))
out = np.stack([L, R], 1) / m * 0.89
write(here / 'mix_raw.wav', SR, (out * 32767).astype(np.int16))
print('wrote', here / 'mix_raw.wav', N / SR, 's', len(cfg['cues']), 'cues')
