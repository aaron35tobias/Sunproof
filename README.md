# FIELDGUARD // Industrial Safety OS

**An offline-first safety app for field workers.** Workers can report hazards with a photo and
GPS, log how they are coping with the heat, and send an SOS, even with no signal. Supervisors
see every incident in one dashboard and dispatch a response crew.

Built for the **Google Developer BIT N BUILD Hackathon**.

---

## 🔗 View the app

**Live demo:** https://YOUR-PROJECT.web.app

Open it in Chrome on a laptop or a phone. The browser will ask to use your **location** and
**camera**. Please allow both so you can try all the features.

> **Supervisor login:** the username and password are in our hackathon submission.
> They are kept out of this public repository on purpose.

---

## 🧭 5-minute walkthrough 

| # | Try this | What to look for |
|---|----------|------------------|
| 1 | Open **LOCATION**, enter a work place name and an emergency phone number, then press **Save** | Live GPS coordinates with a Google Maps link |
| 2 | Go to **REPORT**, pick a hazard type and severity, then press **Take photo** | The photo is stamped with the site, time and GPS |
| 3 | Press **Dictate note** and speak | Your speech becomes the field note |
| 4 | Submit the report | "Report synchronized" |
| 5 | Turn on **DEMO MODE** (top bar), then tick **FORCE OFFLINE**, and submit another report | It is saved on the device and shows as `PENDING` in **SYNC QUEUE** |
| 6 | Untick **FORCE OFFLINE** | The queue syncs by itself |
| 7 | Open **HEAT CHECK** and choose **Extreme heat stress** | Stop-work safety instructions appear |
| 8 | Press **EMERGENCY SOS** | Alarm sound and a priority incident. On a phone, it also dials the emergency number |
| 9 | Open **SUPERVISOR** and sign in | Live incident stream with severity filter and counts |
| 10 | Click an incident, assign a crew, then **Mark resolved** | Crew dispatch and **Open in Google Maps** |
| 11 | Turn on **SUN MODE** | High-contrast black and yellow theme for bright outdoor light |

💡 **Tip:** open the app in **two tabs**, with the worker in one and the supervisor in the
other. New reports appear on the supervisor tab straight away.

---

## ✨ Key features

- **Works offline.** Reports, photos and SOS alerts are saved on the device (IndexedDB) and sync
  automatically when the connection returns. The app itself also opens offline after the first
  visit, and it can be installed on a phone's home screen.
- **Real evidence.** The live camera, GPS location and voice-to-text notes are attached to every
  report.
- **Worker wellbeing.** Heat and fatigue check-ins, plus a one-tap SOS that calls through the
  phone's SIM.
- **Supervisor command.** Live incidents, crew dispatch, resolution tracking and Google Maps
  links.
- **Built for the field.** Large touch targets, a mobile layout and a sun-readable
  high-contrast mode.

## 🛠 Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · IndexedDB · Service Worker (PWA) ·
Geolocation, MediaDevices and Web Speech browser APIs · Google Maps links ·
Firebase Hosting

---

## 💻 Run it on your own computer (optional)

You need [Node.js 18 or newer](https://nodejs.org).

```bash
git clone <this-repo-url>
cd <repo-folder>
npm install
```

Set up the supervisor login:

```bash
cp .env.example .env                          # on Windows: copy .env.example .env
npm run hash-password -- "choose-a-password"  # prints a hash
```

Open `.env` and fill it in:

```
VITE_SUPERVISOR_USERNAME=choose-a-username
VITE_SUPERVISOR_PASSWORD_HASH=<the hash printed above>
```

Start the app:

```bash
npm run dev
```

Then open **http://localhost:5173**.

---

## 📝 Notes

- **Shared data only works within one browser.** For this prototype, the "server" is simulated
  inside the browser (`src/api/base44Client.ts`). Tabs in the same browser share data, but
  different devices do not. The next step is to connect Firebase Firestore and Cloud Storage
  through that same file.
- **Camera and GPS need a secure address** (`https://` or `localhost`).
- **Supervisor login is a demo lock.** It runs in the browser only; production would use
  Firebase Authentication.
