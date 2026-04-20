# Skill: save-load-safety

## Purpose
Add or modify systems without compromising persistence integrity.

## Output Format
1. affected state shape
2. default-safe loading plan
3. migration/fallback notes
4. save/load code impact
5. reload test checklist

## Checklist
- serializable state only
- safe defaults for missing fields
- resilient loading for partial/older saves
- no hidden state derived only from runtime if it needs persistence

## Rules
- persistence is not optional
- always mention how to test reload behavior
