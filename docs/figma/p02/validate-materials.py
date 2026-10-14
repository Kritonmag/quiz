"""Validate the P-02 artifact bundle; no application tests or network access."""
import collections
import hashlib
import json
from pathlib import Path
import re
import struct
import xml.etree.ElementTree as ET
import zlib

ROOT = Path(__file__).resolve().parents[3]
P02 = ROOT / 'docs/figma/p02'
errors = []
json_files = list(P02.rglob('*.json'))
for file in json_files:
    try:
        json.loads(file.read_text())
    except (ValueError, UnicodeDecodeError) as error:
        errors.append(f'{file.relative_to(ROOT)}: {error}')

def png_info(data):
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'Bad PNG signature'
    offset, idat, end = 8, [], False
    while offset < len(data):
        size = struct.unpack('>I', data[offset:offset+4])[0]
        kind = data[offset+4:offset+8]
        payload = data[offset+8:offset+8+size]
        crc = struct.unpack('>I', data[offset+8+size:offset+12+size])[0]
        assert zlib.crc32(kind + payload) & 0xffffffff == crc, 'Bad PNG chunk CRC'
        if kind == b'IHDR':
            width, height, depth, color, compression, filtering, interlace = struct.unpack('>IIBBBBB', payload)
        elif kind == b'IDAT':
            idat.append(payload)
        elif kind == b'IEND':
            end = True
        offset += size + 12
    assert end and idat and width and height
    raw = zlib.decompress(b''.join(idat))
    if depth == 8 and not interlace and color in (2, 6):
        assert len(raw) == height * (1 + width * (3 if color == 2 else 4))
    return width, height

manifest = json.loads((P02 / 'assets-manifest.json').read_text())
listed = set()
formats = collections.Counter()
for asset in manifest['assets']:
    file = ROOT / asset['localPath']
    listed.add(file.resolve())
    try:
        data = file.read_bytes()
        assert len(data) > 0
        assert len(data) == asset['sizeBytes']
        assert hashlib.sha256(data).hexdigest() == asset['sha256']
        assert asset['sourceNodeIds'] and asset['usages']
        assert {u['nodeId'] for u in asset['usages']} == set(asset['sourceNodeIds'])
        for use in asset['usages']:
            context = json.loads((ROOT / use['context']).read_text())['content'][0]['text']
            assert f'data-node-id="{use["nodeId"]}"' in context
            assert f'const {use["assetVariable"]} = ' in context
        if asset['format'] == 'png':
            assert png_info(data) == (asset['originalWidth'], asset['originalHeight'])
        elif asset['format'] == 'svg':
            svg = ET.fromstring(data)
            assert svg.tag.rsplit('}', 1)[-1] == 'svg'
            assert svg.get('viewBox') == asset.get('viewBox')
            assert svg.get('width') == asset.get('width')
            assert svg.get('height') == asset.get('height')
        else:
            raise AssertionError('Unexpected format')
        formats[asset['format']] += 1
    except (OSError, AssertionError, ValueError, ET.ParseError, zlib.error) as error:
        errors.append(f'{asset["localPath"]}: {error}')
actual = {p.resolve() for p in (ROOT / 'public/assets/figma').iterdir() if p.is_file()}
if actual != listed:
    errors.append('Manifest/file set mismatch: ' + str(sorted(str(p) for p in actual ^ listed)))
if len({a['sha256'] for a in manifest['assets']}) != len(manifest['assets']):
    errors.append('Duplicate SHA-256 in deduplicated manifest')

references = []
for file in sorted((P02 / 'screenshots').glob('*.png')):
    try:
        width, height = png_info(file.read_bytes())
        references.append({'path': str(file.relative_to(ROOT)), 'width': width, 'height': height})
    except (OSError, AssertionError, ValueError, zlib.error) as error:
        errors.append(f'{file.relative_to(ROOT)}: {error}')

report = (P02 / 'REPORT.md').read_text()
links = re.findall(r'\]\(([^)]+)\)', report)
local_links = [link for link in links if not link.startswith(('https:', 'http:'))]
for link in local_links:
    if link == 'validation.json':
        continue  # This report is created below; its existence is checked after writing.
    if not (P02 / link).exists():
        errors.append('Broken local report link: ' + link)
facts = json.loads((P02 / 'design-facts.json').read_text())
for row in facts['dimensions']:
    assert (ROOT / row['source']).exists()
for font in facts['fonts']:
    assert (ROOT / font['source']).exists()
summary = {'checkedAt': '2026-10-14', 'result': 'passed' if not errors else 'failed', 'errors': errors, 'jsonFilesParsedBeforeThisReport': len(json_files), 'assets': len(listed), 'formats': dict(formats), 'downloadErrors': len(manifest['downloadErrors']), 'unmappedReferences': len(manifest['unmappedReferences']), 'sha256Unique': True, 'manifestMatchesExactAssetFileSet': actual == listed, 'sourceContextNodeIdsAndConstantsChecked': True, 'pngChecks': 'signature, complete chunks, CRC, nonempty IDAT, zlib decode and scanline size where supported', 'svgChecks': 'XML parse, svg root, root dimensions, viewBox', 'references': references, 'localReportLinksChecked': len(local_links), 'applicationChecks': 'Not applicable: no application generated or changed', 'visualInspection': ['desktop/mobile screen PNGs', 'desktop/mobile Question 1 crops', 'desktop/mobile White Default button crops', 'signalist source PNG', 'train source PNG', 'electromechanic source PNG'], 'limitations': ['No independent visual render of every SVG', 'Missing mandatory Figma contexts/renders/prototype inspection listed in REPORT Q-01 to Q-09', 'Validation pass means internal integrity of available files, not complete P-02 acceptance']}
(P02 / 'validation.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
assert (P02 / 'validation.json').is_file()
print(json.dumps({k: summary[k] for k in ['result','errors','assets','formats','localReportLinksChecked']}, ensure_ascii=False))
raise SystemExit(0 if not errors else 1)
