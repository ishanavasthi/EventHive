# 8. User Manual

*EventHive for attendees and hosts — an end-user guide to the mobile app*

← [Setup & Deployment](./setup-and-deployment.md) · [Docs index](./README.md) · Next: [Validation Report](./validation-report.md)

---

This manual is for **people using the EventHive app**, not for developers. If you are installing or
running the system, start at [Setup & Deployment](./setup-and-deployment.md) instead.

Everything described here reflects the app **as committed** — where a feature is incomplete or
behaves unexpectedly, that is stated in place rather than omitted, and collected in
[§8.9 Known behaviours](#89-known-behaviours-and-limitations).

---

## 8.1 What EventHive does

EventHive is a mobile marketplace for local events, serving two roles from one account:

| You are… | You can… |
| :--- | :--- |
| **An attendee** | Discover events in your city filtered by category, date, and age suitability; book a ticket in a few taps; and carry a scannable QR ticket in the app |
| **A host** | Publish an event with a poster, price, and capacity; watch a live guest list; and scan attendees in at the door with your phone camera |

You do not choose a role. **Every account can do both** — book a ticket in the morning and host an
event in the afternoon.

---

## 8.2 Getting started

### Requirements

| | |
| :--- | :--- |
| Device | An Android or iOS phone |
| App | The EventHive app, or Expo Go with the project's QR code during a demo |
| Network | An internet connection — the app talks to a live server for everything |
| Camera permission | Required only if you host and want to scan tickets |

### Creating an account

1. Open the app. You land on the **Welcome Back** sign-in screen.
2. Tap **Create Account** at the bottom.
3. Choose your account type at the top:
   - **Individual** — a person hosting or attending
   - **Organization** — a company or collective; unlocks an extra "Organization Hosting Mode" panel when you create events
4. Fill in:

   | Field | Required | Notes |
   | :--- | :---: | :--- |
   | Full Name / Organization Name | ✅ | Shown to attendees on events you host |
   | Email Address | ✅ | Your sign-in identity; must be unique |
   | Password | ✅ | Stored hashed — nobody, including the operator, can read it back |
   | City | ✅ | e.g. `Bengaluru`. **This drives your notifications** — you are alerted when new events are published in this city |
   | Account Holder Name / Account Number / IFSC Code | ✗ | *Payout Details (Optional)* — only needed if you intend to host **paid** events |

5. Tap **Sign Up**. You are signed in immediately and land on the home feed.

> **Tip.** Set your city accurately even if you only plan to attend — city is the only thing that
> decides which new-event notifications reach you.

### Signing in

- **Email and password** — enter both and tap **Sign In**.
- **Sign in with Apple** — on iPhone only, a Sign in with Apple button appears below an "OR"
  divider. On Android the divider and button are not shown.

If sign-in fails you get a **Login Failed** alert. The message is deliberately identical for an
unknown email and a wrong password, so nobody can use the app to discover whether an address is
registered.

### Signing out

**Profile** tab → **Log Out** → confirm at *"Are you sure you want to logout?"*

Your session is remembered between app launches until you explicitly log out.

---

## 8.3 Finding your way around

Three tabs sit at the bottom of the screen at all times:

| Tab | What it opens |
| :--- | :--- |
| 🏠 **Home** | The discovery feed — every upcoming event, searchable and filterable |
| ➕ **Host** *(centre)* | The Create Event form |
| 👤 **Profile** | Your account, My Events, and Edit Profile |

The tab bar hides itself on full-screen views such as the ticket, the payment flow, and the QR
scanner, so those screens are not cramped.

A 🔔 **bell icon** on the Home screen opens your notifications.

---

## 8.4 For attendees

### Discovering events

The Home feed opens on **Upcoming Events**, with a featured carousel at the top. Events that have
already ended are hidden automatically — you never see a past event in the feed.

**Search** — type into the search bar to match across event fields; the heading changes to
*Search Results*.

**Filters** — four independent filters, all combinable:

| Filter | Options |
| :--- | :--- |
| **City** | All Cities · New Delhi · Mumbai · Bengaluru · Pune · Hyderabad · Virtual |
| **Category** | All Categories · Tech · Art · Sports · Cultural · Cooking · Meetup · Music · Workshop · Other |
| **Date** | All Dates · Today · Tomorrow · This Week · This Month |
| **Age group** | All Ages · Kids · Teens · 18+ · 21+ |

Filtering happens instantly on your device — there is no loading spinner between filter taps.

> **Note.** The feed loads the **first 30 events** and filters within them. If a very large number
> of events exists, some may not appear until this is paginated further. See §8.9.

### Booking a ticket

1. Tap an event card to open **Event Details** — full description, date and time, location, host,
   price, and remaining capacity.
2. Tap the main button at the bottom. What it says depends on your relationship to the event:

   | Button | Meaning |
   | :--- | :--- |
   | **Book Now** | Tickets are available — proceeds to checkout |
   | **Sold Out** | Capacity is exhausted; the button is disabled |
   | **View Ticket** | You already booked this one — opens your QR ticket |
   | **Manage Event** | You are the host — opens host tooling |
   | **Book on Website** | The host sells tickets elsewhere; opens their site in your browser |

3. On the **Payment** screen, confirm the booking. Free events complete without a payment step.
4. A **Booking Confirmed** screen appears. Tap through to your ticket, or **Back to Home**.
5. You immediately receive a notification confirming the booking.

If you tap **Book Now** while signed out, the app sends you to sign-in first rather than failing
mid-purchase.

> **Paid events — important.** Payment runs against Razorpay in **test mode**, and the server-side
> signature verification is currently disabled (see §8.9). Do not treat a paid booking in this build
> as a real financial transaction.

### Your ticket

**Profile → My Events → Attended**, or **View Ticket** on the event.

The ticket screen shows a notched ticket card with your **QR code** and ticket code. At the door,
the host scans this QR with their phone. Keep the screen open and brightness up — a dim screen is
the most common reason a scan fails.

Your ticket status shows **Confirmed** before the event and **Checked In** once the host has scanned
you in.

### My Events

**Profile → My Events** has two tabs, each split into **Upcoming** and **Past History**:

- **Attended** — events you booked
- **Hosted** — events you created

### Notifications

Tap the 🔔 on Home. You receive a notification when:

- your booking is confirmed
- you are checked in at an event
- a new event is published **in your city**
- an event you booked is **cancelled** by its host

Use **mark all as read** to clear the unread state.

> **Note.** Notifications are generated and stored correctly by the server, but the app does not
> currently refresh them live or push them to your lock screen — reopen the notifications screen to
> see new ones. See §8.9.

---

## 8.5 For hosts

### Creating an event

Tap the centre **Host** tab. The form covers everything in one scroll:

| Field | Required | Notes |
| :--- | :---: | :--- |
| Event name | ✅ | |
| Description | ✅ | |
| Category | ✅ | One of the nine categories |
| Start date & time | ✅ | Set with a snapping wheel picker |
| End date & time | ✅ | Events disappear from the feed once this passes |
| Location | ✅ | Google Places autocomplete — start typing an address and pick a suggestion |
| Free / Paid | ✅ | Paid reveals a price field |
| Capacity | ✅ | The number of tickets; the event shows **Sold Out** at zero remaining |
| Poster image | ✗ | Picked from your photo library, cropped to 16:9 |
| Intro video URL | ✗ | |
| External ticketing | ✗ | If your tickets are sold on your own site, enter the URL — attendees get **Book on Website** instead of in-app booking |
| Registration deadline | ✗ | Bookings close at this moment. **Must be on or before the start time** — the form rejects a later one |
| Target age group | ✗ | Kids · Teens · 18+ · 21+ — drives the attendee age filter |

Organization accounts see an additional **Organization Hosting Mode** panel.

When you publish, everyone whose profile city matches your event's city is notified automatically.

> **Tip.** Keep posters modest in size. Images are stored inline in the database in this build, so a
> very large poster makes your event slower to load for everyone (see §8.9).

### Managing an event and checking guests in

Open your own event and tap **Manage Event**. Two tabs:

**Guest list** — every attendee with their initial, their ticket code, and a check-in status icon.
This is your door list; it also works as a manual fallback if a phone camera is unavailable.

**Scanner** — the QR check-in tool:

1. Tap the **Scanner** tab. The first time, grant **camera permission** when prompted.
2. Point the camera at the attendee's ticket QR.
3. On success, an alert names the attendee. Tap **Scan Next** to continue down the queue.
4. On failure, tap **Try Again**.

Each QR fires exactly one request, so an attendee cannot be double-counted by holding the code in
frame.

**What the failures mean:**

| Message | Cause | What to do |
| :--- | :--- | :--- |
| *Guest is already checked in* | This ticket was scanned earlier | Already admitted — check the guest list to confirm who |
| *Invalid ticket for this event* | The QR is not a ticket for **this** event | Check they are at the right event, or that they booked |
| *Not authorized* | You are not the host of this event | Only the account that created the event can check guests in |

### Cancelling an event

Deleting an event from its detail view cancels it, and **every attendee is notified automatically**.

---

## 8.6 Your profile

**Profile** tab shows your account summary and links to **My Events**, **Edit Profile**, and
**Log Out**.

**Edit Profile** lets you change your email address, avatar, city, and payout bank details. Changing
your **city** immediately changes which new-event notifications you receive.

---

## 8.7 Quick reference

| I want to… | Do this |
| :--- | :--- |
| Find events near me | Home → City filter → your city |
| Find something this weekend | Home → Date filter → *This Week* |
| See my ticket QR | Profile → My Events → Attended → the event → **View Ticket** |
| Check who is coming to my event | Open the event → **Manage Event** → *Guest list* |
| Admit someone at the door | **Manage Event** → *Scanner* → point at their QR |
| Change which city alerts me | Profile → Edit Profile → City |
| Stop hosting an event | Open the event → delete it; attendees are notified |
| Sign out | Profile → **Log Out** |

---

## 8.8 Troubleshooting

| Symptom | Likely cause | Fix |
| :--- | :--- | :--- |
| Feed shows only three unfamiliar events | The app could not reach the server and fell back to placeholder demo data | Check your connection; confirm the backend is running |
| Feed is slow to load the first time | The server is on a free hosting tier and sleeps when idle | Wait ~30–60 s for the first request; later requests are fast |
| **Please fill in all fields** on sign-up | A required field is blank | Name, email, password, and city are all mandatory |
| Sign-up fails with no obvious reason | That email already has an account | Sign in instead |
| No Sign in with Apple button | You are on Android | Apple sign-in is iOS-only by design |
| Camera stays black in the scanner | Camera permission was denied | Grant camera access to EventHive in your phone's settings |
| A QR will not scan | Dim screen, cracked glass, or a screenshot of the wrong event | Raise the attendee's brightness; otherwise verify their ticket code against the guest list manually |
| Notifications do not update while the app is open | Live refresh is not wired up in this build | Reopen the notifications screen |
| Booking button does nothing when signed out | Expected — the app routes you to sign-in | Sign in and book again |
| An event I booked vanished from the feed | Its end date passed, or the host cancelled it | Past events are hidden from the feed; find it under My Events → Attended → *Past History* |

---

## 8.9 Known behaviours and limitations

Documented deliberately. Each is a real property of this build; the engineering fix for each is in
[Architecture §1.8](./architecture.md#18-known-limitations--future-work).

| # | What you may notice | Why |
| :---: | :--- | :--- |
| 1 | Two people booking the last ticket at the same instant can both succeed | Inventory is decremented without an atomic guard |
| 2 | Paid bookings are not truly settled | Razorpay signature verification is disabled in this build; treat paid flows as a demo |
| 3 | Large posters make events load slowly | Posters are stored inline in the database rather than on a media CDN |
| 4 | Notifications do not arrive live or on your lock screen | The client-side notification provider is stubbed; the server side is complete and tested |
| 5 | The feed shows the first 30 events only | Pagination beyond the first page is not wired into the feed |
| 6 | The first request after a quiet period is slow | Free-tier hosting cold start |
| 7 | Sign-in offers email/password and — on iOS — Apple only | Google sign-in is implemented on the server and in the auth context but **has no button on the sign-in screen**; guest browsing is likewise implemented but unreachable from the UI |

---

← [Setup & Deployment](./setup-and-deployment.md) · [Docs index](./README.md) · Next: [Validation Report](./validation-report.md)
