---
name: laju-ai-feature-guard
description: Use when designing, reviewing, or testing Laju AI fit scoring, AI document notes, profile parsing, prompt templates, model usage, privacy controls, cost limits, or hallucination risk.
---

# Laju AI Feature Guard

## Purpose
Make AI features useful without turning career decisions into opaque guesses.

## Required Checks
1. User consent for every document/profile input.
2. Clear distinction between user-provided facts and model inference.
3. Structured output schema for scores and document notes.
4. Token/cost logging per user and per feature.
5. No AI output auto-sends applications, emails, or public content.

## Fit Scoring Rules
- Scores are guidance, not truth.
- Always show dimensional breakdown: skills, experience, seniority, location/work type, overall.
- Include missing evidence and suggested next action.
- Store score input version so old scores can be understood later.

## Document Notes Rules
- Phase 7 starts with text notes or rewrite guidance only.
- DOCX generation waits until users prove text notes are valuable.
- Never fabricate experience, skills, education, employers, or results.
- Preserve factual resume claims unless user edits them.

## Output Format
- `AI feature`
- `Inputs`
- `Output schema`
- `User-facing caveat`
- `Cost control`
- `Privacy control`
- `Go/No-Go`

## Guardrails
- No hidden scraping of LinkedIn profile data.
- No public storage of resumes or generated docs.
- No uncapped AI usage on free tier.
