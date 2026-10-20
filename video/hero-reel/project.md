# Hero reel — video-use project memory

## Session 1 — 2026-10-18

**Strategy:** A silent, seamlessly looping 15-second 9:16 reel of Aliya at work for the homepage hero. Phones show it whole below the hero text; tablets and laptops show it in three tall panels (two between 1024px and 1279px), each started further in so different shots play at once. No text, no music.

**Decisions:**
- Six shots of 2.5s with 0.5s dissolves. In order: "Arian" written in white ink on a red envelope (`de40366f` 4.2–7.2s), the wall of finished envelopes (`100024b4` 5.0–9.5s at 1.5×), the "Flora" heart place card (`3545a7a3` 6.0–9.0s), the engraved "Congratulations" candle (`3a4e5f5f` 0.8–3.8s), the full vows page with pen and ink (`4324820d` 9.1–11.96s at 0.953×), and gold-ink vows (`bc369417` 4.5–7.5s). Ranges, crops and grades are in `edl.json`.
- The last shot dissolves into the first shot's opening, and that opening is trimmed off the front, so the loop has no visible seam.
- Each shot gets one grade correction: papers are moved to a consistent warm white (R−B about +17, close to the site's cream), and the clipped crimson of the envelope wall is shifted to match the writing shot's red.
- 720×1280 output, because the sources are only 464–656px wide. Light `hqdn3d` before upscaling and light `unsharp` after.
- Delivered as AV1 (CRF 42, 1.7 MB, `av01.0.05M.08`) with an H.264 fallback (CRF 28, 2.5 MB, `avc1.64001F`). VP9 was dropped: at the same size it smoothed the paper texture (SSIM 0.948 against 0.978).
- The page uses still frames at 0s, 5.83s and 11.67s, one per panel, shown before playback.

**Reasoning log:**
- `b68d3ec0` (gold envelope) is excluded because it shows a client's full name and postal address.
- The "My Queen" take in `de40366f` has a 4-frame flash at 23.47s. 4.10–7.27s is the clip's only jump-free 3-second stretch.
- Panel offsets of 5.83s and 11.67s put the panels' dissolves 0.83s apart, so the panels never change together and never show the same shot.
- The two red shots sit next to each other in the sequence, so side-by-side panels rarely show red twice.

**Outstanding (superseded by Session 2):**
- The footage is low resolution, so the reel looks soft on large Retina screens. Higher-resolution originals of these clips would fix that.

## Session 2 — 2026-10-19

**Strategy (confirmed by the user):**
- The engraved candle came out, and the "Father of the Bride" perfume photo took its place.
- Two photos were added: the Emily Brontë quote in red ink and the gold-ink "German barque Hera" lettering.
- That makes eight shots at the same 2.5s pace with 0.5s dissolves, so the loop is now 20 seconds. The user chose this over keeping 15 seconds with quicker cuts.

**Decisions:**
- **Order:** "Arian" writing → envelope wall → "Flora" → Father of the Bride → gold-ink vows → Brontë quote → black-ink vows → Hera.
  - The perfume keeps the candle's slot.
  - The gold-ink vows moved ahead of the black-ink vows, which keeps the two gold-ink pieces (vows and Hera) apart.
  - From the place cards on, moving clips and photos alternate.
- **Photos as shots (`"type": "still"`):** each window glides linearly between `from` and `to` across the shot.
  - Pillow resizes every frame from a sub-pixel box with Lanczos. The motion measured perfectly steady (frame-to-frame change 2.35–2.71 for the perfume, 3.48–4.01 for Brontë and 8.06–8.44 for Hera), so there's no zoompan stepping.
  - The perfume and Brontë shots get an 8% push-in onto the lettering.
  - The Hera line is wider than a 9:16 frame, so the camera glides right along it.
- **Photo grades:** each photo was matched to the film's paper warmth (red minus blue about +18):
  - Brontë: warmed and lifted about 3%.
  - Perfume: warmed only, because its marble highlights already sit near white.
  - Hera: lifted about 10% and warmed. It was dim and cool, so the lift is held back to keep the gold's highlights.
  - Measured afterwards, the photos sit at R−B +15 to +16 against +18 to +20 on the paper clips.
- **Colour handling:**
  - The sources and the film are BT.709. Photos are converted RGB→YUV with the BT.709 matrix and every output is tagged BT.709.
  - Posters are converted explicitly to JPEG's BT.601 full range. Measured against the film frames, they come out within 0.2 in mean colour, so there's no colour jump when playback starts.
- **Panel starts:** now 0, 6.67 and 13.33s, a third of the loop apart. Their dissolves fall 1.67s and 0.83s off panel 1's, so the panels never change together or show the same shot.
- **Encodes:**
  - AV1 at CRF 44 (2.2 MB, SSIM 0.978 against the master). CRF 42 gave 2.5 MB at 0.980.
  - H.264 stays at CRF 28 (3.4 MB, 0.970). CRF 30 dropped to 0.963 for 2.7 MB, and older iPhones depend on this copy.
  - Codec strings are unchanged: `av01.0.05M.08` and `avc1.64001F`.

**Reasoning log:**
- The photos' files are in `client-photos/` (the originals the client shared).
- The "Flora" clip only updates its picture about every fifth frame (around 6 fps of real motion), so its slow drift judders slightly. This was already in Session 1's film.
  - I tested motion interpolation (mpdecimate + minterpolate). The decimation didn't keep a steady rate, so the timing broke and frames came from later in the clip. I left the shot as it was.

**Outstanding:**
- The footage clips are low resolution (464–656px wide), so they look softer than the photo shots on large Retina screens. Higher-resolution originals would fix that.
- To re-render:
  - Put an ffmpeg build with `libsvtav1` and `libx264` on PATH and `pip install pillow`, then run `python render_reel.py edl.json` on a copy of this folder.
  - The intermediates are large, so keep them out of the project.
  - Copy `final-av1.mp4`, `final-h264.mp4` and the posters (at the `posters` times) to `public/video/` under the hero-reel names.
  - If the shot count or length changes, update `panelStarts` in `src/components/Hero.astro` to match `panel_starts`.
