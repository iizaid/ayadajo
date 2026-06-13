# Ayadajo Design Reference

This document translates the files in `external design/` into Ayadajo-specific rules. The source reference is from another product category, so copy the design philosophy only, not the brand, copy, logos, characters, or fintech concepts.

## 1. Colors

- Use a warm cream canvas instead of pure white. Source token: `#fbfaf9`.
- Use soft off-white and parchment surfaces for panels. Source tokens: `#ffffff`, `#f8f7f4`, `#f2f0ed`.
- Use graphite and charcoal for text. Source tokens: `#474645`, `#343433`, `#121212`.
- Use accent colors sparingly. The source orange `#ff3e00` should become an intentional action or emphasis accent, not a broad fill.
- For healthcare trust, bias toward warm neutrals, graphite text, restrained teal/green success states, and limited urgent colors.
- Do not use bright illustration colors as generic UI chrome.

## 2. Typography

- Arabic UI should prioritize IBM Plex Sans Arabic, Noto Sans Arabic, or Cairo.
- Latin fallback should use Inter or a system sans stack.
- Do not embed private custom font files from the reference.
- The source uses tight, confident hierarchy. Adapt this with strong headings, readable Arabic line-height, and restrained weights.
- Avoid excessive bold weights. Prefer 400, 500, and 600 for most UI.
- Large display typography should be used sparingly and only where it helps orientation.

## 3. Spacing

- Use a 4px spacing foundation.
- Keep operational screens calm and dense: common gaps around 8px, 12px, 16px, 24px, and 32px.
- Use generous section spacing for marketing or onboarding screens, but tighter spacing in dashboards and clinic workflows.
- Preserve enough breathing room around cards and forms to avoid generic cramped SaaS layouts.

## 4. Radii

- Use soft but controlled radii.
- Cards should generally use about 10px.
- Inputs should generally use about 10px.
- Primary buttons should use pill radii around 32px.
- Large preview or media panels may use 24px when appropriate.
- Avoid sharp enterprise corners and avoid over-rounded playful surfaces in clinical workflows.

## 5. Surface and Card Treatment

- Define depth through warm inset borders, not heavy drop shadows.
- Preferred card treatment: white or off-white surface with a subtle 1px inset stone outline.
- Use recessed panels with `#f8f7f4` for contained previews, empty states, or grouped settings.
- Reserve real shadows for rare elevated states such as overlays, not normal dashboard cards.
- Avoid stacked nested cards.

## 6. Buttons

- Primary actions should use dark charcoal or near-black pill buttons with clear contrast.
- Secondary actions should use warm light pill buttons or subtle outlined treatments.
- Text links may use a restrained warm accent color.
- Buttons need clear hover, focus, loading, and disabled states.
- Destructive actions must use explicit labels and confirmation; do not rely on color alone.

## 7. Forms

- Forms should be compact, readable, and RTL-first.
- Inputs should use warm surfaces, subtle inset borders, and clear focus rings.
- Labels must be explicit and Arabic-friendly.
- Error messages should be clear, short, and generic when privacy matters.
- Use field-level validation and preserve input after failed submissions.
- Phone, money, and date/time fields must be optimized for clinic operations in Jordan.

## 8. Dashboard Layout Direction

- Clinic app navigation should sit on the right in RTL.
- The first operational screen should prioritize Today's Schedule, patient search, and quick actions.
- Use warm canvas, restrained cards, strong text hierarchy, and minimal color.
- Status should combine label plus icon or text, not color alone.
- Dashboard density should feel like a polished clinic operations tool, not a generic analytics template.

## 9. Arabic RTL Adaptation

- Build components RTL-first rather than flipping later.
- Use logical spacing and alignment.
- Right-align Arabic reading flows while preserving numeric readability.
- Keep Western digits for times, phone numbers, and money unless later changed.
- Verify mixed Arabic/Latin content with bidi isolation.
- Use Arabic copy that is practical and direct, not translated marketing filler.

## 10. What to Avoid

- Do not copy the external product's brand name, logo, illustration characters, fintech language, or crypto references.
- Do not use pure white as the page background.
- Do not use blue/purple SaaS gradients.
- Do not use random glassmorphism.
- Do not make every card float with shadows.
- Do not overuse orange or bright accents.
- Do not add cartoon decoration that reduces medical trust.
- Do not create a generic admin dashboard look.

## 11. Dental Clinic Adaptation

- Translate the warmth of the reference into a trustworthy clinic operating system.
- Replace playful fintech imagery with practical clinic visual language: schedules, patient cards, treatment notes, reminders, files, and billing.
- Keep the emotional tone calm, competent, and human.
- Use accents to guide action: urgent appointment states, reminder actions, and confirmations.
- Prioritize receptionist speed and doctor readability over decorative density.

## 12. Tokens to Add Later in Milestone 1

During Milestone 1, add these design tokens to Tailwind/theme rather than copying the reference directly:

- `canvas`: warm cream based on `#fbfaf9`.
- `surface`: off-white card surface.
- `surface-recessed`: parchment panel based on `#f8f7f4`.
- `border-subtle`: warm stone based on `#f2f0ed`.
- `text-primary`: charcoal/graphite based on `#343433`.
- `text-secondary`: graphite based on `#474645`.
- `text-muted`: ash based on `#848281`.
- `accent`: a restrained Ayadajo action accent inspired by `#ff3e00`, adjusted if needed for healthcare trust and contrast.
- `success`, `warning`, `danger`, and `info`: accessible status colors with text labels.
- Radii: card `10px`, input `10px`, pill `32px`, large panel `24px`.
- Shadows: an inset border shadow token for cards and minimal overlay shadows.
- Font families: Arabic UI font stack first, Inter/system for Latin fallback.
