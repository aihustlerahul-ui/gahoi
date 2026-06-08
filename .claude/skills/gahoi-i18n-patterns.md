# Gahoi Sarthi — Bilingual UI Patterns (Hindi + English)

Use this skill when creating any UI component, screen, or user-facing string.

## Rules

- Never hardcode any user-facing string — always use i18n keys
- Web (Next.js): use next-intl — import useTranslations from 'next-intl'
- Mobile (React Native): use i18next — import { useTranslation } from 'react-i18next'
- String files live at: packages/shared/locales/en.json and hi.json

## Key naming convention

screen.component.element
Examples:
home.matchCard.sendInterest
profile.wizard.step1.gotraLabel
settings.language.title
interests.tabs.accepted

## Field label pattern — always show both languages

English label / Hindi label
Examples:
'Gotra / गोत्र'
'Never Married / अविवाहित'
'Profile Views / प्रोफाइल व्यून'

## Kundli score labels — always bilingual

Uttam / उत्तम (score 28–36)
Madhyam / मध्यम (score 18–27)
Vichar Yogya / विचार योग्य (score < 18)

## Language switch

- Stored in users.preferred_language DB column AND AsyncStorage (mobile) / localStorage (web)
- Switch must be instant — no page reload, no app restart
- Default: detect from device locale. hi-IN → Hindi, everything else → English
