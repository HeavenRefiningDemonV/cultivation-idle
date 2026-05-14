#!/usr/bin/env python3
"""Render the Cultivation Idle story capture as a polished prologue edit.

The source MP4 is treated as read-only. This script creates procedural audio
stems, applies conservative screen-recording cleanup masks, renders the final
MP4/WAV, and writes a QA contact sheet plus an edit report.
"""

from __future__ import annotations

import json
import math
import os
import random
import shutil
import statistics
import subprocess
import sys
import wave
from array import array
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "build"
DIST = ROOT / "dist"
AUDIO_BUILD = BUILD / "audio"
TEMP = BUILD / "temp"
QA_BUILD = BUILD / "qa_frames"
INSPECT = BUILD / "video_inspect"
PYDEPS = BUILD / "video_pydeps"
NODE_TOOLS = BUILD / "video_node"

FINAL_MP4 = DIST / "Cultivation_Idle_Story_Edit_v1.mp4"
FINAL_WAV = DIST / "Cultivation_Idle_Story_Edit_v1.wav"
FINAL_REPORT = DIST / "edit_report.md"
QA_CONTACT_SHEET = DIST / "qa_contact_sheet.jpg"

SR = 48_000
CHANNELS = 2
SOURCE_CANDIDATES = [
    ROOT / "Vids" / "Cultivation Idle Story.mp4",
    ROOT / "Cultivation Idle Story.mp4",
    ROOT / "input" / "Cultivation Idle Story.mp4",
    ROOT / "media" / "Cultivation Idle Story.mp4",
    ROOT / "assets" / "Cultivation Idle Story.mp4",
]

QA_TIMES = [0.5, 2.0, 4.0, 8.6, 10.5, 14.8, 16.0, 20.5, 24.5, 25.5, 26.5]

TIMELINE = [
    ("Scene 1", 0.000, 3.866, "Pinewind Establishing / Forgotten Smallness"),
    ("Scene 2", 3.866, 8.533, "Gate Ritual / The Stone Goes Silent"),
    ("Scene 3", 8.533, 14.300, "Names Fade / World Forgets the Living"),
    ("Scene 4", 14.300, 19.900, "Keeper Yan Sacrifice / Qi Impact"),
    ("Scene 5", 19.900, 25.233, "The Dao Choice Appears / Three Path Banners"),
    ("Scene 6", 25.233, 26.900, "Path Selection UI / Final Hover State"),
]

AUDIO_CUES = [
    ("00:00.000", "Fade-in, low wind, low root drone"),
    ("00:01.250", "Distant bronze bell / temple chime"),
    ("00:03.550", "Low stone rumble under village"),
    ("00:03.866", "Gate resonance and ritual hush enter"),
    ("00:05.450", "Paper / brush texture and restrained ritual shimmer"),
    ("00:07.700", "Stone-silence collapse: music ducks into air-suck"),
    ("00:08.533", "Spectral gust and glass-dust shimmer"),
    ("00:09.300-13.000", "Low pulses, whispers, particle shimmer"),
    ("00:14.050", "Breath intake / low drum swell into Keeper Yan action"),
    ("00:14.920", "Cloth sweep and qi charge"),
    ("00:15.050", "Main qi impact: low thump, stone resonance, crackle, debris"),
    ("00:15.650", "Breath release and grief dip"),
    ("00:19.900", "Reverse swell into page-opening / book-awakening"),
    ("00:20.100-24.900", "Heaven, Earth, and Martial path motifs"),
    ("00:24.700", "Choose Path ritual chime and parchment UI sound"),
    ("00:25.233", "Path card reveal shimmer / soft whoosh"),
    ("00:26.350", "Final seal / brush touch and fade-out"),
]


def run(cmd: list[str], *, capture: bool = False, check: bool = True) -> subprocess.CompletedProcess[str]:
    print("+ " + " ".join(f'"{c}"' if " " in c else c for c in cmd))
    return subprocess.run(
        cmd,
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
        check=check,
    )


def mkdirs() -> None:
    for path in (BUILD, DIST, AUDIO_BUILD, TEMP, QA_BUILD, INSPECT):
        path.mkdir(parents=True, exist_ok=True)


def find_source() -> Path:
    for candidate in SOURCE_CANDIDATES:
        if candidate.exists():
            return candidate
    matches = list(ROOT.rglob("Cultivation Idle Story.mp4"))
    if matches:
        return matches[0]
    raise FileNotFoundError("Could not find Cultivation Idle Story.mp4 in Vids/, root, input/, media/, or assets/.")


def ensure_ffmpeg() -> str:
    existing = shutil.which("ffmpeg")
    if existing:
        return existing

    sys.path.insert(0, str(PYDEPS))
    try:
        import imageio_ffmpeg  # type: ignore
    except Exception:
        run([sys.executable, "-m", "pip", "install", "--target", str(PYDEPS), "imageio-ffmpeg"])
        sys.path.insert(0, str(PYDEPS))
        import imageio_ffmpeg  # type: ignore

    return str(imageio_ffmpeg.get_ffmpeg_exe())


def ensure_ffprobe() -> str | None:
    existing = shutil.which("ffprobe")
    if existing:
        return existing

    local = NODE_TOOLS / "node_modules" / "ffprobe-static" / "bin" / "win32" / "x64" / "ffprobe.exe"
    if local.exists():
        return str(local)

    npm = shutil.which("npm")
    if npm:
        try:
            run([npm, "install", "--prefix", str(NODE_TOOLS), "ffprobe-static"])
        except subprocess.CalledProcessError:
            return None
        if local.exists():
            return str(local)

    return None


def ffprobe_json(ffprobe: str | None, ffmpeg: str, video: Path, output_path: Path) -> dict:
    if ffprobe:
        result = run(
            [
                ffprobe,
                "-hide_banner",
                "-v",
                "error",
                "-show_format",
                "-show_streams",
                "-print_format",
                "json",
                str(video),
            ],
            capture=True,
        )
        data = json.loads(result.stdout)
        output_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return data

    # Fallback keeps the script usable if ffprobe-static cannot be installed.
    result = run([ffmpeg, "-hide_banner", "-i", str(video), "-f", "null", "-"], capture=True, check=False)
    fallback = {"ffprobe_unavailable": True, "ffmpeg_banner": result.stderr}
    output_path.write_text(json.dumps(fallback, indent=2), encoding="utf-8")
    return fallback


def get_duration(meta: dict) -> float:
    try:
        return float(meta["format"]["duration"])
    except Exception:
        return 26.9


def format_time(seconds: float) -> str:
    minutes = int(seconds // 60)
    sec = seconds - minutes * 60
    return f"{minutes:02d}:{sec:04.1f}"


def sample_count(duration: float) -> int:
    return int(round(duration * SR))


def new_stem(n: int) -> tuple[array, array]:
    return array("f", [0.0]) * n, array("f", [0.0]) * n


def pan_gains(pan: float) -> tuple[float, float]:
    p = max(-1.0, min(1.0, pan))
    angle = (p + 1.0) * math.pi / 4.0
    return math.cos(angle), math.sin(angle)


def env_linear(pos: float, dur: float, attack: float, release: float) -> float:
    if dur <= 0:
        return 0.0
    if attack > 0 and pos < attack:
        return pos / attack
    if release > 0 and pos > dur - release:
        return max(0.0, (dur - pos) / release)
    return 1.0


def add_sine(
    stem: tuple[array, array],
    start: float,
    dur: float,
    freq: float,
    amp: float,
    *,
    pan: float = 0.0,
    attack: float = 0.05,
    release: float = 0.2,
    decay: float | None = None,
    phase: float = 0.0,
) -> None:
    left, right = stem
    n = len(left)
    l_gain, r_gain = pan_gains(pan)
    a = max(0, int(start * SR))
    b = min(n, int((start + dur) * SR))
    two_pi_freq = 2.0 * math.pi * freq
    for i in range(a, b):
        t = i / SR - start
        env = env_linear(t, dur, attack, release)
        if decay:
            env *= math.exp(-decay * t)
        value = math.sin(two_pi_freq * t + phase) * amp * env
        left[i] += value * l_gain
        right[i] += value * r_gain


def add_chime(
    stem: tuple[array, array],
    start: float,
    freq: float,
    amp: float,
    *,
    dur: float = 3.0,
    pan: float = 0.0,
    decay: float = 1.8,
) -> None:
    add_sine(stem, start, dur, freq, amp, pan=pan, attack=0.006, release=0.35, decay=decay)
    add_sine(stem, start, dur * 0.85, freq * 1.498, amp * 0.45, pan=pan * 0.8, attack=0.004, release=0.3, decay=decay * 1.15)
    add_sine(stem, start + 0.012, dur * 0.65, freq * 2.015, amp * 0.22, pan=pan, attack=0.004, release=0.24, decay=decay * 1.35)
    add_sine(stem, start + 0.19, dur * 0.55, freq * 1.002, amp * 0.16, pan=pan * -0.6, attack=0.004, release=0.22, decay=decay * 1.4)


def add_pluck(stem: tuple[array, array], start: float, freq: float, amp: float, *, pan: float = 0.0) -> None:
    add_sine(stem, start, 2.6, freq, amp, pan=pan, attack=0.004, release=0.2, decay=2.35)
    add_sine(stem, start + 0.004, 1.4, freq * 2.01, amp * 0.28, pan=pan, attack=0.002, release=0.15, decay=3.2)


def add_noise(
    stem: tuple[array, array],
    start: float,
    dur: float,
    amp: float,
    *,
    pan: float = 0.0,
    attack: float = 0.08,
    release: float = 0.25,
    seed: int = 1,
    smooth: float = 0.93,
    high_sparkle: bool = False,
) -> None:
    left, right = stem
    n = len(left)
    rng = random.Random(seed)
    l_gain, r_gain = pan_gains(pan)
    a = max(0, int(start * SR))
    b = min(n, int((start + dur) * SR))
    low_l = 0.0
    low_r = 0.0
    last_l = 0.0
    last_r = 0.0
    for i in range(a, b):
        t = i / SR - start
        env = env_linear(t, dur, attack, release)
        raw_l = rng.uniform(-1.0, 1.0)
        raw_r = rng.uniform(-1.0, 1.0)
        low_l = smooth * low_l + (1.0 - smooth) * raw_l
        low_r = smooth * low_r + (1.0 - smooth) * raw_r
        if high_sparkle:
            value_l = (raw_l - last_l) * 0.55 + low_l * 0.12
            value_r = (raw_r - last_r) * 0.55 + low_r * 0.12
        else:
            value_l = low_l
            value_r = low_r
        last_l = raw_l
        last_r = raw_r
        left[i] += value_l * amp * env * l_gain
        right[i] += value_r * amp * env * r_gain


def add_drum(stem: tuple[array, array], start: float, amp: float, *, freq: float = 58.0, dur: float = 1.2, pan: float = 0.0) -> None:
    left, right = stem
    n = len(left)
    l_gain, r_gain = pan_gains(pan)
    a = max(0, int(start * SR))
    b = min(n, int((start + dur) * SR))
    phase = 0.0
    for i in range(a, b):
        t = i / SR - start
        p = t / dur
        local_freq = freq * (1.0 + 1.8 * math.exp(-8.0 * p))
        phase += 2.0 * math.pi * local_freq / SR
        env = math.exp(-5.0 * t) * env_linear(t, dur, 0.002, 0.22)
        value = math.sin(phase) * amp * env
        left[i] += value * l_gain
        right[i] += value * r_gain


def add_reverse_swell(stem: tuple[array, array], start: float, dur: float, amp: float, *, pan: float = 0.0, seed: int = 9) -> None:
    left, right = stem
    n = len(left)
    rng = random.Random(seed)
    l_gain, r_gain = pan_gains(pan)
    a = max(0, int(start * SR))
    b = min(n, int((start + dur) * SR))
    state_l = 0.0
    state_r = 0.0
    for i in range(a, b):
        t = i / SR - start
        p = max(0.0, min(1.0, t / dur))
        env = p * p * (3.0 - 2.0 * p)
        state_l = 0.83 * state_l + 0.17 * rng.uniform(-1.0, 1.0)
        state_r = 0.83 * state_r + 0.17 * rng.uniform(-1.0, 1.0)
        value_l = state_l * amp * env
        value_r = state_r * amp * env
        left[i] += value_l * l_gain
        right[i] += value_r * r_gain


def write_wav(path: Path, stem: tuple[array, array], *, gain: float = 1.0) -> None:
    left, right = stem
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(CHANNELS)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        frames = bytearray()
        for l, r in zip(left, right):
            li = int(max(-1.0, min(1.0, l * gain)) * 32767.0)
            ri = int(max(-1.0, min(1.0, r * gain)) * 32767.0)
            frames += li.to_bytes(2, "little", signed=True)
            frames += ri.to_bytes(2, "little", signed=True)
        wav.writeframes(frames)


def generate_audio_stems(duration: float) -> dict[str, Path]:
    n = sample_count(duration)
    ambience = new_stem(n)
    music = new_stem(n)
    sfx = new_stem(n)

    # Ambience: wind/mist, village hush, ritual air, spectral texture.
    add_noise(ambience, 0.0, duration, 0.052, seed=100, smooth=0.994, attack=0.4, release=0.8, pan=-0.15)
    add_noise(ambience, 0.0, 3.9, 0.026, seed=101, smooth=0.985, attack=0.5, release=0.8, pan=0.2)
    add_noise(ambience, 3.65, 5.1, 0.032, seed=102, smooth=0.975, attack=0.4, release=0.6, pan=0.05)
    add_noise(ambience, 8.45, 6.1, 0.046, seed=103, smooth=0.90, attack=0.08, release=0.7, pan=-0.05, high_sparkle=True)
    add_noise(ambience, 14.2, 5.9, 0.038, seed=104, smooth=0.92, attack=0.08, release=0.9, pan=0.08, high_sparkle=True)
    add_noise(ambience, 19.85, 7.0, 0.032, seed=105, smooth=0.965, attack=0.2, release=0.7, pan=0.0)

    # Music: sparse modal drone and path identity motifs.
    add_sine(music, 0.0, duration, 55.0, 0.028, attack=0.7, release=0.9)
    add_sine(music, 0.0, duration, 110.0, 0.012, attack=1.0, release=0.8, pan=-0.08)
    for t, f, p in [(0.85, 146.83, -0.22), (2.25, 196.0, 0.18), (3.15, 164.81, -0.12)]:
        add_pluck(music, t, f, 0.038, pan=p)
    add_sine(music, 3.55, 5.2, 73.42, 0.035, attack=0.35, release=0.65, pan=0.05)
    add_sine(music, 5.3, 3.2, 293.66, 0.013, attack=0.25, release=0.8, pan=0.28)
    add_sine(music, 8.45, 6.2, 46.25, 0.037, attack=0.18, release=0.7, pan=-0.05)
    add_sine(music, 8.6, 5.8, 207.65, 0.014, attack=0.4, release=0.8, pan=0.18)
    add_sine(music, 13.35, 2.2, 61.74, 0.04, attack=0.2, release=0.65)
    add_sine(music, 15.25, 4.6, 82.41, 0.028, attack=0.2, release=0.9)
    add_pluck(music, 16.2, 130.81, 0.027, pan=-0.18)
    add_pluck(music, 18.25, 146.83, 0.023, pan=0.15)
    # Scene 5/6 path motifs.
    for t in [20.2, 21.65, 23.0, 24.3, 25.55]:
        add_chime(music, t, 659.25, 0.018, dur=2.1, pan=-0.45, decay=1.9)  # Heaven
    for t in [20.55, 22.1, 24.0, 25.75]:
        add_sine(music, t, 2.4, 98.0, 0.026, attack=0.025, release=0.45, decay=1.1, pan=0.0)  # Earth
    for t in [20.9, 22.55, 24.55, 25.95]:
        add_pluck(music, t, 392.0, 0.018, pan=0.42)  # Martial

    # SFX: event accents.
    add_chime(sfx, 1.25, 392.0, 0.095, dur=3.0, pan=-0.18, decay=1.45)
    add_sine(sfx, 3.55, 2.6, 43.65, 0.06, attack=0.18, release=0.5, decay=0.25)
    add_chime(sfx, 5.55, 587.33, 0.036, dur=2.0, pan=0.22, decay=2.1)
    add_noise(sfx, 5.2, 1.4, 0.02, seed=210, smooth=0.68, attack=0.02, release=0.25, pan=-0.2, high_sparkle=True)
    add_reverse_swell(sfx, 7.58, 0.55, 0.045, seed=211)
    add_sine(sfx, 7.72, 0.72, 82.41, 0.06, attack=0.02, release=0.35, decay=0.9)
    add_noise(sfx, 8.53, 1.35, 0.078, seed=212, smooth=0.82, attack=0.01, release=0.42, high_sparkle=True)
    for t in [9.35, 10.95, 12.55, 14.05]:
        add_drum(sfx, t, 0.055, freq=48.0, dur=0.9)
    for t in [9.0, 9.7, 10.6, 11.3, 12.1, 13.2]:
        add_chime(sfx, t, random.Random(int(t * 100)).choice([740.0, 830.6, 987.8]), 0.022, dur=1.4, pan=random.Random(int(t * 90)).uniform(-0.6, 0.6), decay=2.4)
    add_reverse_swell(sfx, 14.02, 0.9, 0.075, seed=213)
    add_noise(sfx, 14.65, 0.42, 0.062, seed=214, smooth=0.72, attack=0.015, release=0.15, pan=-0.2, high_sparkle=True)
    add_sine(sfx, 14.72, 0.48, 220.0, 0.035, attack=0.02, release=0.08, decay=1.4, pan=0.1)
    add_drum(sfx, 15.05, 0.19, freq=47.0, dur=1.25)
    add_sine(sfx, 15.05, 1.25, 58.0, 0.105, attack=0.002, release=0.35, decay=2.0)
    add_chime(sfx, 15.06, 523.25, 0.06, dur=2.0, pan=0.18, decay=2.0)
    add_noise(sfx, 15.05, 1.15, 0.07, seed=215, smooth=0.76, attack=0.002, release=0.5, high_sparkle=True)
    add_noise(sfx, 15.65, 1.15, 0.034, seed=216, smooth=0.93, attack=0.08, release=0.7, pan=-0.08)
    add_noise(sfx, 17.3, 1.8, 0.024, seed=217, smooth=0.70, attack=0.05, release=0.4, pan=0.15, high_sparkle=True)
    add_reverse_swell(sfx, 19.55, 0.55, 0.066, seed=218)
    add_noise(sfx, 19.92, 1.05, 0.041, seed=219, smooth=0.74, attack=0.01, release=0.35, pan=0.0, high_sparkle=True)
    add_chime(sfx, 20.10, 440.0, 0.055, dur=2.4, pan=0.0, decay=1.75)
    add_chime(sfx, 20.62, 783.99, 0.031, dur=2.0, pan=-0.42, decay=2.1)
    add_drum(sfx, 20.92, 0.043, freq=64.0, dur=0.95, pan=0.0)
    add_chime(sfx, 21.21, 466.16, 0.031, dur=1.4, pan=0.45, decay=2.3)
    add_chime(sfx, 24.72, 622.25, 0.072, dur=1.5, pan=0.0, decay=2.2)
    add_noise(sfx, 24.78, 0.38, 0.025, seed=220, smooth=0.7, attack=0.006, release=0.18, high_sparkle=True)
    add_noise(sfx, 25.23, 0.85, 0.05, seed=221, smooth=0.82, attack=0.02, release=0.35, high_sparkle=True)
    for t, p in [(25.28, -0.45), (25.42, 0.0), (25.56, 0.45)]:
        add_chime(sfx, t, 523.25 + 90 * (p + 0.45), 0.035, dur=1.2, pan=p, decay=2.0)
    add_chime(sfx, 26.35, 293.66, 0.066, dur=1.0, pan=0.0, decay=2.4)
    add_noise(sfx, 26.35, 0.45, 0.022, seed=222, smooth=0.78, attack=0.005, release=0.32, high_sparkle=True)

    paths = {
        "ambience": AUDIO_BUILD / "ambience_bed.wav",
        "music": AUDIO_BUILD / "music_bed.wav",
        "sfx": AUDIO_BUILD / "sfx_events.wav",
        "raw_mix": AUDIO_BUILD / "final_mix_raw.wav",
    }
    write_wav(paths["ambience"], ambience)
    write_wav(paths["music"], music)
    write_wav(paths["sfx"], sfx)

    raw_mix = new_stem(n)
    for i in range(n):
        t = i / SR
        # Intentional air-suck at the Gate's silence and a post-impact music dip.
        gate_duck = 1.0 - 0.48 * max(0.0, min(1.0, (0.46 - abs(t - 7.92)) / 0.46))
        impact_dip = 1.0 - 0.24 * max(0.0, min(1.0, (1.65 - abs(t - 16.15)) / 1.65))
        fade_out = 1.0 if t < duration - 0.75 else max(0.0, (duration - t) / 0.75)
        music_gain = gate_duck * impact_dip
        raw_mix[0][i] = (ambience[0][i] * 0.78 + music[0][i] * 1.0 * music_gain + sfx[0][i] * 0.96) * fade_out
        raw_mix[1][i] = (ambience[1][i] * 0.78 + music[1][i] * 1.0 * music_gain + sfx[1][i] * 0.96) * fade_out

    peak = max(max(abs(v) for v in raw_mix[0]), max(abs(v) for v in raw_mix[1]), 1e-9)
    raw_gain = min(1.0, 0.82 / peak)
    write_wav(paths["raw_mix"], raw_mix, gain=raw_gain)
    return paths


def loudnorm_audio(ffmpeg: str, raw_mix: Path, final_wav: Path) -> tuple[str, str]:
    cmd = [
        ffmpeg,
        "-hide_banner",
        "-y",
        "-i",
        str(raw_mix),
        "-af",
        "loudnorm=I=-16:TP=-1.5:LRA=11,volume=-1.3dB,alimiter=limit=0.84",
        "-ar",
        str(SR),
        "-ac",
        "2",
        str(final_wav),
    ]
    result = run(cmd, capture=True)
    analysis = run(
        [
            ffmpeg,
            "-hide_banner",
            "-i",
            str(final_wav),
            "-af",
            "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json",
            "-f",
            "null",
            "-",
        ],
        capture=True,
        check=False,
    )
    volumedetect = run(
        [ffmpeg, "-hide_banner", "-i", str(final_wav), "-af", "volumedetect", "-f", "null", "-"],
        capture=True,
        check=False,
    )
    (BUILD / "final_loudnorm_check.txt").write_text(analysis.stderr, encoding="utf-8")
    (BUILD / "final_volumedetect.txt").write_text(volumedetect.stderr, encoding="utf-8")
    return analysis.stderr, volumedetect.stderr


def render_visual(ffmpeg: str, source: Path, duration: float) -> Path:
    visual = TEMP / "cultivation_story_visual_clean.mp4"
    fade_out_start = max(0.0, duration - 0.55)
    filters = [
        # Recording UI cleanup. Delogo is feathered internally; regions avoid subtitles.
        "delogo=x=1602:y=2:w=240:h=70:show=0:enable='between(t,0,0.85)'",
        "delogo=x=1740:y=964:w=170:h=112:show=0:enable='between(t,0,25.25)'",
        "delogo=x=20:y=1028:w=155:h=46:show=0:enable='between(t,0,25.25)'",
        "delogo=x=1274:y=638:w=54:h=58:show=0:enable='between(t,0,0.38)'",
        "delogo=x=1168:y=646:w=54:h=58:show=0:enable='between(t,0.35,0.86)'",
        "delogo=x=1840:y=1000:w=56:h=78:show=0:enable='between(t,19.65,21.25)'",
        "delogo=x=942:y=1000:w=58:h=72:show=0:enable='between(t,25.23,26.9)'",
        "eq=contrast=1.026:saturation=0.985:brightness=0.002",
        "unsharp=3:3:0.18:3:3:0.0",
        "fade=t=in:st=0:d=0.35",
        f"fade=t=out:st={fade_out_start:.3f}:d=0.55",
        "fps=30",
        "scale=1920:1080:flags=lanczos",
        "setsar=1",
        "format=yuv420p",
    ]
    run(
        [
            ffmpeg,
            "-hide_banner",
            "-y",
            "-i",
            str(source),
            "-vf",
            ",".join(filters),
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "slow",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            "-r",
            "30",
            str(visual),
        ]
    )
    return visual


def mux_final(ffmpeg: str, visual: Path, audio: Path, final_mp4: Path) -> None:
    run(
        [
            ffmpeg,
            "-hide_banner",
            "-y",
            "-i",
            str(visual),
            "-i",
            str(audio),
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "320k",
            "-ar",
            str(SR),
            "-ac",
            "2",
            "-shortest",
            "-movflags",
            "+faststart",
            str(final_mp4),
        ]
    )


def extract_labeled_frame(ffmpeg: str, video: Path, timestamp: float, out: Path) -> None:
    label = format_time(timestamp).replace(":", "\\:")
    font = "C\\:/Windows/Fonts/arial.ttf"
    vf = (
        f"scale=480:270:flags=lanczos,"
        f"drawtext=fontfile='{font}':text='{label}':x=12:y=12:fontsize=28:"
        "fontcolor=white:box=1:boxcolor=black@0.58:boxborderw=8"
    )
    run(
        [
            ffmpeg,
            "-hide_banner",
            "-y",
            "-ss",
            f"{timestamp:.3f}",
            "-i",
            str(video),
            "-frames:v",
            "1",
            "-vf",
            vf,
            "-q:v",
            "2",
            "-update",
            "1",
            str(out),
        ],
        capture=True,
    )


def build_contact_sheet(ffmpeg: str, video: Path, out: Path, times: Iterable[float]) -> None:
    frame_dir = QA_BUILD / out.stem
    if frame_dir.exists():
        shutil.rmtree(frame_dir)
    frame_dir.mkdir(parents=True, exist_ok=True)
    for idx, timestamp in enumerate(times):
        extract_labeled_frame(ffmpeg, video, timestamp, frame_dir / f"frame_{idx:02d}.jpg")
    run(
        [
            ffmpeg,
            "-hide_banner",
            "-y",
            "-framerate",
            "1",
            "-i",
            str(frame_dir / "frame_%02d.jpg"),
            "-vf",
            "tile=4x3:padding=6:margin=6:color=0x1b130d",
            "-frames:v",
            "1",
            "-q:v",
            "2",
            "-update",
            "1",
            str(out),
        ]
    )


def collect_audio_assets() -> list[str]:
    suffixes = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".aac"}
    found: list[str] = []
    for path in ROOT.rglob("*"):
        if path.suffix.lower() in suffixes and "node_modules" not in path.parts and "build" not in path.parts and "dist" not in path.parts:
            found.append(str(path.relative_to(ROOT)))
    return sorted(found)


def summarize_streams(meta: dict) -> str:
    if meta.get("ffprobe_unavailable"):
        return "ffprobe unavailable; fallback metadata captured from ffmpeg banner."
    lines = []
    fmt = meta.get("format", {})
    lines.append(f"- Container: `{fmt.get('format_long_name', fmt.get('format_name', 'unknown'))}`")
    lines.append(f"- Duration: `{fmt.get('duration', 'unknown')}s`")
    lines.append(f"- Size: `{fmt.get('size', 'unknown')} bytes`")
    lines.append(f"- Bitrate: `{fmt.get('bit_rate', 'unknown')} bps`")
    for stream in meta.get("streams", []):
        if stream.get("codec_type") == "video":
            lines.append(
                f"- Video: `{stream.get('codec_name')}`, {stream.get('width')}x{stream.get('height')}, "
                f"{stream.get('avg_frame_rate')} fps, `{stream.get('pix_fmt')}`, {stream.get('duration')}s"
            )
        elif stream.get("codec_type") == "audio":
            lines.append(
                f"- Audio: `{stream.get('codec_name')}`, {stream.get('sample_rate')} Hz, "
                f"{stream.get('channel_layout', stream.get('channels'))}, {stream.get('duration')}s"
            )
    return "\n".join(lines)


def write_report(
    source: Path,
    source_meta: dict,
    final_meta: dict,
    source_volume: str,
    loudnorm: str,
    final_volume: str,
    audio_assets: list[str],
) -> None:
    used_audio = "Procedural generated stems only. No local game UI sounds were used."
    audio_asset_note = "\n".join(f"- `{item}`" for item in audio_assets[:60]) or "- None found"
    if len(audio_assets) > 60:
        audio_asset_note += f"\n- ...and {len(audio_assets) - 60} more"

    timeline_lines = "\n".join(
        f"| {name} | {format_time(start)} | {format_time(end)} | {desc} |" for name, start, end, desc in TIMELINE
    )
    cue_lines = "\n".join(f"| {time} | {desc} |" for time, desc in AUDIO_CUES)

    report = f"""# Cultivation Idle Story Edit v1

## Deliverables

- Final MP4: `{FINAL_MP4.relative_to(ROOT)}`
- Final WAV stem: `{FINAL_WAV.relative_to(ROOT)}`
- QA contact sheet: `{QA_CONTACT_SHEET.relative_to(ROOT)}`
- Repro script: `scripts/edit_cultivation_story.py`

## Source

- Source file: `{source.relative_to(ROOT)}`
- Original file was not overwritten.

## Source Metadata

{summarize_streams(source_meta)}

Raw ffprobe JSON was saved to `build/source_ffprobe.json`.

## Source Audio Check

The source AAC stream is effectively silent and was discarded.

```text
{source_volume.strip()}
```

## Timeline Map

| Scene | Start | End | Role |
|---|---:|---:|---|
{timeline_lines}

## Audio Cue Map

| Time | Cue |
|---:|---|
{cue_lines}

## Audio Sources and Mix

{used_audio}

Local audio assets found during inspection, but not used because they are short UI event sounds rather than a cinematic prologue bed:

{audio_asset_note}

Generated stems:

- `build/audio/ambience_bed.wav`
- `build/audio/music_bed.wav`
- `build/audio/sfx_events.wav`
- `build/audio/final_mix_raw.wav`

The final review stem is `dist/Cultivation_Idle_Story_Edit_v1.wav`, normalized through ffmpeg `loudnorm=I=-16:TP=-1.5:LRA=11` and limited with `alimiter`.

## Visual Cleanup

- Top-right browser zoom overlay: feathered `delogo` cleanup from 00:00.0-00:00.85.
- Bottom-right Skip/Next story controls: feathered `delogo` cleanup through the story sequence, ending before the full Path Selection UI owns the frame.
- Bottom-left progress dots: feathered `delogo` cleanup through the story sequence.
- Mouse cursor artifacts: fixed small `delogo` patches at the early center positions, the slide-5 lower-right position, and the final Path Selection lower-center position.
- Grade: very light contrast lift, slight saturation restraint, tiny sharpening, 0.35s fade-in, 0.55s fade-out.

No aggressive crop, replacement art, new subtitles, or modern overlays were added. Existing story text remains in place.

## Final Metadata

{summarize_streams(final_meta)}

## Final Loudness / Volume Check

Loudnorm analysis:

```text
{loudnorm.strip()}
```

Volumedetect:

```text
{final_volume.strip()}
```

## Caveats

- The source is a screen recording, so artifact removal uses conservative fixed masks. The masks reduce the visible UI traces without attempting destructive full-frame inpainting.
- The soundtrack is procedural synthesis made locally with no downloaded music or voiceover. It is designed as a coherent temporary cinematic bed rather than a recorded live-instrument score.
- Some in-game UI is intentionally preserved in the final Path Selection portion because it is part of the source story sequence.
"""
    FINAL_REPORT.write_text(report, encoding="utf-8")


def source_volume_check(ffmpeg: str, source: Path) -> str:
    result = run(
        [ffmpeg, "-hide_banner", "-i", str(source), "-af", "volumedetect", "-vn", "-f", "null", "-"],
        capture=True,
        check=False,
    )
    (BUILD / "source_volumedetect.txt").write_text(result.stderr, encoding="utf-8")
    return result.stderr


def main() -> None:
    mkdirs()
    source = find_source()
    ffmpeg = ensure_ffmpeg()
    ffprobe = ensure_ffprobe()

    source_meta = ffprobe_json(ffprobe, ffmpeg, source, BUILD / "source_ffprobe.json")
    duration = get_duration(source_meta)
    source_volume = source_volume_check(ffmpeg, source)
    audio_assets = collect_audio_assets()

    build_contact_sheet(ffmpeg, source, INSPECT / "source_contact_sheet.jpg", QA_TIMES)

    stems = generate_audio_stems(duration)
    loudnorm, final_volume = loudnorm_audio(ffmpeg, stems["raw_mix"], FINAL_WAV)
    visual = render_visual(ffmpeg, source, duration)
    mux_final(ffmpeg, visual, FINAL_WAV, FINAL_MP4)

    final_meta = ffprobe_json(ffprobe, ffmpeg, FINAL_MP4, BUILD / "final_ffprobe.json")
    build_contact_sheet(ffmpeg, FINAL_MP4, QA_CONTACT_SHEET, QA_TIMES)
    write_report(source, source_meta, final_meta, source_volume, loudnorm, final_volume, audio_assets)

    print("\nRendered:")
    print(f"  {FINAL_MP4}")
    print(f"  {FINAL_WAV}")
    print(f"  {FINAL_REPORT}")
    print(f"  {QA_CONTACT_SHEET}")


if __name__ == "__main__":
    main()
