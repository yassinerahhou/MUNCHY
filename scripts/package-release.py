"""Build a source ZIP for Hostinger managed Node.js; excludes private local data."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

root = Path(__file__).resolve().parent.parent
release = root / 'releases'
release.mkdir(exist_ok=True)
files = []
for folder in ['app', 'components', 'lib', 'locales', 'public', 'db', 'docs', 'tests']:
    files.extend(p for p in (root / folder).rglob('*') if p.is_file())
for name in ['package.json', 'package-lock.json', 'next.config.mjs', 'next-env.d.ts', 'tsconfig.json', 'tailwind.config.ts', 'postcss.config.mjs', '.env.example', 'START-HERE.md', 'README.md', 'scripts/check-deploy.mjs', 'scripts/package-release.py']:
    p = root / name
    if p.is_file():
        files.append(p)
    else:
        raise RuntimeError(f'Required release file missing: {name}')
entries = sorted(set(files))
archive = release / 'munchy-hostinger-node.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED, compresslevel=9) as z:
    for p in entries:
        name = p.relative_to(root).as_posix()
        if any(part in {'.git', 'node_modules', '.next', '.data', '__pycache__'} for part in p.relative_to(root).parts):
            raise RuntimeError(f'Private path in release: {name}')
        if p.name.startswith('.env') and p.name != '.env.example':
            raise RuntimeError('Secret environment file in release')
        if name == 'next-env.d.ts':
            z.writestr(name, '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n')
        else:
            z.write(p, name)
with ZipFile(archive) as z:
    assert z.testzip() is None, 'ZIP integrity check failed'
    assert 'package.json' in z.namelist(), 'Root package.json missing'
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(release / 'SHA256SUMS.txt').write_text(f'{digest}  {archive.name}\n', encoding='utf-8')
(release / 'release-manifest.json').write_text(json.dumps({'archive': archive.name, 'sha256': digest, 'bytes': archive.stat().st_size, 'files': [p.relative_to(root).as_posix() for p in entries]}, indent=2), encoding='utf-8')
print(f'PASS {archive.name}: {len(entries)} files, {archive.stat().st_size:,} bytes; ZIP CRC verified')
