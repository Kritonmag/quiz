"""Read-only evidence validation for P-02; no application tests or dependencies."""
from pathlib import Path
from collections import Counter
import hashlib, json, re, struct, xml.etree.ElementTree as ET
ROOT = Path(__file__).resolve().parents[2]
manifest = json.loads((ROOT / 'docs/figma/p02/assets-manifest.json').read_text())
errors, binding_gaps, context_cache = [], [], {}
rows = manifest['assets']
formats = Counter()
mapped_paths = set()
uses = 0
for row in rows:
    rel = row['localPath']
    path = ROOT / rel
    if not path.resolve().is_relative_to(ROOT / 'public/assets/figma'):
        errors.append(f'Out-of-scope asset path: {rel}')
        continue
    mapped_paths.add(rel)
    if not path.is_file():
        errors.append(f'Missing file: {rel}')
        continue
    raw = path.read_bytes()
    if not raw or len(raw) != row['sizeBytes']:
        errors.append(f'Wrong byte count: {rel}')
    if hashlib.sha256(raw).hexdigest() != row['sha256']:
        errors.append(f'SHA256 mismatch: {rel}')
    try:
        if row['format'] == 'svg':
            svg = ET.fromstring(raw)
            assert svg.tag.split('}')[-1] == 'svg'
            assert svg.attrib.get('width') == row['width']
            assert svg.attrib.get('height') == row['height']
            assert svg.attrib.get('viewBox') == row['viewBox']
        elif row['format'] == 'png':
            assert raw[:8] == b'\x89PNG\r\n\x1a\n'
            width, height = struct.unpack('>II', raw[16:24])
            assert width > 0 and height > 0
            assert width == row['originalWidth'] and height == row['originalHeight']
        else:
            raise ValueError('Unexpected asset format ' + row['format'])
        formats[row['format']] += 1
    except Exception as exc:
        errors.append(f'Format/geometry error: {rel}: {type(exc).__name__}')
    if not row.get('sourceNodeIds') or not row.get('usages'):
        errors.append(f'Missing node provenance: {rel}')
    for usage in row.get('usages', []):
        uses += 1
        source_path = usage['context']
        if source_path not in context_cache:
            response = json.loads((ROOT / source_path).read_text())
            if response.get('isError'):
                errors.append(f'Usage points to failed context: {source_path}')
            context_cache[source_path] = '\n'.join(c.get('text', '') for c in response.get('content', []) if c.get('type') == 'text')
        text = context_cache[source_path]
        node, variable = usage['nodeId'], usage['assetVariable']
        if node not in row['sourceNodeIds']:
            errors.append(f'Usage node omitted from sourceNodeIds: {rel}: {node}')
        marker = f'data-node-id="{node}"'
        if marker not in text or not re.search(r'const\s+' + re.escape(variable) + r'\s*=', text):
            errors.append(f'Node/variable absent in source: {rel}: {node} / {variable}')
        windows = []
        for match in re.finditer(re.escape(marker), text):
            next_node = text.find('data-node-id=', match.end())
            windows.append(text[match.start():next_node if next_node >= 0 else len(text)])
        if not any(re.search(r'src=\{\s*' + re.escape(variable) + r'\s*\}', window) for window in windows):
            binding_gaps.append({'path': rel, 'nodeId': node, 'variable': variable, 'context': source_path})
actual = {str(p.relative_to(ROOT)) for p in (ROOT / 'public/assets/figma').rglob('*') if p.is_file()}
if actual != mapped_paths:
    errors.append(f'Files/manifest differ: unlisted={sorted(actual-mapped_paths)}, missing={sorted(mapped_paths-actual)}')
if manifest.get('downloadErrors') or manifest.get('unmappedReferences'):
    errors.append('Manifest reports download errors or unmapped references')
expected_declarations = set()
for source_path, text in context_cache.items():
    for variable in re.findall(r'const\s+(\w+)\s*=\s*"https://www\.figma\.com/api/mcp/asset/[^"\s]+"', text):
        expected_declarations.add((source_path, variable))
actual_declarations = {(u['context'], u['assetVariable']) for a in rows for u in a['usages']}
if expected_declarations != actual_declarations:
    errors.append('Declared resources differ from manifest provenance')
facts = json.loads((ROOT / 'docs/figma/p02/design-facts.json').read_text())
independent = json.loads(json.loads((ROOT / 'docs/reviews/P-02-independent-figma.json').read_text())['response']['content'][0]['text'])
if {(f['family'], f['style']) for f in facts['fonts']} != {(f['family'], f['style']) for f in independent['fontPairs']}:
    errors.append('Font inventory differs from independent MCP query')
for node_id in ('1:1588', '1:271', '1:2104'):
    fact = next(n for n in facts['dimensions'] if n['nodeId'] == node_id)
    check = next(n for n in independent['nodes'] if n['id'] == node_id)
    if (fact['width'], fact['height']) != (check['width'], check['height']):
        errors.append('Screen geometry mismatch: ' + node_id)
if facts['exactTypography'] != [dict(t, source='docs/reviews/P-02-independent-figma.json') for t in independent['typography']]:
    errors.append('Exact typography differs from independent MCP query')
for entry in facts['variants']:
    check = next(n for n in independent['nodes'] if n['id'] == entry['nodeId'])
    if entry['variants'] != check['children']:
        errors.append('Variant inventory differs from independent MCP query: ' + entry['nodeId'])
screenshots = list((ROOT / 'docs/figma/p02/screenshots').glob('*.png'))
dimensions = {}
for path in screenshots:
    raw = path.read_bytes()
    if raw[:8] != b'\x89PNG\r\n\x1a\n':
        errors.append('Reference is not PNG: ' + path.name)
        continue
    dimensions[str(path.relative_to(ROOT))] = struct.unpack('>II', raw[16:24])
references = json.loads((ROOT / 'docs/figma/p02/screenshots/references.json').read_text())
for reference in references:
    crop = reference['crop']
    if dimensions.get(reference['file']) != (crop['width'], crop['height']):
        errors.append('Reference crop geometry mismatch: ' + reference['file'])
    source_width, source_height = dimensions[reference['sourceScreenshot']]
    if crop['x'] < 0 or crop['y'] < 0 or crop['x'] + crop['width'] > source_width or crop['y'] + crop['height'] > source_height:
        errors.append('Crop lies outside original reference: ' + reference['file'])
json_files = list((ROOT / 'docs/figma/p02').rglob('*.json')) + [p for p in (ROOT / 'docs/reviews').glob('*.json') if p.name != 'P-02-validation.json']
for path in json_files:
    try: json.loads(path.read_text())
    except Exception: errors.append('Invalid JSON: ' + str(path.relative_to(ROOT)))
assert not (ROOT / 'package.json').exists()
assert not (ROOT / 'src').exists()
assert not (ROOT / 'public/mocks').exists()
print(json.dumps({
    'assetCount': len(rows), 'formats': dict(formats), 'usageCount': uses,
    'contextCount': len(context_cache), 'jsonFilesChecked': len(json_files),
    'declaredResourcesChecked': len(expected_declarations),
    'fontStylePairsChecked': len(facts['fonts']),
    'exactTypographySamplesChecked': len(facts['exactTypography']),
    'referencePngFilesChecked': len(screenshots),
    'errors': errors, 'bindingGaps': binding_gaps,
    'scope': 'P-02 only; no package.json/src/public-mocks',
    'appTestsRun': False
}, ensure_ascii=False, indent=2))
raise SystemExit(1 if errors or binding_gaps else 0)
