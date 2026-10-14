"""Produce traceable analysis facts from stored MCP evidence; no application code."""
import json
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[3]
P02 = ROOT / 'docs/figma/p02'
RAW = P02 / 'raw'
metadata = json.loads((RAW / 'homepage.metadata.json').read_text())
xml = next(c['text'] for c in metadata['content'] if c.get('text', '').startswith('<section'))
tree = ET.fromstring(xml)
nodes = {n.attrib['id']: n for n in tree.iter()}
independent_path = 'docs/reviews/P-02-independent-figma.json'
independent = json.loads(json.loads((ROOT / independent_path).read_text())['response']['content'][0]['text'])
hierarchy = json.loads(json.loads((RAW / 'hierarchy-styles-variables.json').read_text())['content'][0]['text'])
colors, spacing, radii, styles = [], [], [], []
def occurrence(records, value, source):
    record = next((r for r in records if r['value'] == value), None)
    if record is None:
        record = {'value': value, 'sources': []}
        records.append(record)
    if source not in record['sources']:
        record['sources'].append(source)
for path in sorted(RAW.glob('*.design-context.json')):
    result = json.loads(path.read_text())
    if result.get('isError'):
        continue
    code = result['content'][0]['text']
    path.with_suffix('.txt').write_text('\n\n'.join(c['text'] for c in result['content'] if c['type'] == 'text') + '\n')
    for tag in re.finditer(r'<(?:div|p|span)[^>]+>', code):
        node = re.search(r'data-node-id="([^\"]+)"', tag.group())
        cls = re.search(r'className="([^\"]+)"', tag.group())
        if not node or not cls:
            continue
        source = {'nodeId': node.group(1), 'file': str(path.relative_to(ROOT))}
        classes = cls.group(1)
        for color in re.findall(r'(?:bg|text|border)-\[(#[0-9a-fA-F]{3,8}|rgba\([^\]]+\))\]', classes):
            occurrence(colors, color.upper() if color.startswith('#') else color, source)
        for color, value in [('white', '#FFFFFF'), ('black', '#000000')]:
            if re.search(r'(?:bg|text|border)-' + color + r'(?=\s|$)', classes):
                occurrence(colors, value, source)
        for prop, value in re.findall(r'(?<![a-z-])(gap|gap-x|gap-y|p|px|py|pt|pb|pl|pr)-\[([\d.]+)px\]', classes):
            occurrence(spacing, {'property': prop, 'px': float(value)}, source)
        for value in re.findall(r'rounded-\[([\d.]+)px\]', classes):
            occurrence(radii, float(value), source)
        if any(token in classes for token in ['font-[', 'leading-[', 'text-[', 'tracking-[']):
            styles.append({'nodeId': node.group(1), 'source': str(path.relative_to(ROOT)), 'explicitClassExtraction': classes, 'font': re.findall(r"font-\['([^']+)'\]", classes), 'fontSizePx': re.findall(r'text-\[([\d.]+)px\]', classes), 'lineHeight': re.findall(r'leading-\[([^\]]+)\]', classes), 'letterSpacingPx': re.findall(r'tracking-\[([\d.-]+)px\]', classes), 'note': 'Only explicit generated values; inherit from parent in source. Mixed spans must be read in original context.'})

selected = ['1:266','1:1588','1:271','1:272','1:1589','1:273','1:1590','1:1592','1:1605','1:1606','1:1607','1:1608','1:293','1:294','1:295','1:296','1:1611','1:1612','1:1613','1:1861','1:1915','1:1922','1:305','1:306','1:307','1:324','1:1940','1:1978','1:2022','1:637','1:2044','1:756','1:2066','1:2067','1:2068','1:786','1:2081','1:810','1:2104','1:2105','1:2353','1:2407','1:2422','1:2429','1:1540','1:1541','1:1546','1:1547']
dimensions = []
for node_id in selected:
    n = nodes[node_id]
    dimensions.append({'nodeId': node_id, 'name': n.attrib['name'], 'x': float(n.attrib['x']), 'y': float(n.attrib['y']), 'width': float(n.attrib['width']), 'height': float(n.attrib['height']), 'source': 'docs/figma/p02/raw/homepage.metadata.json', 'coordinates': 'Relative to parent node; not viewport unless the node is the main screen.'})
variants = [{ 'nodeId': n['id'], 'name': n['name'], 'variants': n['children'], 'source': independent_path } for n in independent['nodes'] if n['type'] == 'COMPONENT_SET']
facts = {'fileKey': '0unNm6ej8Ig8v7eN5wUpZK', 'checkedAt': '2026-10-14', 'status': 'Partial: MCP Starter quota prevents mandatory state contexts and renders.', 'localVariables': {'collections': hierarchy['collections'], 'variables': hierarchy['variables'], 'sourceNodeId': '1:266', 'source': 'docs/figma/p02/raw/hierarchy-styles-variables.json', 'note': 'Extracted repeated values below are not Figma variables.'}, 'localStyles': {'textStyles': hierarchy['textStyles'], 'paintStyles': hierarchy['paintStyles'], 'sourceNodeId': '1:266', 'source': 'docs/figma/p02/raw/hierarchy-styles-variables.json'}, 'dimensions': dimensions, 'fonts': [{**f, 'source': independent_path, 'fontFilesAvailable': False, 'licenseAvailable': False} for f in independent['fontPairs']], 'exactTypography': [{**t, 'source': independent_path} for t in independent['typography']], 'generatedExplicitTypography': styles, 'extractedColors': colors, 'extractedSpacing': spacing, 'extractedRadii': radii, 'variants': variants, 'prototype': {'source': independent_path, 'verifiedReactionCount': [{'nodeId': c['id'], 'count': c['reactionCount']} for n in independent['nodes'] for c in n['children']], 'note': 'All inspected direct children reported zero reactions. Descendant reactions and Motion keyframes were not fully inspected due to quota. Zero reactions on roots does not prove absent animations globally.', 'motionInspection': {'source': 'docs/figma/p02/raw/variants-facts.json', 'result': 'Rejected by quota; no duration/easing verified.'}}, 'proposalsNotFigmaFacts': {'heroIntervalMs': 4000, 'heroTransitionMs': 300, 'marquee': 'Continuous CSS track; exact speed/direction unverified.', 'prizeScroll': 'Try local CSS sticky and ascending z-index, verify low viewport and mobile.', 'breakpoints': 'Select based on fitting content; 375/1440 are reference widths, not breakpoint declarations.', 'wideScreen': 'Center bounded content, stretch backgrounds; max-width and 8K appearance need validation.'}}
(P02 / 'design-facts.json').write_text(json.dumps(facts, ensure_ascii=False, indent=2) + '\n')

# Exact crops of downloaded Figma screenshots, never substitutes for unrendered states.
crops = [ ('hero-desktop-question-1-instance-1-1608.png','desktop-1-1588.png',898,240,462,264,'1:1608'), ('hero-mobile-question-1-instance-1-296.png','mobile-1-271.png',19,357,335,246,'1:296'), ('button-desktop-white-default-instance-1-1602.png','desktop-1-1588.png',80,556,284,56,'1:1602'), ('button-mobile-white-default-instance-1-303.png','mobile-1-271.png',16,671,343,48,'1:303'), ('prizes-initial-desktop-1-1611.png','desktop-1-1588.png',0,750,1440,1688,'1:1611') ]
references = []
for out, base, x, y, w, h, node_id in crops:
    run = subprocess.run(['sips', '-c', str(h), str(w), '--cropOffset', str(y), str(x), str(P02 / 'screenshots' / base), '--out', str(P02 / 'screenshots' / out)], capture_output=True, text=True)
    assert run.returncode == 0, run.stderr
    references.append({'file': 'docs/figma/p02/screenshots/' + out, 'sourceScreenshot': 'docs/figma/p02/screenshots/' + base, 'nodeId': node_id, 'crop': {'x': x, 'y': y, 'width': w, 'height': h}, 'kind': 'Lossless spatial crop of original Figma PNG, no generated design.'})
(P02 / 'screenshots/references.json').write_text(json.dumps(references, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'dimensionRecords': len(dimensions), 'typographyRecords': len(styles), 'colors': len(colors), 'spacingValues': len(spacing), 'radii': len(radii), 'crops': len(crops)}))
