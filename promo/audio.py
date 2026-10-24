"""Voice-over and sound effects for the OK GYM promo, from ElevenLabs.

  python promo/audio.py [--force]   → promo/voice.mp3, promo/timing.json, promo/sfx/<name>.mp3

The API key is read from the TikTok project's elevenlabs.env (never printed or copied).
timing.json holds the start and end of every scene and word, so the animation follows the voice.
"""
import base64
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
KEY_FILE = Path.home() / "Documents/VIRAL_VOID_THE_HOST/tiktok-promo/series/elevenlabs.env"
VOICE_ID = "nPczCjzI2devNBz1zQrb"
MODEL = "eleven_multilingual_v2"

SCENES = [
    ("hook", "Posilovna, box, lezení, lekce, sauny, masáže, solárium."),
    ("roof", "Všechno pod jednou střechou."),
    ("logo", "Ókej džym Pardubice."),
    ("tag", "Trénink, adrenalin, regenerace."),
    ("f0", "Osm set metrů posilovny."),
    ("f1", "Box s profesionálním ringem."),
    ("f2", "Osmimetrová lezecká stěna."),
    ("f3", "Lekce od bungee po jógu."),
    ("f4", "Finská i bio sauna."),
    ("f5", "Masáže po tréninku."),
    ("f6", "A solárium."),
    ("hours", "Otevřeno každý den."),
    ("cta", "Rezervuj online na ókej džym tečka cé zet."),
]

SFX = {
    "hit": ("Punchy short cinematic hit, tight kick drum with sub bass thump, sports promo, no music", 0.5),
    "boom": ("Deep cinematic sub bass impact boom with a short metallic tail, logo reveal", 2.0),
    "whoosh": ("Fast aggressive whoosh swoosh transition, short and clean", 0.6),
    "riser": ("Short intense cinematic riser building tension into a drop", 1.5),
    "weights": ("Heavy barbell weight plates clanking down on a gym floor, single short hit", 1.0),
    "punch": ("Boxing glove punch hitting a heavy bag, single powerful hit", 0.6),
    "tick": ("Crisp short digital counter tick", 0.5),
}


def key() -> str:
    for line in KEY_FILE.read_text(encoding="utf-8").splitlines():
        if line.startswith("ELEVENLABS_API_KEY=") and line.split("=", 1)[1].strip():
            return line.split("=", 1)[1].strip()
    sys.exit(f"No ElevenLabs key in {KEY_FILE}")


def post(url: str, body: dict) -> bytes:
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={"xi-api-key": key(), "Content-Type": "application/json"})
    try:
        return urllib.request.urlopen(req, timeout=180).read()
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs said {e.code}: {e.read().decode('utf-8', 'replace')[:300]}")


def voice() -> None:
    if (HERE / "timing.json").exists() and "--force" not in sys.argv:
        print("voice already there")
        return
    text = " ".join(t for _, t in SCENES)
    res = json.loads(post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/with-timestamps?output_format=mp3_44100_128",
        {"text": text, "model_id": MODEL,
         "voice_settings": {"stability": 0.38, "similarity_boost": 0.8, "style": 0.45,
                            "use_speaker_boost": True, "speed": 1.15}}))
    (HERE / "voice.mp3").write_bytes(base64.b64decode(res["audio_base64"]))
    al = res["alignment"]
    words, cur, t0, prev = [], "", None, 0.0
    for ch, a, b in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                words.append({"w": cur, "t": t0, "e": prev})
            cur, t0 = "", None
            continue
        t0 = a if t0 is None else t0
        cur += ch
        prev = b
    if cur:
        words.append({"w": cur, "t": t0, "e": prev})
    scenes, i = {}, 0
    for sid, text in SCENES:
        n = len(text.split())
        part = words[i:i + n]
        scenes[sid] = {"t": part[0]["t"], "e": part[-1]["e"], "words": part}
        i += n
    dur = al["character_end_times_seconds"][-1]
    (HERE / "timing.json").write_text(json.dumps({"duration": dur, "scenes": scenes}, ensure_ascii=False, indent=1),
                                      encoding="utf-8")
    print(f"voice: {dur:.1f} s, {len(words)} words")


def sfx() -> None:
    out = HERE / "sfx"
    out.mkdir(exist_ok=True)
    for name, (prompt, dur) in SFX.items():
        f = out / f"{name}.mp3"
        if f.exists() and "--force" not in sys.argv:
            continue
        f.write_bytes(post("https://api.elevenlabs.io/v1/sound-generation",
                           {"text": prompt, "duration_seconds": dur, "prompt_influence": 0.6}))
        print(f"{name}: {f.stat().st_size // 1024} kB")


if __name__ == "__main__":
    voice()
    sfx()
