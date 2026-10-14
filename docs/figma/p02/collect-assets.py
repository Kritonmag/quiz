"""Download the exact temporary asset URLs returned by stored Figma contexts.
Run from repository root. Requires only Python standard library and curl.
No Figma writes and no application generation.
"""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import struct
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/assets/figma'
RAW = ROOT / 'docs/figma/p02/raw'
metadata = json.loads((RAW / 'homepage.metadata.json').read_text())
xml = next(c['text'] for c in metadata['content'] if c.get('text', '').startswith('<section'))
tree = ET.fromstring(xml)
names = {n.attrib['id']: n.attrib['name'] for n in tree.iter()}
section_ids = {'1:1589': 'hero', '1:273': 'hero', '1:1611': 'prizes', '1:305': 'prizes', '1:1940': 'leaderboard', '1:637': 'leaderboard', '1:2044': 'mechanics', '1:756': 'mechanics', '1:2067': 'final-cta', '1:786': 'final-cta', '1:2081': 'footer', '1:810': 'footer', '1:2104': 'final-scroll'}
categories = {}
def categorize(n, category='shared'):
    category = section_ids.get(n.attrib['id'], category)
    categories[n.attrib['id']] = category
    for child in n:
        categorize(child, category)
categorize(tree)
requests = []
unmapped = []
for file in sorted(RAW.glob('*.design-context.json')):
    result = json.loads(file.read_text())
    if result.get('isError'):
        continue
    code = result['content'][0]['text']
    constants = dict(re.findall(r'const (\w+) = "(https://[^\"]+)";', code))
    uses = {var: [] for var in constants}
    stack = []
    for match in re.finditer(r'<(/?)([A-Za-z][A-Za-z0-9]*)([^>]*?)>', code):
        closing, tag, attrs = match.groups()
        if closing:
            if stack:
                stack.pop()
            continue
        node = re.search(r'data-node-id="([^\"]+)"', attrs)
        node_id = node.group(1) if node else (stack[-1] if stack else None)
        source = re.search(r'src=\{(\w+)\}', attrs)
        if source and source.group(1) in uses:
            uses[source.group(1)].append({'nodeId': node_id, 'context': str(file.relative_to(ROOT)), 'variable': source.group(1)})
        if not attrs.rstrip().endswith('/') and tag.lower() not in ('img', 'br', 'input', 'hr'):
            stack.append(node_id)
    for var, url in constants.items():
        if not uses[var] or any(u['nodeId'] is None for u in uses[var]):
            unmapped.append({'context': file.name, 'variable': var, 'url': url})
            continue
        source_id = uses[var][0]['nodeId']
        category = categories.get(source_id, categories.get(source_id.split(';')[0].removeprefix('I'), 'shared'))
        var_slug = re.sub(r'(?<=[a-z0-9])([A-Z])', r'-\1', var.removeprefix('img')).lower()
        extension = url.rsplit('.', 1)[-1]
        name = f'{category}-{var_slug}-{source_id.replace(":", "-").replace(";", "-")}.{extension}'
        requests.append({'url': url, 'filename': name, 'uses': uses[var]})
(RAW / 'asset-download-plan.json').write_text(json.dumps({'requests': requests, 'unmapped': unmapped}, ensure_ascii=False, indent=2) + '\n')

def download(request):
    file = OUT / request['filename']
    if not file.exists() or not file.stat().st_size:
        run = subprocess.run(['curl', '-fsSL', '--retry', '2', '--max-time', '45', '-o', str(file), request['url']], capture_output=True, text=True)
        if run.returncode:
            return {'error': run.stderr.strip(), 'filename': request['filename']}
    data = file.read_bytes()
    info = {'sizeBytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    if data.startswith(b'\x89PNG\r\n\x1a\n'):
        info.update(format='png', type='raw-image', originalWidth=struct.unpack('>I', data[16:20])[0], originalHeight=struct.unpack('>I', data[20:24])[0])
    elif data.startswith(b'\xff\xd8\xff'):
        info.update(format='jpeg', type='raw-image')
    else:
        try:
            svg = ET.fromstring(data)
            assert svg.tag.rsplit('}', 1)[-1] == 'svg'
            info.update(format='svg', type='svg', width=svg.get('width'), height=svg.get('height'), viewBox=svg.get('viewBox'))
        except (ET.ParseError, AssertionError):
            return {'error': 'Not a supported PNG/JPEG/SVG binary', 'filename': request['filename']}
    return {'file': str(file), 'request': request, 'info': info}

results = []
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    for index, result in enumerate(pool.map(download, requests), 1):
        results.append(result)
        if index % 25 == 0:
            print(f'{index}/{len(requests)} downloaded', flush=True)

assets = {}
errors = []
for result in results:
    if 'error' in result:
        errors.append(result)
        continue
    request, info, file = result['request'], result['info'], Path(result['file'])
    digest = info['sha256']
    if digest not in assets:
        assets[digest] = {'localPath': str(file.relative_to(ROOT)), **info, 'sourceNodeIds': [], 'usages': []}
    else:
        # Dedup only files generated by this collector, after content equality is proven.
        existing = ROOT / assets[digest]['localPath']
        if file != existing:
            assert file.read_bytes() == existing.read_bytes()
            file.unlink()
    record = assets[digest]
    for use in request['uses']:
        node = use['nodeId']
        if node not in record['sourceNodeIds']:
            record['sourceNodeIds'].append(node)
        base_node = node.split(';')[0].removeprefix('I')
        usage = {'nodeId': node, 'nodeName': names.get(node, names.get(base_node)), 'slot': categories.get(node, categories.get(base_node, 'shared')), 'context': use['context'], 'assetVariable': use['variable']}
        if usage not in record['usages']:
            record['usages'].append(usage)
manifest = {'fileKey': '0unNm6ej8Ig8v7eN5wUpZK', 'source': 'Exact URL constants and nearest data-node-id ancestors in stored high-fidelity get_design_context responses; SVG files are supplied exports, raster files are supplied source images.', 'assets': list(assets.values()), 'downloadErrors': errors, 'unmappedReferences': unmapped}
(ROOT / 'docs/figma/p02/assets-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'downloadRequests': len(requests), 'uniqueAssets': len(assets), 'errors': len(errors), 'unmapped': len(unmapped)}, ensure_ascii=False), flush=True)
