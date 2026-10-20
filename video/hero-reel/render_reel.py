"""Render a seamless looping reel from a video-use style EDL.

Follows video-use's production rules where they apply to silent footage: every range is extracted on its own with its
grade baked in (one high-quality intermediate per shot), then shots are joined once. Dissolves need a re-encode at each
join, so instead of `-c copy` concat the intermediates are near-lossless (CRF 10) and the web encodes are the only lossy
pass. The loop seam dissolves the last shot into the first shot's opening frames, then those frames are trimmed off
the front, so the end flows into the start with no jump.

A range is either a video clip or a still photo ("type": "still"). A still gets a slow camera move: "from" and "to" are
[x, y, width] windows in the photo's pixels (the height follows the output's 9:16 shape), and the window glides from one
to the other across the shot. Pillow resizes each frame from a sub-pixel window, which keeps the move free of the
stepping that ffmpeg's zoompan shows at slow speeds.

Usage: python render_reel.py <edl.json>   (writes into the EDL's directory; stills need `pip install pillow`)"""
import json, subprocess, sys
from pathlib import Path

edl_path = Path(sys.argv[1]).resolve()
edit = edl_path.parent
base = edit.parent
edl = json.loads(edl_path.read_text())
out = edl["output"]
W, H, FPS, D = out["width"], out["height"], out["fps"], out["dissolve"]
SHOT = 3.0  # seconds per extracted shot, dissolve overlaps included
FRAMES = round(SHOT * FPS)
FINISH_PRE = "hqdn3d=1.0:1.0:3:3"           # tame compression noise before upscaling
FINISH_POST = "unsharp=5:5:0.45:5:5:0"      # restore edge crispness after upscaling
# The clips are BT.709. Photos are converted with the same matrix and tagged to match, so browsers show them true.
BT709 = ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"]
INTERMEDIATE = ["-an", "-c:v", "libx264", "-preset", "medium", "-crf", "10", "-g", str(FPS), "-r", str(FPS)]

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"ffmpeg failed:\n{' '.join(cmd)}\n{r.stderr[-2000:]}")

def render_still(r, src, p):
    from PIL import Image, ImageOps
    photo = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    (x0, y0, w0), (x1, y1, w1) = r["from"], r["to"]
    vf = ",".join(filter(None, [r.get("grade"), "scale=out_color_matrix=bt709:out_range=tv", "format=yuv420p"]))
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-vf", vf, "-frames:v", str(FRAMES), *INTERMEDIATE, *BT709, str(p)],
                          stdin=subprocess.PIPE)
    for n in range(FRAMES):
        k = n / (FRAMES - 1)  # linear, so the move carries on through both dissolves
        x, y, w = x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, w0 + (w1 - w0) * k
        ff.stdin.write(photo.resize((W, H), Image.LANCZOS, box=(x, y, x + w, y + w * H / W)).tobytes())
    ff.stdin.close()
    if ff.wait():
        sys.exit(f"ffmpeg failed on still {src}")

clips = edit / "clips_graded"; clips.mkdir(exist_ok=True)
paths = []
for i, r in enumerate(edl["ranges"]):
    src = base / edl["sources"][r["source"]]
    p = clips / f"shot_{i}_{r['source']}.mp4"
    if r.get("type") == "still":
        render_still(r, src, p)
        print(f"shot {i}: {r['source']} still {r['from']} -> {r['to']} -> {p.name}")
    else:
        speed = r.get("speed", 1)
        chain = [f"setpts=(PTS-STARTPTS)/{speed}"]
        if r.get("crop"): chain.append(f"crop={r['crop']}")
        chain += [FINISH_PRE, f"scale={W}:{H}:flags=lanczos"]
        if r.get("grade"): chain.append(r["grade"])
        chain += [FINISH_POST, f"fps={FPS}", "format=yuv420p"]
        run(["ffmpeg", "-y", "-ss", f"{r['start']:.3f}", "-t", f"{r['end'] - r['start']:.3f}", "-i", str(src),
             "-vf", ",".join(chain), "-frames:v", str(FRAMES), *INTERMEDIATE, str(p)])
        print(f"shot {i}: {r['source']} {r['start']}-{r['end']}s x{speed} -> {p.name}")
    paths.append(p)

# Join: dissolve each shot into the next, then the last into the first shot's opening, then trim that opening.
n = len(paths)
inputs = sum((["-i", str(p)] for p in paths), []) + ["-i", str(paths[0])]
f, last = [], "[0:v]"
for k in range(1, n):
    f.append(f"{last}[{k}:v]xfade=transition=fade:duration={D}:offset={k * (SHOT - D):.3f}[x{k}]")
    last = f"[x{k}]"
f.append(f"[{n}:v]trim=duration={D},setpts=PTS-STARTPTS[head]")
f.append(f"{last}[head]xfade=transition=fade:duration={D}:offset={n * (SHOT - D):.3f}[seam]")
loop_len = n * (SHOT - D)
f.append(f"[seam]trim=start={D}:duration={loop_len:.3f},setpts=PTS-STARTPTS,format=yuv420p[v]")
master = edit / "master.mp4"
run(["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(f), "-map", "[v]", *INTERMEDIATE, *BT709, str(master)])
print(f"master: {loop_len:.2f}s")

# Web encodes: no audio track, a keyframe every 2s (quick start and quick jumps to the panels' start times).
gop = ["-g", str(FPS * 2), "-keyint_min", str(FPS * 2)]
run(["ffmpeg", "-y", "-i", str(master), "-an", "-c:v", "libsvtav1", "-preset", "5", "-crf", str(out.get("crf_av1", 42)),
     *gop, "-pix_fmt", "yuv420p", *BT709, "-movflags", "+faststart", str(edit / "final-av1.mp4")])
run(["ffmpeg", "-y", "-i", str(master), "-an", "-c:v", "libx264", "-preset", "slow", "-crf", str(out.get("crf_h264", 28)),
     "-profile:v", "high", "-pix_fmt", "yuv420p", *gop, "-sc_threshold", "0", *BT709, "-movflags", "+faststart",
     "-tag:v", "avc1", str(edit / "final-h264.mp4")])
# JPEG viewers always read BT.601 full range, so the stills are converted explicitly; otherwise the poster's colours
# would shift slightly when the film takes over.
POSTER_VF = "scale=in_color_matrix=bt709:in_range=tv:out_color_matrix=bt601:out_range=pc,format=yuvj420p"
for t in out.get("posters", [0]):
    run(["ffmpeg", "-y", "-ss", f"{t:.3f}", "-i", str(master), "-vf", POSTER_VF, "-frames:v", "1", "-q:v", "4",
         str(edit / f"poster-{t:g}.jpg")])
for name in ["final-av1.mp4", "final-h264.mp4"] + [f"poster-{t:g}.jpg" for t in out.get("posters", [0])]:
    print(f"{name}: {(edit / name).stat().st_size / 1024:.0f} KB")
