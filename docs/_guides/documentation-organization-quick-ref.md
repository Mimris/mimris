# Documentation Organization - Quick Reference
This document provides a recommended structure for organizing the Mimris documentation files. The goal is to create a clear, maintainable, and scalable layout that makes it easy for users and contributors to find relevant information.

## Recommended Structure

```
mimris/
├── README.md ✓ (keep)
├── LICENSE ✓ (keep)
├── package.json ✓ (keep)
├── src/ ✓ (keep)
├── docs/
│   ├── index.md
│   ├── roadmap.md
│   ├── changelog.md
│   ├── _guides/
│   │   ├── getting-started.md
│   │   ├── installation.md
│   │   └── system-architecture.md
│   ├── _community/
│   │   ├── contributing.md
│   │   ├── code-of-conduct.md
│   │   ├── support.md
│   │   └── authors.md
│   ├── _features/
│   │   ├── icon-system/
│   │   │   ├── README.md
│   │   │   ├── emoji-icons.md
│   │   │   ├── unicode-characters.md
│   │   │   ├── svg-icons.md
│   │   │   ├── svg-editor-integration.md
│   │   │   └── icon-modal.md
│   │   └── other-features.md
│   ├── _specs/
│   │   ├── README.md
│   │   ├── overview.md
│   │   ├── modelfiles.md
│   │   ├── phdata.md
│   │   └── plan24.md
│   └── assets/
├── spec/ ✗ (DELETE - duplicate)
└── (All .md files moved to docs/)
```

---

## File Migration Map

### Root → `/docs/_features/icon-system/`

| Current File | New Location | New Name |
|---|---|---|
| EMOJI_ICON_FIX_IMPLEMENTATION.md | docs/_features/icon-system/ | emoji-icons.md |
| EMOJI_ICON_FIX_TEST.md | docs/_features/icon-system/ | emoji-icons-testing.md |
| EMOJI_ICON_FIX_VERIFIED.md | docs/_features/icon-system/ | emoji-icons-verified.md |
| SVG_ICON_TAB_FEATURE.md | docs/_features/icon-system/ | svg-icons.md |
| SVG_ICON_TAB_COMPLETE.md | docs/_features/icon-system/ | svg-icons-complete.md |
| SVG_ICON_QUICK_START.md | docs/_features/icon-system/ | svg-icons-quickstart.md |
| SVG_EDITOR_INTEGRATION.md | docs/_features/icon-system/ | svg-editor-integration.md |
| UNICODE_TAB_FEATURE.md | docs/_features/icon-system/ | unicode-characters.md |
| UNICODE_RENDERING_IMPLEMENTATION.md | docs/_features/icon-system/ | unicode-implementation.md |
| ICON_FORMAT_DETECTION_IMPLEMENTATION.md | docs/_features/icon-system/ | icon-modal.md |
| ICON_MENU_UPDATE.md | docs/_features/icon-system/ | icon-modal.md |
| ICON_SUBMENU_IMPLEMENTATION.md | docs/_features/icon-system/ | icon-modal.md |
| TABBED_ICON_MODAL_IMPLEMENTATION.md | docs/_features/icon-system/ | icon-modal.md |

### Root → `/docs/_specs/`

| Current File | New Location |
|---|---|
| /spec/* | /docs/_specs/ |
| /docs/spec/* | /docs/_specs/ |

### Existing Files to Reorganize

| Current Location | New Location |
|---|---|
| /docs/CONTRIBUTING.md | /docs/_community/contributing.md |
| /docs/CODE_OF_CONDUCT.md | /docs/_community/code-of-conduct.md |
| /docs/SUPPORT.md | /docs/_community/support.md |
| /docs/AUTHORS.md | /docs/_community/authors.md |
| /docs/getting-started.md | /docs/_guides/getting-started.md |
| /docs/INSTALLATION.md | /docs/_guides/installation.md |
| /docs/SYSTEM-ARCHITECTURE.md | /docs/_guides/system-architecture.md |

---

## Benefits

### Before
```
Root folder: 13+ .md files ❌ (messy)
Specs: 2 locations ❌ (duplicate)
Features: Scattered ❌ (hard to find)
```

### After
```
Root folder: Clean ✅ (only essentials)
Specs: 1 location ✅ (single source)
Features: Organized by feature ✅ (easy to find)
```

---

## Implementation Checklist

- [ ] Create `/docs/_guides/` folder
- [ ] Create `/docs/_community/` folder
- [ ] Create `/docs/_features/` folder
- [ ] Create `/docs/_features/icon-system/` folder
- [ ] Create `/docs/_specs/` folder
- [ ] Move all spec files to `/docs/_specs/`
- [ ] Move all feature docs to `/docs/_features/icon-system/`
- [ ] Move community files to `/docs/_community/`
- [ ] Move guide files to `/docs/_guides/`
- [ ] Rename files (ALL_CAPS → lowercase-hyphen)
- [ ] Update all links in markdown files
- [ ] Create README.md files for each folder
- [ ] Update `/docs/index.md` with new navigation
- [ ] Delete `/spec/` folder
- [ ] Delete `/docs/spec/` folder
- [ ] Verify all links work
- [ ] Commit changes

---

## Naming Convention

✅ **Use lowercase with hyphens**:
- `emoji-icons.md`
- `svg-editor-integration.md`
- `icon-modal-implementation.md`

❌ **Avoid ALL_CAPS**:
- NOT `EMOJI_ICON_FIX.md`
- NOT `SVG_EDITOR_INTEGRATION.md`

---

## Key Improvements

1. **Reduced Clutter**: Root folder goes from 13+ .md files to clean minimum
2. **No Duplicates**: Single `/docs/_specs/` replaces `/spec/` and `/docs/spec/`
3. **Logical Grouping**: All icon docs in one place
4. **Consistent Naming**: All lowercase with hyphens
5. **Easy Navigation**: Clear folder structure
6. **Scalable**: Easy to add new features or guides
7. **Professional**: Organized structure looks professional

---

## Time Estimate

- **Manual reorganization**: 1-2 hours
- **Link updates**: 30 minutes
- **Testing/verification**: 30 minutes
- **Total**: ~2-3 hours

---

## Questions to Answer

1. Should we proceed with this organization?
2. Do you prefer underscore prefix for folders (`_features`) or something else?
3. Should we rename all files immediately or gradually?
4. Any additional documentation that should be organized?

---

## Full Details

See `documentation-organization.md` for:
- ✅ Complete file-by-file migration plan
- ✅ Folder structure diagrams
- ✅ Naming conventions
- ✅ Navigation examples
- ✅ Implementation steps
- ✅ Benefits analysis

---

## Next Steps

1. Review this recommendation
2. Confirm the structure works for your needs
3. Run the implementation (script or manual)
4. Update documentation site if applicable
5. Commit organized structure

This will result in a professional, well-organized documentation structure that scales with your project!
