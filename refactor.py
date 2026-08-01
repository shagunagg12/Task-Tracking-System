import os
import re

controllers_dir = r'd:\matts\Backend\Controllers'
services_dir = r'd:\matts\Backend\Services'
interfaces_dir = r'd:\matts\Backend\Interfaces'

def extract_methods(content):
    # Regex to find HTTP endpoint methods (e.g., [HttpGet("...")] public async Task<IActionResult> MethodName(...)
    pattern = re.compile(
        r'(\[Http(?:Get|Post|Put|Delete|Patch)[^\]]*\]\s*)+'
        r'(?:\[[^\]]+\]\s*)*' # Any other attributes like [AllowAnonymous]
        r'public\s+(?:async\s+)?(?:Task<IActionResult>|IActionResult|Task<ActionResult[^>]*>|ActionResult[^>]*>)\s+'
        r'([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{',
        re.DOTALL
    )
    
    matches = []
    for match in pattern.finditer(content):
        # find matching closing brace
        start_idx = match.end() - 1 # The opening brace
        brace_count = 0
        end_idx = start_idx
        for i in range(start_idx, len(content)):
            if content[i] == '{': brace_count += 1
            elif content[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i
                    break
        
        matches.append({
            'full_match': match.group(0),
            'attributes': match.group(1),
            'method_name': match.group(2),
            'params_str': match.group(3),
            'body': content[start_idx+1:end_idx].strip(),
            'start': match.start(),
            'end': end_idx + 1
        })
    return matches

for filename in os.listdir(controllers_dir):
    if filename.endswith('Controller.cs') and filename != 'UsersController.cs':
        path = os.path.join(controllers_dir, filename)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        methods = extract_methods(content)
        if not methods:
            continue
            
        base_name = filename.replace('Controller.cs', '')
        interface_name = f'I{base_name}Service'
        service_name = f'{base_name}Service'
        
        # Build Interface
        interface_methods = []
        for m in methods:
            # Clean params for interface (remove attributes like [FromBody])
            clean_params = re.sub(r'\[[^\]]+\]\s*', '', m['params_str']).strip()
            # If the controller method uses 'User.FindFirst', it needs 'ClaimsPrincipal user'
            if 'User.FindFirst' in m['body'] or 'User.Identity' in m['body']:
                if clean_params:
                    clean_params = 'System.Security.Claims.ClaimsPrincipal user, ' + clean_params
                else:
                    clean_params = 'System.Security.Claims.ClaimsPrincipal user'
            
            interface_methods.append(f"Task<object> {m['method_name']}Async({clean_params});")
            
        interface_content = f"""using System.Threading.Tasks;
using System.Collections.Generic;

namespace Backend.Interfaces
{{
    public interface {interface_name}
    {{
        {chr(10).join(interface_methods)}
    }}
}}
"""
        with open(os.path.join(interfaces_dir, f'{interface_name}.cs'), 'w', encoding='utf-8') as f:
            f.write(interface_content)
            
        # Build Service
        service_methods = []
        for m in methods:
            clean_params = re.sub(r'\[[^\]]+\]\s*', '', m['params_str']).strip()
            if 'User.FindFirst' in m['body'] or 'User.Identity' in m['body']:
                if clean_params:
                    clean_params = 'System.Security.Claims.ClaimsPrincipal user, ' + clean_params
                else:
                    clean_params = 'System.Security.Claims.ClaimsPrincipal user'
                    
            # Transform body
            body = m['body']
            # Replace Return Ok(obj) with return obj
            body = re.sub(r'return\s+Ok\(([^)]*)\)\s*;', r'return \1;', body)
            # Replace return Unauthorized() with throw exception or return null
            body = re.sub(r'return\s+Unauthorized\([^)]*\)\s*;', r'return null; // TODO: handle unauthorized', body)
            body = re.sub(r'return\s+NotFound\([^)]*\)\s*;', r'return null; // TODO: handle not found', body)
            body = re.sub(r'return\s+BadRequest\(([^)]*)\)\s*;', r'return \1; // TODO: handle bad request', body)
            
            # Note: This is an extremely naive AST replacement that will likely require manual fix-up.
            
            service_methods.append(f"""
        public async Task<object> {m['method_name']}Async({clean_params})
        {{
            {body}
        }}
""")

        service_content = f"""using Backend.Interfaces;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace Backend.Services
{{
    public class {service_name} : {interface_name}
    {{
        private readonly ApplicationDbContext _context;
        public {service_name}(ApplicationDbContext context)
        {{
            _context = context;
        }}
        {''.join(service_methods)}
    }}
}}
"""
        with open(os.path.join(services_dir, f'{service_name}.cs'), 'w', encoding='utf-8') as f:
            f.write(service_content)

print("Generated crude service layers for all controllers.")
