# RULES.MD: Common Rules

## Rules

1. **Read the reference first** — always check the SKILLS docs before taking actions
2. **Plan before acting** — outline what you'll do and confirm with the user
3. **Paginate** — never assume all data fits in one response
4. **Validate before writing** — check IDs exist, required fields present
5. **Confirm destructive ops** — get explicit user approval before deletes or bulk changes
6. **Report progress** — show what happened at each step
7. **Handle errors** — if one item fails, continue with the rest and report failures at the end
8. **User approved IDs** — if creating a new ID, always ask user's approval or preference

## Platform URLs

Read `RIERINO_UI_BASE_URL` from the project root `.env` for constructing UI links such as: `${RIERINO_UI_BASE_URL}/app/design/common/ui?id={id}`