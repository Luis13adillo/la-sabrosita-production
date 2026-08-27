# Getting the menus onto the shop's TVs

**Status: research only.** Nothing has been bought, installed, or deployed. No
production file has been touched. This document exists so the decision is made
once, with real numbers, and so whoever does the install later is not guessing.

Researched 2026-08-18. Prices move — re-check any number older than about three
months before spending money.

---

## 1. What we are actually putting on the screen

This drives every other choice, so it goes first.

The finished reel is at
[tv-menu/motion/hyperframes/renders/](../tv-menu/motion/hyperframes/renders/):

| | Full | Lite |
|---|---|---|
| File | `LS_TV-Menu_Reel_v03.mp4` | `LS_TV-Menu_Reel_v03_lite.mp4` |
| Size | 234 MB | 75 MB |
| Video | H.264 High, 1920×1080, 30 fps, yuv420p | same |
| Bitrate | ~13.9 Mbps | ~4.4 Mbps |
| Length | 2 min 21.6 s | 2 min 21.6 s |

Three things follow from that:

- **1080p, not 4K.** We do not need a 4K player. Any 1080p-capable box is enough,
  and paying for 4K hardware buys us nothing today.
- **H.264 in an MP4 is the most universally playable format there is.** Every
  option below can play it. This is the reason we are not locked into anyone.
- **The lite file at 75 MB is the one to deploy.** It is small enough to clear
  most upload limits and to sit comfortably on a player's internal storage. The
  full file is the archive copy.

A 2m21s loop is short enough that a customer standing in line sees the whole
menu, and long enough that it does not feel like a flicker. Nothing below
changes because of the length.

---

## 2. What to collect at the shop before deciding

Do this before spending a dollar. Most of it takes ten minutes with a phone.

**Per TV:**

1. **Brand and exact model number.** Back-panel sticker, or on-screen. On a Roku
   TV: Settings → System → About. Photograph both.
2. **What operating system it runs.** Roku TV, Fire TV, Google/Android TV,
   Samsung Tizen, LG webOS, Vizio SmartCast, or a plain TV with no smart
   features. This is the single most important answer — it decides whether we
   need to buy hardware at all.
3. **Native resolution.** 1080p or 4K.
4. **HDMI ports:** how many, how many are free, and whether the TV lists
   HDMI-CEC (Roku calls it "1-Touch play", Samsung "Anynet+", LG "SimpLink",
   Vizio "CEC"). CEC is what lets a player turn the TV on and switch to the right
   input by itself after a power cut.
5. **USB ports:** how many, and whether the TV has any at all. Some Roku TV
   models ship without one. No USB port means the $0 option is off the table for
   that TV.
6. **Auto power-on behaviour.** Cut the power at the outlet for ten seconds,
   restore it, and watch. Does the TV come back on by itself, and does it return
   to the input it was on? Write down what actually happened for each TV. Do not
   assume — this varies by model and it is the number-one cause of a dark menu
   board on a Monday morning.
7. **Physical access:** is the back of the TV reachable once mounted? Is there a
   free power outlet behind it, or a USB port on the TV that can power a stick?
8. **Orientation:** landscape or portrait.

**For the shop as a whole:**

9. **How many TVs total**, and whether they all show the same thing or split
   English on some and Spanish on others. This changes the monthly cost directly.
10. **Wi-Fi:** network name, password, and whether it is a guest network with a
    login page. A captive portal — the "click here to accept" page — will break
    every remotely-managed player. If that is what the shop has, we need a real
    password-only network, or Ethernet.
11. **Is there Ethernet near the TVs?** A cable beats Wi-Fi for something that
    has to run all day.
12. **Power routine:** does staff kill a breaker or a switched outlet at close?
    Do they turn the TVs off with a remote nightly? Both are fine, but they
    change which option survives.
13. **Who onsite can press a button on a remote** if something needs a nudge, and
    whether they are comfortable doing it.

Bring back photos of every back panel and every About screen. That is enough to
finalise the choice without a second trip.

---

## 3. What each option actually costs and does

### USB stick straight into the TV

Free. We already own the drives. Copy the MP4 on, plug it in, set the TV's built-in
media player to repeat.

The catch is real and documented: on Roku TVs the Roku Media Player will loop a
folder, but it drifts — users report playback running for hours or days and then
the screensaver taking over and dropping back to the menu, and some models will
not loop from USB at all. There is no remote update; changing the menu means
physically visiting each TV with a drive.

### Native Roku, if the TVs are Roku

There is no official Roku digital-signage product. What exists is third-party
channels that run on Roku, of which Quickesign is the notable one. That means "if
the TVs are Roku" does not translate to "free" — it translates to "no extra
hardware needed", which is still worth a lot.

### Quickesign — $6/screen/month, $60/screen/year on annual

The only one of these with a real Roku channel, installable on a Roku TV from the
Channel Store. Cheapest recurring cost of any remote option. Also has an Apple TV
app.

Caveats worth knowing: Roku's Bandwidth Saver setting has to be turned off or it
will interrupt playback, and auto-start relies on a companion screensaver app
rather than the TV genuinely launching the channel on boot. It is a workaround,
and workarounds are the thing that fails at 7am.

### Yodeck — $8/screen/month, $96/screen/year on annual, player hardware included

The free plan is one screen, on a single-screen account only. It does not stack
alongside paid screens, so with 2+ TVs we are paying for all of them.

What makes it the value pick: an annual Basic subscription includes a Yodeck
Player (normally $79) free, per screen. Content is cached on the player's SD
card and keeps playing through an internet outage for up to a month. The player
can drive the TV over HDMI-CEC — power it on and switch to the right input —
which is exactly the auto-recovery behaviour we need after a power cut. Plays
MP4 natively, so the Remotion/HyperFrames export drops straight in.

No Roku app. It brings its own box and uses the TV as a plain display, which is
why it works no matter what the TVs turn out to be.

### OptiSigns — free tier is not usable for us; Standard is $10/month, $9/month annual

The free plan reads well until you check the limits: **25 MB maximum file size**
(our lite file is 75 MB), 1 GB storage, an OptiSigns logo permanently in the
bottom-right corner of the screen, and — decisive — it does not run on Fire TV,
Roku, smart TVs, ChromeOS, or Apple TV at all. Free OptiSigns would mean a
Windows, Linux, Mac, or Raspberry Pi machine per screen, showing a watermark, and
still unable to hold our video.

Paid OptiSigns is a solid product. It just is not a free one for this job.

### LOOK Digital Signage — $15/screen/month, $13.50 annual

Roughly double Quickesign and nearly double Yodeck, with no included hardware and
a 14-day trial rather than a free tier. Nothing it does here is worth the
premium for a four-TV menu board. It is the option to drop.

### Amazon Signage Stick — $99.99 one-time, plus a CMS subscription

A purpose-built signage player from Amazon: quad-core, 4K, Wi-Fi 6E, built for
24/7 operation, with the consumer streaming apps stripped out. It auto-launches
its CMS in kiosk mode, which is the clean version of the auto-start problem that
Quickesign solves with a screensaver trick.

It has no signage software of its own. It is a body that needs a brain, and the
brain is a subscription — Yodeck, Xibo, OptiSigns and others are supported.

### Fire TV Stick / onn Google TV box — cheaper bodies, same missing brain

A Fire TV Stick 4K Plus runs around $30, the onn 4K stick $39.88, the onn 4K Pro
box about $60. All of them still need signage software, none of them are built
for continuous 24/7 duty, and all of them will occasionally decide to show you a
home screen full of movie recommendations. Cheaper than the Signage Stick,
noticeably less predictable.

### Raspberry Pi + Anthias — the only genuinely $0/month remote option

Anthias (the project formerly called Screenly OSE) is free, open source, actively
maintained, and self-hosted. It loops video from local storage, starts on boot,
and has its own web interface for uploading new content. Nothing to subscribe to,
ever.

Two things have changed the maths against it:

- **Pi hardware got expensive.** A memory shortage pushed 2026 prices up: the
  1 GB Pi 5 is $45, the 2 GB is $50–55, 4 GB is $60–70. Add a power supply, SD
  card, case and HDMI cable and a screen costs roughly $85–100 to build. That is
  about a year of Yodeck, paid up front, per screen.
- **The Pi 5 dropped hardware H.264 decoding.** Our file is H.264. The Pi 5's CPU
  handles it in software at 1080p without breaking a sweat, so this is not a
  blocker — but a Pi 4 with the hardware decoder is the safer build if we go
  this way.

The remaining gap is remote access: Anthias' web interface is on the local
network. Reaching it from the laptop needs a tunnel. Tailscale's free plan is
non-commercial only and this is a business, so that route is $8/user/month.
Cloudflare's Zero Trust free tier covers up to 50 users at no cost and is a
genuine free plan, so a Cloudflare Tunnel is the honest $0 path.

Real cost of "free": four boxes to build, four SD cards that can corrupt, and
Luis as the entire support desk. Worth it for someone who enjoys that. Expensive
in a different currency for someone who does not.

### Xibo — free self-hosted CMS, but not free in practice

The CMS is genuinely free under AGPL and the Windows and Linux players are free.
The Android player — which is what you would run on a Signage Stick or Fire
Stick — is a commercial perpetual licence starting around $28 per device, it
phones home to a licence server every 30 days unless you buy an offline module,
and a major version bump is billed again. Plus you have to host the CMS
somewhere. Included for completeness; it does not win on any axis here.

---

## 4. The three choices

### Choice 1 — Cheapest: USB sticks

Copy `LS_TV-Menu_Reel_v03_lite.mp4` to a drive per TV, plug into the TV's USB
port, set the built-in player to repeat.

| TVs | Hardware | Year 1 | Every year after |
|---|---|---|---|
| 2 | $0 (drives owned) | **$0** | **$0** |
| 3 | $0 | **$0** | **$0** |
| 4 | $0 | **$0** | **$0** |

What you give up: no remote updates — every menu change is a physical trip with a
drive to each TV. Looping is not guaranteed; on Roku TVs specifically it is known
to drift back to the menu after hours or days. Recovery after a power cut depends
entirely on whether the TV powers itself back on and returns to the USB input,
which is exactly what step 6 of the onsite checklist is there to find out.

Right choice if the menu changes a few times a year and someone is at the shop
anyway. Wrong choice if prices change monthly.

### Choice 2 — Best value with remote updates: Yodeck Basic, annual, players included

One Yodeck Player per TV — free with the annual Basic plan — plugged into HDMI.
Upload a new MP4 from the laptop, every screen updates itself.

| TVs | Hardware | Year 1 | Every year after |
|---|---|---|---|
| 2 | $0 (players included) | **$192** | **$192** |
| 3 | $0 | **$288** | **$288** |
| 4 | $0 | **$384** | **$384** |

Why this one: it satisfies every priority on the list. Remote updates from the
laptop, video cached locally so a Wi-Fi outage does not blank the menu for up to
a month, HDMI-CEC to bring the TV back after a power cut, one dashboard for all
screens, and MP4 in means our HyperFrames export needs no conversion. The free
player hardware is what makes it beat OptiSigns Standard ($108/screen/year with
no hardware) despite a similar sticker price.

**Cheaper variant, only if the TVs are confirmed Roku:** Quickesign Light at
$60/screen/year, running as a Roku channel with no hardware at all — $120 / $180 /
$240 per year for 2 / 3 / 4 TVs. It saves roughly $150/year at four screens. It
also depends on a screensaver workaround for auto-start and on Roku's own USB and
playback quirks. Cheaper, and more likely to need a phone call.

### Choice 3 — Easiest premium: Amazon Signage Stick + OptiSigns Standard

A $99.99 purpose-built signage stick per TV, auto-launching OptiSigns in kiosk
mode. Commercial-grade hardware meant to run 24/7, and the most mature management
dashboard of the three.

| TVs | Hardware (one-time) | Year 1 | Every year after |
|---|---|---|---|
| 2 | $199.98 | **$415.98** | **$216** |
| 3 | $299.97 | **$623.97** | **$324** |
| 4 | $399.96 | **$831.96** | **$432** |

OptiSigns Standard at $9/screen/month billed annually. The Signage Stick also
pairs with Yodeck if you prefer that dashboard, which would put ongoing cost at
$192 / $288 / $384 instead — the stick is the premium part, not the software.

Buy this when the menu is a revenue instrument that must never be dark, and when
nobody wants to think about it again.

---

## 5. What we still cannot answer

Everything above assumes the TVs cooperate. Three answers from the onsite check
can move the recommendation:

- **If the TVs have no USB port**, Choice 1 collapses. A basic USB loop-player box
  is roughly $40–60 per screen, which stops it being the free option.
- **If the shop Wi-Fi is a guest network with a login page**, every remote option
  breaks until that is fixed. This is worth checking before anything else.
- **If the TVs do not power themselves back on after an outage**, no software
  choice fixes it. That is an HDMI-CEC-capable player (Choice 2 or 3) or a
  conversation with the client about a smart plug and staff routine.

---

## Sources

Vendor pricing pages, checked 2026-08-18:
[OptiSigns](https://www.optisigns.com/pricing) ·
[OptiSigns free plan limits](https://support.optisigns.com/hc/en-us/articles/33940834613139-What-Do-I-Get-With-an-OptiSigns-Free-Plan) ·
[Yodeck](https://www.yodeck.com/pricing/) ·
[Yodeck FAQ](https://www.yodeck.com/faq/) ·
[Quickesign](https://quickesign.net/pricing.php) ·
[Quickesign for Roku](https://quickesign.net/digital-signage-for-roku) ·
[LOOK Digital Signage](https://lookdigitalsignage.com/pricing) ·
[Amazon Signage Stick](https://signage.amazon.com/) ·
[Xibo](https://xibosignage.com/pricing) ·
[Anthias](https://anthias.screenly.io/) ·
[Raspberry Pi price changes](https://www.raspberrypi.com/news/1gb-raspberry-pi-5-now-available-at-45-and-memory-driven-price-rises/) ·
[Tailscale](https://tailscale.com/pricing)
