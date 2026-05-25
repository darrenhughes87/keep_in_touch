# Keep In Touch — How To

A short guide to using the app day-to-day. Written for a phone, works the same on a laptop.

---

## 1. What it looks like

These mockups mirror the actual screens:

### Home (the morning view)

```
┌──────────────────────────────────────┐
│ Keep In Touch    People  🔍  ⚙       │
├──────────────────────────────────────┤
│                                      │
│ Morning.                             │
│ 2 people, if you've got a spare      │
│ ten minutes.                         │
│                                      │
│ ┌────────────────────────────────┐   │
│ │ ▶  Listen to today (20s)       │   │
│ └────────────────────────────────┘   │
│                                      │
│ ┌────────────────────────────────┐   │
│ │ (S)  Sarah                     │   │
│ │                                │   │
│ │ You and Sarah usually chat     │   │
│ │ every couple of weeks. It's    │   │
│ │ been 27 days.                  │   │
│ │                                │   │
│ │ Last time: she's looking at    │   │
│ │ houses, viewing on Saturday    │   │
│ │                                │   │
│ │ [WhatsApp][Call][SMS][Email]   │   │
│ │                                │   │
│ │ Open                 not now   │   │
│ └────────────────────────────────┘   │
│                                      │
│ ┌────────────────────────────────┐   │
│ │ (R)  Rob                       │   │
│ │ ...                            │   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

When you tap **WhatsApp**, the app:

1. Logs the interaction silently
2. Opens WhatsApp pre-targeted at that person (deep link `wa.me/<phone>`)
3. Marks them off for the day (the card replaces itself with *"Nice. Sarah marked off for today."*)

If everyone is on track the home screen reads *"You're all caught up. Have a good day."* with a small green leaf. That's not a failure state, that's the goal.

### Person detail

```
┌──────────────────────────────────────┐
│ ← Sarah                              │
├──────────────────────────────────────┤
│  (S)+   Sarah                        │
│         [Close friend]  every ~21d   │
│                                      │
│  Last contact: 3 days ago            │
│                                      │
│  [WhatsApp][Call][SMS][Email]        │
│                                      │
│  💡 Suggest an opener                │
│                                      │
│  MEMORY                              │
│  ┌──────────────────────────────┐    │
│  │ Add a note. Tap mic to dictate.│  │
│  │                              │    │
│  │ 🎙 dictate          Save      │   │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ she's looking at houses in   │    │
│  │ Chester, viewing on Saturday │    │
│  │ today                        │    │
│  └──────────────────────────────┘    │
│                                      │
│  [Log a chat][Snooze 1w][1m][3m]     │
│                          Archive     │
│                                      │
│            Edit details              │
└──────────────────────────────────────┘
```

Tap the **avatar** to upload a photo. Tap the small **×** to remove it. Falls back to a coloured circle with their initials if no photo.

---

## 2. First-time setup

1. Open the app at your install URL.
2. Type the password from your `.env` (`SESSION_PASSWORD`).
3. **Welcome** → tap *Start*.
4. **Inner circle** — type the names you'd be devastated to lose touch with, one per line. First names are fine. Aim for around five.
5. **Close friends** — people you'd love to see more of. Up to fifteen-ish.
6. **Phones** *(optional)* — paste numbers with country code (e.g. `+447700900123`). Skip what you don't have to hand; fill in later from each person's page.
7. **Ready** → tap *Open the app*.

You'll land on the home screen with today's suggestions already computed.

> The app never includes example names or test contacts. The placeholder text in the onboarding form is just *"One name per line…"*.

---

## 3. The daily flow (under 60 seconds)

1. **Glance** — open the app. Read the names.
2. **Tap** — pick one. Tap **WhatsApp** / **Call** / **SMS**. Send.
3. **Log later** — when you come back, open that person's page and dictate one line about the chat.

That third step is the whole reason this app works. The next time the app surfaces their name in six weeks, you'll see *"Last time: …"* and open with something real instead of *"hey, all good?"*.

---

## 4. Morning voice briefing

Tap **▶ Listen to today (20s)** at the top of the home screen.

The app generates a short, soft script ("Morning. A couple of people today. Sarah, 27 days since you spoke. Last time, she's looking at houses…") and reads it aloud using your phone's built-in text-to-speech voice. About 20 seconds.

Hands-free, while you make coffee. Tap again to stop.

If `ANTHROPIC_API_KEY` is set in `.env`, the script is generated by Claude Haiku and reads more naturally. Without it, a templated local script is used. Both work.

---

## 5. Adding a note (the memory engine)

On any person's page:

**Typing** — tap the note box, type, **Save**.

**Voice (the fast way):**
1. Tap **🎙 dictate**
2. Speak normally
3. Tap **● recording** to stop
4. Tap **Save**

Voice uses your phone's native speech recognition. No audio leaves your device. The text appears immediately, dated, and is searchable across all people via the 🔍 icon at the top.

---

## 6. Suggested opener

On any person's page, tap **💡 Suggest an opener**. The app reads their most recent note and produces a one-line message you can send. **Copy** → open WhatsApp → paste → send.

Without an Anthropic key, the opener falls back to a templated *"Ask how things are since they mentioned: …"*. With one, you get something natural like *"Hey, how did the viewing go on Saturday?"*.

---

## 7. Adding someone new

From the **People** page, two links at the top:

- **Import from contacts** — upload a `.vcf` file exported from your phone's contacts app. Pick exactly who you want to track; the rest of your contacts are untouched. (Android: Contacts app → ⋮ → Share or Export → .vcf.)
- **Add manually** — name, layer, phone, email, birthday.

You can also use the **+** floating button at the bottom-right of the People page.

---

## 8. Photos

Tap any person's **avatar** on their detail page to upload a photo. Tap the small **×** to remove. Photos are stored locally with the rest of the database, never uploaded anywhere.

---

## 9. Snooze, archive

Scroll to the bottom of a person's page for:

- **Log a chat** — for face-to-face conversations the app couldn't auto-detect
- **Snooze 1w / 1m / 3m** — won't surface during the snooze
- **Archive** — removes them from suggestions completely (soft delete; never destroyed)

---

## 10. Settings worth knowing

Tap ⚙ at the top.

| Setting | What it does |
|---|---|
| **Greeting tone** | Warm / Neutral / Brief. Changes the morning greeting line. |
| **Daily digest time** | When the nightly job recomputes who to surface (default 08:30). |
| **Max suggestions per day** | 1 to 5. Default 3. Cap your daily load. |
| **Quiet days** | Tick weekends if you want to be left alone Sat/Sun. |
| **Cadence defaults** | Days between contacts per layer. Inner 7, close 21, good 60, acquaintance 180 by default. |
| **Moments (optional)** | Off by default. If on, an evening prompt asks *"Anything good happen today worth holding onto?"* — saves to a private journal you can read back in the Year scroll. |

Below the form: **Year scroll**, **Export everything (JSON)**, **Log out**.

---

## 11. Install on your phone (PWA)

1. Open the app in Chrome on your phone.
2. ⋮ menu → **Add to Home screen** → **Install**.
3. App icon appears on your home screen.
4. Open from the icon — runs full-screen, no browser chrome.

The service worker caches the app shell so it opens instantly even on a flaky connection.

The manifest also registers Keep In Touch as an **Android share target** — share any text or link from any app and pick *Keep In Touch* to save it as a note (against a person you choose, or as a private "moment").

---

## 12. The principles (worth re-reading)

- **No streaks.** Missing a day is not a failure.
- **No notifications by default.** One pull-based morning view.
- **No social feed.** Nobody else sees this. Ever.
- **No "overdue" or "late".** The softest word is "drifting".
- **Cadence is a suggestion, never a deadline.**
- **You're all caught up** is a real, reachable state.

If you find yourself building a feature that adds pressure, stop and put it back.

---

## 13. Troubleshooting

| Symptom | Fix |
|---|---|
| TTS button doesn't speak | First TTS on Android needs a real tap. Brave blocks `speechSynthesis` until enabled in settings. Chrome works out of the box. |
| Voice dictation says "not supported" | Chrome on Android is the only mobile browser that fully supports `webkitSpeechRecognition`. Switch browsers or type. |
| WhatsApp link doesn't open | The number needs a country code (e.g. `+44…`). Edit the person and add it. |
| The home screen is empty | Either you're all caught up, today is a quiet day, or suggestions haven't been computed yet. The People list always shows everyone. |
| Forgot password | Edit `.env`, set a new `SESSION_PASSWORD`, restart. Rotate `SESSION_SECRET` to invalidate any existing session cookies. |

---

## 14. Try this on day one

The single best thing you can do right now:

1. Add five people to your inner circle.
2. Pick one.
3. Tap **WhatsApp**.
4. Send them whatever you'd send.

If they message you back within a day and you feel even slightly better, this app is doing its job. If they don't, that's fine too. Tomorrow you do it again, with a different name.

The thesis of the whole thing is: messaging someone you love, who doesn't expect to hear from you, feels good. Both for them and for you. Most of the time the friction stopping that is *"I don't know what to say"*. This app's only job is to remove that friction.

That's it. Welcome.
