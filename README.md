# TCG Idle AI Setup

This folder contains a ready-to-use agent and skill setup for **Claude Code + Codex in VS Code**.

## Included
- `AGENTS.md`
- `/agents/*.md`
- `/skills/*/SKILL.md`
- `/prompts/*.txt`
- `PLAN.md` copy for local project reference

## Recommended Usage Pattern

### Claude
Use Claude for:
- architecture
- planning
- balance design
- idle economy design
- UI/product polish reviews
- content generation
- visual pipeline definition
- QA passes

### Codex
Use Codex for:
- file creation
- feature implementation
- targeted edits
- structured refactors
- repetitive data formatting

## Core Agents
- system-architect
- gameplay-builder
- ui-product-designer
- combat-balance-designer
- idle-economy-designer
- content-and-card-generator
- visual-pipeline-director
- qa-bug-hunter
- refactor-guardian

## Example Flow
1. Ask Claude to plan the next slice using `prompts/claude_phase1_plan.txt`
2. Ask Codex to implement a narrow slice using a prompt like `prompts/codex_build_shell.txt`
3. Ask Claude to review visual/product quality
4. Ask Claude to run a QA pass
5. Ask Codex to apply only the approved fixes

## Important Rule
This setup assumes the game should feel like a **polished product**, not an internal prototype.
