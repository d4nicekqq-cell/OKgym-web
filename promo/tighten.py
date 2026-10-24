"""Tighten the voice-over: cut the pauses between scenes and speed it up.

  python promo/tighten.py   voice_raw.mp3 + timing_raw.json → voice.mp3 + timing.json

Word times are recalculated, so the animation still lands on the words.
"""
import json
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
GAP = 0.16       # silence left between scenes
TEMPO = 1.15     # speed-up without changing pitch
TEMPOS = {"hook": 1.3, "tag": 1.25}  # faster still where the delivery drags
WORD_GAP = 0.12  # longest pause kept between words of one scene
LEAD, TAIL = 0.04, 0.1

raw_v, raw_t = HERE / "voice_raw.mp3", HERE / "timing_raw.json"

timing = json.loads(raw_t.read_text(encoding="utf-8"))

# The aligner counts the pause after a word as part of it, so end each word where the audio
# actually goes quiet.
log = subprocess.run(["ffmpeg", "-i", str(raw_v), "-af", "silencedetect=noise=-30dB:d=0.06", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
quiet = [float(l.split("silence_start: ")[1].split()[0]) for l in log.splitlines() if "silence_start: " in l]
for sc in timing["scenes"].values():
    for w in sc["words"]:
        inside = [q for q in quiet if w["t"] + 0.12 < q < w["e"]]
        if inside:
            w["e"] = inside[0]
    sc["e"] = sc["words"][-1]["e"]
# Cut the audio into runs of words; any pause longer than WORD_GAP inside a scene is shortened
# to WORD_GAP and every pause between scenes to GAP.
filters, parts, scenes, cursor = [], [], {}, 0.0
for sid, s in timing["scenes"].items():
    runs, cur = [], [s["words"][0]]
    for w in s["words"][1:]:
        if w["t"] - cur[-1]["e"] > WORD_GAP:
            runs.append(cur)
            cur = []
        cur.append(w)
    runs.append(cur)
    words, k = [], TEMPOS.get(sid, TEMPO)
    for r, run in enumerate(runs):
        a, b = max(0.0, run[0]["t"] - LEAD), run[-1]["e"] + TAIL
        pad = GAP if r == len(runs) - 1 else WORD_GAP
        n = len(parts)
        filters.append(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,atempo={k},apad=pad_dur={pad}[p{n}]")
        parts.append(f"[p{n}]")
        words += [{"w": w["w"], "t": cursor + (w["t"] - a) / k, "e": cursor + (w["e"] - a) / k} for w in run]
        cursor += (b - a) / k + pad
    scenes[sid] = {"t": words[0]["t"], "e": words[-1]["e"], "words": words}
filters.append(f"{''.join(parts)}concat=n={len(parts)}:v=0:a=1[out]")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw_v), "-filter_complex", ";".join(filters),
                "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "192k", str(HERE / "voice.mp3")], check=True)
(HERE / "timing.json").write_text(json.dumps({"duration": cursor, "scenes": scenes}, ensure_ascii=False, indent=1),
                                  encoding="utf-8")
print(f"voice: {timing['duration']:.1f} s -> {cursor:.1f} s")
