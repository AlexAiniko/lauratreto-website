# Cross-Model Protocol -- Claude (Alpha) <-> Codex (Laura)

**Purpose:** Define how files flow between Alex's Claude org (Alpha) and Laura's Codex workspace.

## How It Works

Laura runs her business with Codex (OpenAI) on her computer. Alex runs his org with Claude (Alpha). This workspace is the shared bridge. Neither system contaminates the other.

## Folder Structure

```
codex-sync/                 <- Laura/Codex -> Alpha direction
├── PROTOCOL.md             <- This file
├── codex-database/         <- Exports from Laura's Codex knowledge base
└── inbox/                  <- Raw Codex outputs for Alpha to review/improve
```

## Flow

### Codex -> Alpha (Laura's work comes to us)
1. Alex drops files in `Input/` and tells Alpha "this is from Laura" (or any reference to Laura/her business)
2. Alpha routes the files to `codex-sync/` internally
3. Alpha processes within the Laura project context ONLY
4. Alpha places deliverables in `Output/` with `LAURA-` prefix (e.g., `LAURA-content-review.md`)

### Alpha -> Codex (Our work goes to Laura)
1. Alpha creates deliverables and places them in `Output/` with `LAURA-` prefix
2. Alex picks them up from Output and brings to Laura's Codex workspace
3. Output files are formatted for Codex consumption (plain markdown, no Alpha-specific references)

### Naming Convention
- **Output files for Laura:** `LAURA-{description}.md` (e.g., `LAURA-instagram-scripts.md`, `LAURA-codex-improvements.md`)
- **Input files from Laura:** Any name -- Alex just tells Alpha it's from Laura

### Why This Works
- Alex uses the same Input/Output workflow for everything -- no extra folders to navigate
- Alpha handles all internal routing and isolation automatically
- The `codex-sync/` folder exists as Alpha's internal workspace for Laura's project
- Clean separation: Alex never needs to go inside the project folder structure

## Rules

1. **Isolation is absolute.** Alpha never loads Laura's Codex context at boot. Only when Alex says "let's work on Laura."
2. **No cross-contamination.** Laura's Codex instructions do not influence Alpha's operating rules. Alpha's CLAUDE.md does not get shared with Codex.
3. **Alex is the bridge.** Alex drops Laura files in Input/ and picks up deliverables from Output/. Alpha handles internal routing. No automated sync between Claude and Codex.
4. **Codex database stays in codex-sync/.** If Alex brings Laura's full Codex KB, it goes in `codex-database/`. Alpha can read, analyze, and suggest improvements but does not modify the originals.
5. **Format for Codex consumption.** When Alpha outputs files meant for Codex to read, use plain markdown with clear headers. No Alpha-specific references (no agent names, no task IDs, no database references).
6. **Version awareness.** When analyzing Codex outputs, note the date. Codex context may be newer or older than what Alpha knows.

## What Alpha Can Do With Codex Files

- Read and understand Codex's knowledge base structure
- Identify gaps, redundancies, or contradictions
- Suggest better prompts/instructions for Laura's Codex setup
- Improve content quality (scripts, captions, posts)
- Build automations and integrations (social media tools)
- Provide strategic analysis (positioning, audience, competitive)
- Format outputs so Codex can easily consume them

## What Alpha Cannot Do

- Modify Laura's Codex configuration directly
- Send files to Laura's Codex automatically
- Override Laura's Codex decisions or instructions
- Load Laura's context during non-Laura sessions
