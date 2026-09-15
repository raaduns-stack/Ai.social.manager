#!/usr/bin/env python3
"""
Resolve merge conflicts in 0020_snapshot.json.
Both branches add different tables - we need to keep all of them.
The conflicts are interleaved because both branches modified the same migration file.
"""

import re

filepath = r"C:\Users\Hp EliteBook 840 G6\Documents\WORKS\Ai.social.manager\apps\backend\src\database\migrations\meta\0020_snapshot.json"

with open(filepath, 'r') as f:
    content = f.read()

# Remove all conflict markers and keep BOTH versions
# Strategy: For each conflict block, output HEAD content then incoming content

def resolve_conflicts(text):
    lines = text.split('\n')
    result = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.strip() == '<<<<<<< HEAD':
            head_lines = []
            i += 1
            while i < len(lines) and lines[i].strip() != '=======':
                head_lines.append(lines[i])
                i += 1
            i += 1  # skip =======
            
            incoming_lines = []
            while i < len(lines) and not lines[i].strip().startswith('>>>>>>> '):
                incoming_lines.append(lines[i])
                i += 1
            i += 1  # skip >>>>>>>
            
            # Keep both versions
            result.extend(head_lines)
            result.extend(incoming_lines)
        else:
            result.append(line)
            i += 1
    return '\n'.join(result)

resolved = resolve_conflicts(content)

with open(filepath, 'w') as f:
    f.write(resolved)

print("Resolved conflicts by keeping both versions")

# Verify no conflict markers remain
with open(filepath, 'r') as f:
    check = f.read()
    for marker in ['<<<<<<<', '=======', '>>>>>>>']:
        count = check.count(marker)
        if count > 0:
            print(f"WARNING: {count} '{marker}' markers remain!")
        else:
            print(f"OK: no '{marker}' markers")