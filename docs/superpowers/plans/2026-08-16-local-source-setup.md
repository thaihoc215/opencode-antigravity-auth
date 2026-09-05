# Local Source Setup Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Document how to install, build, configure, authenticate, and verify a local source checkout of the plugin.

**Architecture:** Add one self-contained section to `README.md` immediately after the standard installation instructions. Keep npm package installation unchanged and document local source usage as an explicit alternative.

**Tech Stack:** Markdown, npm, TypeScript, OpenCode

## Global Constraints

- Require Node.js 20 or newer, matching `package.json`.
- Use `npm install` and `npm run build`, matching the repository scripts.
- Configure OpenCode with the generated `dist/index.js` file.
- Include Windows and macOS/Linux path examples.
- Tell users to restart OpenCode after rebuilding the plugin.
- Do not alter application code or existing npm installation behavior.

---

### Task 1: Add local source setup instructions

**Files:**
- Modify: `README.md:104`

**Interfaces:**
- Consumes: `package.json` build scripts and `tsconfig.build.json` output directory
- Produces: A complete local setup workflow for OpenCode users

- [x] **Step 1: Add the local setup section**

Add a `Local Development / Install From Source` section containing prerequisites, clone/install/build commands, `plugin` configuration examples, restart guidance, authentication, model discovery, a sample request, and rebuild instructions.

- [x] **Step 2: Validate documented repository commands**

Run:

```bash
npm run build
```

Expected: TypeScript compilation exits successfully and creates `dist/index.js`.

- [x] **Step 3: Validate OpenCode plugin discovery**

Run:

```bash
opencode models google
```

Expected: Output includes `google/antigravity-claude-opus-4-6-thinking` and other Antigravity models.

- [x] **Step 4: Review the documentation diff**

Run:

```bash
git diff -- README.md
```

Expected: The new local source setup section appears in `README.md`; unrelated changes already present in the worktree remain untouched.
