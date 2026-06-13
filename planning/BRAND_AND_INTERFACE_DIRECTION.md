# Ayadajo — Brand & Interface Direction

How Ayadajo looks, sounds, and feels. Goal: **medical-grade trust + modern simplicity, Arabic-first.** Calm, clean, confident — not flashy, not clinical-cold, not toy-like.

---

## Product positioning (brand level)
- **Ayadajo** = "the operating system that runs your dental clinic's day." Focused, local, dependable.
- One-liner: **نظام تشغيل عيادة الأسنان — بسيط، بالعربي، من المتصفح.** ("A dental clinic operating system — simple, in Arabic, from the browser.")
- Personality: helpful, competent, respectful, modern, trustworthy. Like a sharp, calm clinic manager — not a loud salesperson, not a sterile hospital system.

## Relationship to the AtlasJo brand
- **AtlasJo** = the company (the maker, the trust anchor, the operator/support). **Ayadajo** = the product.
- Lockup: "**Ayadajo** by **AtlasJo**" — Ayadajo leads in-product; "by AtlasJo" appears in footer, login, emails, and sales as the credibility signal.
- Ayadajo has its own product identity (name, logo, color) but stays visually compatible with AtlasJo (a family resemblance, not a clone). Super Admin clearly reads "AtlasJo Admin" (distinct shell).
- The name **Ayadajo** evokes Arabic "عيادة" (clinic) — lean into that warmth + medical relevance.

## Tone of voice
- **Clear, short, respectful, human.** Speak like a helpful local professional.
- Arabic-first, naturally Jordanian (not stiff MSA, not slangy). Warm but precise.
- Confident, never hypey. No jargon, no buzzwords, no exclamation overload.
- Reassuring around data/trust ("بياناتك تخصّك ومحمية").
- Action-oriented microcopy (verbs the user understands): «احجز موعد», «أضف مريض», «تذكير واتساب».

## Arabic-first language style
- Default everything in Arabic; RTL-first layout.
- Use clinic-familiar terms (موعد، مريض، طبيب، خطة علاج، دفعة، رصيد) — not software jargon.
- Numerals: Western digits by default for phones/money/times (clarity); allow Eastern Arabic later as preference.
- Keep sentences short; labels concise; avoid translated-from-English awkwardness — write Arabic natively.
- Mixed content (Latin names/phones inside Arabic) handled with correct bidi.

## Visual direction
- **Clean, spacious, calm.** Generous whitespace, clear hierarchy, large readable type, soft surfaces. Information-dense where needed (schedule, tables) but never cluttered.
- "**Medical but modern**": trustworthy and precise, yet friendly and light — not the cold gray of legacy hospital software, not a playful consumer app.
- Card-based dashboard; clear status chips; obvious primary actions; minimal chrome.
- Subtle depth (soft shadows/borders), restrained motion (no heavy animation — respects weak devices).

## Colors
- **Primary:** a calm, trustworthy **teal / medical blue-green** (health, calm, cleanliness) — Ayadajo's signature.
- **Neutrals:** soft off-white/very light gray backgrounds; dark slate text (not pure black).
- **Accent:** one warm secondary (e.g. a soft coral/amber) used sparingly for highlights/CTAs.
- **Status colors (with labels + icons, colorblind-safe — the operator uses a daltonized theme):**
  - booked/neutral = slate/blue · confirmed = teal · arrived/waiting = amber · completed = green · cancelled = gray · no-show = red/orange.
  - Never rely on color alone — always pair with a label/icon.
- Keep the palette small and consistent; avoid heavy gradients.

## Typography
- **Arabic UI font:** clean, modern, highly legible — **IBM Plex Sans Arabic**, **Cairo**, or **Noto Sans Arabic** (test weights + numerals).
- Slightly larger base size + comfortable line-height for Arabic legibility.
- Clear type scale (display / heading / body / caption); limited weights (regular + medium/semibold).
- Latin fallback that pairs well for names/numbers.

## Dashboard style
- A row of **metric cards** (operational + role-gated financial), then **today's upcoming** + alerts.
- Numbers are the hero (big, clear); each card has a plain-Arabic label and a tiny context line ("هذا الشهر").
- Calm, scannable, owner can read it in 5 seconds. No vanity charts in V1 (a simple trend later).

## In-app UI direction
- **Today's Schedule** is the signature screen: clear, grouped, fast, inline actions — the thing people remember.
- Tables/lists with instant search, clear rows, obvious actions; sticky primary buttons.
- Forms: minimal required fields, inline validation, Arabic labels, big touch targets (tablet/phone).
- Consistent components (shadcn/ui, RTL): StatusBadge, MetricCard, AppointmentRow, PatientCard, EmptyState, ConfirmDialog.

## Empty states (tone)
- Friendly + actionable, never blank/dead. e.g. «ما في مرضى بعد — أضف أول مريض» with a primary button.
- Encouraging, brief, in Arabic; turn emptiness into a next step.

## Error messages (tone)
- Calm, plain Arabic, no technical jargon, no scary codes. Say what happened + what to do.
- e.g. «ما قدرنا نحفظ التعديل — تأكد من الاتصال وجرّب مرة ثانية.» Preserve the user's input. Never expose stack traces.
- For conflicts: «هذا الموعد محجوز لنفس الطبيب — اختر وقت ثاني» + suggest the nearest free slot.

## Trust-building UI elements
- Visible "**by AtlasJo**" + clinic name; professional login + emails.
- Clear data ownership messaging ("بياناتك تخصّك").
- Subtle security cues where relevant (private files, audit, "تم الحفظ" confirmations).
- Professional receipts/invoices (clinic logo, clean layout) — a tangible trust artifact patients see.
- Reliability signals: fast loads, clear save states, no broken Arabic, consistent design.
- Honest, human support presence (WhatsApp), not a faceless system.

## What to avoid visually
- Cold, dated "hospital software" gray-on-gray.
- Toy-like, overly playful consumer-app look (undermines medical trust).
- Clutter, dense menus, too many colors, heavy gradients/animations.
- English-first or broken RTL (mirrored icons wrong, Latin numerals where Arabic expected, misaligned text).
- Stock-photo-heavy, generic SaaS-template feel.
- Anything that slows weak clinic devices/connections.

## Landing page direction
- **Arabic-first, RTL, mobile-first.** Above the fold: the one-liner value prop + a screenshot of **Today's Schedule** + a clear CTA («اطلب عرض» / WhatsApp).
- Sections: the pain (no-shows, chaos, lost records) → how Ayadajo fixes it (3–4 simple benefits with screenshots) → "built only for dental clinics in Jordan" → trust (data safety, by AtlasJo) → pricing or "contact for pricing" → testimonials (once you have them) → CTA + WhatsApp.
- Tone: confident, simple, local, trustworthy. Real product screenshots > illustrations. Fast-loading.
- One primary CTA repeated; reduce choices; make contacting AtlasJo effortless.

---

## Brand quick-reference
- **Name:** Ayadajo (by AtlasJo) · **Feel:** medical-grade trust + modern simplicity · **Voice:** clear, warm, Jordanian Arabic, respectful · **Color:** calm teal/medical blue-green + soft neutrals + one warm accent · **Type:** modern legible Arabic (Plex Arabic/Cairo/Noto) · **Signature screen:** Today's Schedule · **Avoid:** cold hospital gray, toy-app playfulness, clutter, broken RTL.
