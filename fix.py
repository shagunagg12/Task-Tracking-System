import os
import re

src_dir = r'd:\matts\Frontend\src'

for root, _, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.jsx'):
            file_path = os.path.join(root, f)
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            original_content = content
            
            # Using Regex to only match exact matches of the URL that are not already part of our import.meta.env string
            
            # 1. Match 'http://localhost:5024/api' or "http://localhost:5024/api"
            content = re.sub(r"['\"]http://localhost:5024/api['\"]", r"(import.meta.env.VITE_API_URL || 'http://localhost:5024/api')", content)
            
            # 2. Match http://localhost:5024/api NOT preceded by quote and NOT preceded by '
            content = re.sub(r"(?<!['\"])http://localhost:5024/api", r"${import.meta.env.VITE_API_URL || 'http://localhost:5024/api'}", content)
            
            # 3. Match 'http://localhost:5024' (for signalR)
            content = re.sub(r"['\"]http://localhost:5024['\"]", r"(import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5024')", content)
            
            # 4. Match http://localhost:5024 not followed by /api
            content = re.sub(r"(?<!['\"])http://localhost:5024(?!/api)", r"${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5024'}", content)
            
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as file:
                    file.write(content)
                print(f'Updated {f}')
