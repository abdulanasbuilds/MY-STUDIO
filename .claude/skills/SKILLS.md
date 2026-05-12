# MY STUDIO — Skills Registry

> This file lists all available agent skills for MY STUDIO.
> Skills provide specialized knowledge and patterns for specific task types.

---

## Custom Skills (`.claude/skills/my-studio/`)

| Skill | File | Triggers |
|-------|------|----------|
| Architecture | `my-studio-architecture.md` | "add module", "new feature", "integrate model", "connect to", "architecture decision" |
| Modal GPU | `my-studio-modal-gpu.md` | "GPU function", "modal function", "AI model", "pipeline", "inference", "generate video" |
| Supabase RLS | `my-studio-supabase-rls.md` | "database", "table", "migration", "RLS", "policy", "Supabase query" |
| Security | `my-studio-security.md` | "API route", "endpoint", "auth", "security", "authentication", "secrets" |
| UI Components | `my-studio-ui-components.md` | "component", "UI", "page", "design", "frontend", "button", "form", "layout" |
| Open Source Models | `my-studio-open-source-models.md` | Model names, "integrate", "open source", "AI model" |

---

## How Skills Work

1. Agent detects trigger words in user request
2. Agent reads the matching skill file
3. Skill provides patterns, rules, and templates
4. Agent follows skill guidance while writing code

## Activation Priority

- **Security** skill always takes priority over other skills
- **Architecture** skill activates before implementation skills
- Multiple skills can activate simultaneously (e.g., UI + Security for an API-connected page)

---

## Reading Order for New Agents

1. CONTEXT.md — what the project is
2. PLAN.md — how it's built
3. CLAUDE.md — coding rules
4. AGENTS.md — behavioral rules
5. This file — available skills
6. Relevant skill file(s) — task-specific patterns
