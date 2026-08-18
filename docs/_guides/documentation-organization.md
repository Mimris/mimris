# Documentation Organization - Recommendation

## Current State

### Problems Identified

1. **Duplicate `/spec` folders**
   - `/spec/` in root
   - `/docs/spec/` (same content)
   - Both contain: Modelfiles.md, Overview.md, Plan24.md, README.md, phData.md

2. **Documentation scattered in root**
   - 13+ .md files at top level:
     - EMOJI_ICON_FIX_*.md (multiple)
     - SVG_ICON_*.md (multiple)
     - UNICODE_*.md (multiple)
     - ICON_*.md (multiple)
     - IMPLEMENTATION_*.md (multiple)
     - CASCADING_SUBMENU_FIX.md
     - TABBED_ICON_MODAL_IMPLEMENTATION.md

3. **Inconsistent structure**
   - Original project docs in `/docs/`
   - Project specs in both `/spec/` and `/docs/spec/`
   - Feature documentation at root level

---

## Recommended Organization

### Structure

```
/mimris
├── README.md (main project readme - keep at root)
├── LICENSE & LICENSE.md (keep at root)
├── docs/
│   ├── _config.yml
│   ├── _guides/
│   │   ├── getting-started.md
│   │   ├── installation.md
│   │   └── system-architecture.md
│   ├── _community/
│   │   ├── code-of-conduct.md
│   │   ├── contributing.md
│   │   ├── support.md
│   │   └── authors.md
│   ├── _features/
│   │   ├── icon-system/
│   │   │   ├── emoji-icons.md
│   │   │   ├── svg-icons.md
│   │   │   ├── unicode-characters.md
│   │   │   └── svg-editor-integration.md
│   │   ├── icon-modal.md
│   │   └── other-features.md
│   ├── _specs/
│   │   ├── modelfiles.md
│   │   ├── overview.md
│   │   ├── phdata.md
│   │   ├── plan24.md
│   │   └── README.md
│   ├── index.md
│   ├── roadmap.md
│   ├── changelog.md
│   ├── additional-docs.md
│   └── assets/
├── spec/ (DELETE - duplicate of docs/_specs/)
└── src/
```

---

## Migration Plan

### Phase 1: Organize `/docs` folder
1. ✅ Keep existing structure in `/docs/`
2. ✅ Move `/docs/spec/*` → `/docs/_specs/`
3. ✅ Create `/docs/_features/icon-system/` subfolder
4. ✅ Create `/docs/_community/` subfolder
5. ✅ Create `/docs/_guides/` subfolder

### Phase 2: Move feature documentation
Move from root to `/docs/_features/icon-system/`:
- `EMOJI_ICON_FIX_IMPLEMENTATION.md` → `emoji-icons.md`
- `EMOJI_ICON_FIX_TEST.md` → `emoji-icons-testing.md`
- `EMOJI_ICON_FIX_VERIFIED.md` → `emoji-icons-verified.md`
- `SVG_ICON_TAB_FEATURE.md` → `svg-icons.md`
- `SVG_ICON_TAB_COMPLETE.md` → `svg-icons-complete.md`
- `SVG_ICON_QUICK_START.md` → `svg-icons-quickstart.md`
- `SVG_EDITOR_INTEGRATION.md` → `svg-editor-integration.md`
- `UNICODE_TAB_FEATURE.md` → `unicode-characters.md`
- `UNICODE_RENDERING_IMPLEMENTATION.md` → `unicode-implementation.md`
- `ICON_*.md` files → `icon-modal.md` (consolidate)
- `TABBED_ICON_MODAL_IMPLEMENTATION.md` → `icon-modal-implementation.md`

### Phase 3: Consolidate/move community files
Move to `/docs/_community/`:
- `CONTRIBUTING.md` (already in docs, move here)
- `CODE_OF_CONDUCT.md` (already in docs, move here)
- `SUPPORT.md` (already in docs, move here)
- `AUTHORS.md` (already in docs, move here)

### Phase 4: Clean up root
- Delete `/spec/` folder (duplicate)
- Delete old .md files after moving to docs
- Keep only: `README.md`, `LICENSE`, `LICENSE.md`

---

## File Organization Detail

### `/docs/_features/icon-system/`

This folder contains all icon feature documentation:

```
icon-system/
├── README.md
│   ├── Overview of icon system
│   ├── Feature quick links
│   └── Navigation to sub-docs
│
├── emoji-icons.md
│   ├── Emoji support overview
│   ├── Format: \UXXXXXXXX
│   ├── Storage & persistence
│   └── Testing info
│
├── emoji-icons-testing.md
│   ├── Test procedures
│   ├── Expected behavior
│   └── Verification checklist
│
├── unicode-characters.md
│   ├── Unicode support (♥, ★, etc.)
│   ├── Format: \uXXXX
│   ├── Available characters
│   └── Implementation details
│
├── svg-icons.md
│   ├── SVG icon support
│   ├── Storage as base64 data URLs
│   ├── Sizing guidelines
│   └── Examples
│
├── svg-icons-quickstart.md
│   ├── Quick examples
│   ├── Common SVG templates
│   ├── Sizing reference
│   └── Tips & tricks
│
├── svg-editor-integration.md
│   ├── Available editors (Blob Maker, Method Draw, Figma)
│   ├── How to use each editor
│   ├── Workflow examples
│   └── Common issues
│
└── icon-modal.md
    ├── Change Icon modal overview
    ├── All available tabs
    ├── How to select icons
    └── Integration with diagram
```

### `/docs/_specs/`

Project specifications (replaces duplicate `/spec/` and `/docs/spec/`):

```
_specs/
├── README.md (specs overview)
├── overview.md (project overview)
├── modelfiles.md (model file specification)
├── phdata.md (phData specification)
└── plan24.md (Plan24 specification)
```

### `/docs/_community/`

Community and contribution files:

```
_community/
├── code-of-conduct.md
├── contributing.md
├── support.md
└── authors.md
```

### `/docs/_guides/`

Getting started and guides:

```
_guides/
├── getting-started.md (move from docs root)
├── installation.md (rename INSTALLATION.md)
└── system-architecture.md (move from docs root)
```

---

## Naming Conventions

### File Names
- ✅ **Lowercase with hyphens**: `emoji-icons.md`, `svg-editor-integration.md`
- ✅ **Descriptive**: `emoji-icons-testing.md` (not just `test.md`)
- ✅ **Action-oriented for procedures**: `svg-icons-quickstart.md`
- ❌ **Avoid ALL_CAPS**: not `EMOJI_ICON_FIX.md`
- ❌ **Avoid mixed case**: not `EmojiIcons.md`

### Folder Names
- ✅ **Lowercase with underscores prefix**: `_features`, `_community`, `_guides`
- ✅ **Descriptive**: `icon-system`, not `icons`
- ✅ **Grouping with underscore**: Groups documentation, keeps them at top

### Heading Structure in Files
```markdown
# Main Title (H1)
## Major Section (H2)
### Subsection (H3)
#### Details (H4)
```

---

## Navigation & Linking

### Update README files
Each folder should have a `README.md`:

**`/docs/_features/icon-system/README.md`**:
```markdown
# Icon System Documentation

Complete guide to the icon system in MIMRIS.

## Quick Links
- [Emoji Icons](./emoji-icons.md)
- [SVG Icons](./svg-icons.md)
- [Unicode Characters](./unicode-characters.md)
- [Icon Modal](./icon-modal.md)
- [SVG Editor Integration](./svg-editor-integration.md)

## Features
- ✅ Emoji support with persistence
- ✅ SVG icon upload and editing
- ✅ Unicode character support
- ✅ Multiple icon sources

## Getting Started
See [svg-icons-quickstart.md](./svg-icons-quickstart.md)
```

**`/docs/README.md`** or **`/docs/index.md`** (already exists):
```markdown
# Documentation

## Features
- [Icon System](./docs/_features/icon-system/)
- Other features...

## Specifications
- [Project Specs](./docs/_specs/)

## Community
- [Contributing](./docs/_community/contributing.md)
- [Support](./docs/_community/support.md)

## Guides
- [Getting Started](./docs/_guides/getting-started.md)
- [Installation](./docs/_guides/installation.md)
```

---

## Benefits of This Organization

✅ **Clear hierarchy**: Features grouped logically
✅ **Reduced clutter**: Root folder clean and minimal
✅ **Easy navigation**: Related docs grouped together
✅ **Scalable**: Easy to add new features or guides
✅ **Consistent naming**: All lowercase, hyphenated
✅ **Single source of truth**: No duplicate spec folders
✅ **Better discoverability**: Organized structure helps newcomers
✅ **Easier maintenance**: Clear where each doc belongs

---

## Implementation Steps

### Manual Steps (1-2 hours)

1. Create folder structure:
   ```bash
   mkdir -p docs/_features/icon-system
   mkdir -p docs/_community
   mkdir -p docs/_guides
   mkdir -p docs/_specs
   ```

2. Move spec files:
   ```bash
   mv spec/* docs/_specs/
   mv docs/spec/* docs/_specs/  (if any additional files)
   ```

3. Move feature docs from root to `docs/_features/icon-system/`:
   ```bash
   mv EMOJI_ICON_FIX_*.md docs/_features/icon-system/
   mv SVG_ICON_*.md docs/_features/icon-system/
   mv UNICODE_*.md docs/_features/icon-system/
   mv SVG_EDITOR_INTEGRATION.md docs/_features/icon-system/
   ```

4. Consolidate/move icon modal docs

5. Update all internal links in markdown files to point to new locations

6. Update `docs/index.md` with new navigation structure

7. Delete duplicate folders:
   ```bash
   rm -rf spec/
   rm -rf docs/spec/
   ```

### Automated Steps (Optional)
Could create a script to:
- Rename files (ALL_CAPS.md → lowercase-hyphen.md)
- Update relative links in all markdown files
- Create README.md files for each folder

---

## Deliverables

After implementation:

✅ Clean root folder (only README, LICENSE, package.json, etc.)
✅ Organized `/docs/` folder with clear structure
✅ No duplicate specification folders
✅ All feature documentation in one place
✅ Easy-to-navigate structure for contributors
✅ Updated navigation/index files
✅ Consistent naming conventions

---

## Questions for User

Before implementation, confirm:

1. ❓ Should `/spec/` at root be deleted (replacing with `/docs/_specs/`)?
2. ❓ Should all root-level feature .md files move to `/docs/`?
3. ❓ Is the underscore prefix for folder grouping okay (`_features`, `_community`)?
4. ❓ Should we rename ALL_CAPS files to lowercase-hyphen format?
5. ❓ Should we create README.md files for each subfolder?
6. ❓ Any other documentation that should be organized here?

---

## Summary

The recommended structure:
- ✅ Eliminates duplicate `/spec/` folders
- ✅ Organizes feature docs by feature (icon system, etc.)
- ✅ Keeps root clean and minimal
- ✅ Uses clear, consistent naming
- ✅ Makes documentation discoverable and maintainable
- ✅ Scales well for future features

This transforms documentation from scattered files into a well-organized, professional structure.
