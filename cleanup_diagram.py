#!/usr/bin/env python3
"""
Clean up orphaned lane reorder code from Diagram.tsx by removing duplicate
buildNodeMenuItems and handleEditRelationship definitions.
"""

input_file = '/Users/dagrojahnkarlsen/github/mimris/src/components/gojs/components/Diagram.tsx'
output_file = '/Users/dagrojahnkarlsen/github/mimris/src/components/gojs/components/Diagram.tsx.cleaned'

print("Reading file...")
with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# Find all instances of buildNodeMenuItems
buildnode_lines = []
for i, line in enumerate(lines, 1):
    if 'const buildNodeMenuItems = (part: go.Part): HtmlMenuItem[] => {' in line:
        buildnode_lines.append(i)
        print(f"Found buildNodeMenuItems at line {i}")

# Find all instances of handleEditRelationship
handleedit_lines = []
for i, line in enumerate(lines, 1):
    if 'const handleEditRelationship = (diagram: go.Diagram, part: go.Link) => {' in line:
        handleedit_lines.append(i)
        print(f"Found handleEditRelationship at line {i}")

# Strategy: Keep first buildNodeMenuItems, skip second
# For handleEditRelationship: skip middle duplicate (should be 3 total)
output_lines = []
skip_until_line = None

for i, line in enumerate(lines, 1):
    # Skip if we're in a skip range
    if skip_until_line and i < skip_until_line:
        continue
    elif skip_until_line and i == skip_until_line:
        skip_until_line = None
        # Continue to process this line normally
    
    # If this is the FIRST buildNodeMenuItems (corrupted), skip until the SECOND (clean)
    if len(buildnode_lines) >= 2 and i == buildnode_lines[0]:
        print(f"Skipping corrupted buildNodeMenuItems from line {i} to {buildnode_lines[1]-1}")
        skip_until_line = buildnode_lines[1]
        continue
    
    # If this is a middle handleEditRelationship (corrupted), skip to next
    if len(handleedit_lines) >= 2:
        # Skip the middle instances if they have orphaned code after them
        if i in handleedit_lines[1:-1]:  # Middle instances only
            # Check next 5 lines for orphaned code
            orphaned = False
            for j in range(i, min(i+5, len(lines))):
                if 'nextLaneLoc' in lines[j] or 'lane.location = laneLoc' in lines[j]:
                    orphaned = True
                    break
            
            if orphaned:
                next_idx = handleedit_lines.index(i) + 1
                if next_idx < len(handleedit_lines):
                    print(f"Skipping corrupted handleEditRelationship from line {i} to {handleedit_lines[next_idx]-1}")
                    skip_until_line = handleedit_lines[next_idx]
                    continue
    
    output_lines.append(line)

print(f"\nOutput lines: {len(output_lines)}")
print(f"Removed {len(lines) - len(output_lines)} lines")

print("\nWriting cleaned file...")
with open(output_file, 'w', encoding='utf-8') as f:
    f.writelines(output_lines)

print(f"\nDone! Cleaned file written to: {output_file}")
print("\nTo apply the changes:")
print(f"  1. Review: code {output_file}")
print(f"  2. Apply:  mv {output_file} {input_file}")
print(f"  3. Check:  npm run build or tsc")
