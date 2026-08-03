import os
import re

controllers_dir = r'd:\matts\Backend\Controllers'
dtos_dir = r'd:\matts\Backend\DTOs'

# Ensure DTO dir exists
os.makedirs(dtos_dir, exist_ok=True)

class_pattern = re.compile(r'public\s+class\s+([A-Za-z0-9_]+)\s*\{', re.DOTALL)

for filename in os.listdir(controllers_dir):
    if not filename.endswith('Controller.cs'): continue
    
    path = os.path.join(controllers_dir, filename)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to extract the entire class body
    # This is slightly tricky, we need to balance braces.
    
    matches = list(class_pattern.finditer(content))
    if not matches:
        continue
        
    new_content = content
    offset = 0
    
    for match in matches:
        class_name = match.group(1)
        if not class_name.endswith('Dto') and not class_name.endswith('Request'): 
            continue # Only move DTOs and Requests
            
        start_idx = match.start() - offset
        
        # Find matching closing brace
        brace_count = 0
        end_idx = start_idx
        # advance to first brace
        for i in range(start_idx, len(new_content)):
            if new_content[i] == '{': 
                brace_count += 1
                if brace_count == 1:
                    first_brace = i
            elif new_content[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i
                    break
                    
        class_body = new_content[start_idx:end_idx+1]
        
        # Write to DTOs folder
        dto_content = f"""using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System;

namespace Backend.DTOs
{{
    {class_body}
}}
"""
        with open(os.path.join(dtos_dir, f'{class_name}.cs'), 'w', encoding='utf-8') as f:
            f.write(dto_content)
            
        # Remove from controller
        new_content = new_content[:start_idx] + new_content[end_idx+1:]
        
    if new_content != content:
        # Add using Backend.DTOs if not present
        if 'using Backend.DTOs;' not in new_content:
            new_content = 'using Backend.DTOs;\n' + new_content
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)

print("Moved all inline DTOs to Backend/DTOs folder.")
