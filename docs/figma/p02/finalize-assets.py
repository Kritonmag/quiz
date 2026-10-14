"""Add human-readable slots and filenames without changing downloaded bytes."""
import json
from pathlib import Path
import xml.etree.ElementTree as ET
ROOT = Path(__file__).resolve().parents[3]
path = ROOT / 'docs/figma/p02/assets-manifest.json'
manifest = json.loads(path.read_text())
xml = next(c['text'] for c in json.loads((ROOT / 'docs/figma/p02/raw/homepage.metadata.json').read_text())['content'] if c.get('text', '').startswith('<section'))
tree = ET.fromstring(xml)
section_ids = {'1:1589':'hero','1:273':'hero','1:1611':'prizes','1:305':'prizes','1:1940':'leaderboard','1:637':'leaderboard','1:2044':'mechanics','1:756':'mechanics','1:2067':'final-cta','1:786':'final-cta','1:2081':'footer','1:810':'footer','1:2104':'final-scroll'}
categories, names = {}, {}
def walk(node, category='shared'):
    category = section_ids.get(node.attrib['id'], category)
    categories[node.attrib['id']] = category
    names[node.attrib['id']] = node.attrib['name']
    for child in node:
        walk(child, category)
walk(tree)
for asset in manifest['assets']:
    for use in asset['usages']:
        base = use['nodeId'].split(';')[0].removeprefix('I')
        use['slot'] = categories.get(base, 'shared')
        use['nodeName'] = names.get(use['nodeId'], names.get(base))
    asset['purpose'] = ', '.join(sorted({u['slot'] for u in asset['usages']}))
    if asset['type'] == 'raw-image':
        first = asset['sourceNodeIds'][0].replace(':','-').replace(';','-')
        var = asset['usages'][0]['assetVariable']
        if var == 'imgRzdLogo1': label = 'brand-rzd-logo'
        elif var == 'img0052': label = 'hero-signalist-cutout'
        elif var == 'imgImage634450437': label = 'prizes-train-landscape'
        elif var == 'img202500041': label = 'final-cta-electromechanic-cutout'
        else: label = 'leaderboard-avatar'
        old = ROOT / asset['localPath']
        new = old.with_name(f'{label}-{first}.{asset["format"]}')
        if old != new:
            assert not new.exists(), new
            old.rename(new)
            asset['localPath'] = str(new.relative_to(ROOT))
path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(f'Finalized {len(manifest["assets"])} asset entries')
