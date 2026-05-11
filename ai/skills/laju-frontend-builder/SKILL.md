---
name: laju-frontend-builder
description: Use when designing or implementing Laju frontend screens, components, interaction states, dashboard layouts, Kanban/table views, reminders, settings, public pages, or responsive UI.
---

# Laju Frontend Builder

## Product Feel
Laju should feel like a calm work tool for repeated use: dense enough to scan, light enough to trust, and faster than a spreadsheet.

## Default Stack
- Next.js App Router
- Tailwind CSS
- shadcn/ui
- dnd-kit for Kanban drag/drop
- Recharts only after analytics phase

## Screen Rules
- First authenticated screen: operational dashboard, not marketing copy.
- Use a fixed/collapsible sidebar for app navigation.
- Use slide-over panels for entry creation and detail editing.
- Kanban and table are equal views; persist view preference per pipeline.
- Empty states must guide the next action without becoming a landing page.
- Reminder surfaces should answer: "what needs attention today?"

## Components Expected
- Entry card
- Entry slide-over
- Status selector
- Pipeline mode toggle
- Filter bar
- Stale entry row
- Activity timeline
- CSV export action
- Invite whitelist control

## Responsive Rules
- Desktop-first, laptop-polished.
- Tablet usable.
- Mobile acceptable for viewing and quick updates, not full workflow.

## Output Format
- `Screen intent`
- `Primary user action`
- `Component list`
- `States`
- `Implementation notes`
- `QA checks`

## Guardrails
- Do not build decorative marketing-first UI inside the app.
- Do not add AI UI in v0.1 unless it is explicitly a waitlist or pilot path.
- Do not add nested cards or oversized hero sections to operational screens.
