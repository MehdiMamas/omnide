# v5 vs v4 diff check: python3 v5-diffcheck.py
import json, re, difflib, os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'project') + '/'
applied = json.load(open(os.path.join(P, '..', 'v5-applied.json')))
META = {'Main', 'Progress', 'History', 'SettingsInventory'}
AGENT = {'agent-Component', 'agent-Mapping', 'agent-Sequence', 'agent-Registry', 'agent-States'}
def v4orig(stem):
    s = open(P + f'v4-{stem}.dc.html').read()
    s = re.sub(r'<a href="v5-Main\.dc\.html" style="position:absolute;right:8px;top:8px;z-index:99999[^>]*>Superseded by v5</a>', '', s)
    s = s.replace('<div data-superseded-by="v5" data-page="v4"', '<div data-page="v4"')
    s = re.sub(r'data-status="superseded" data-was="([a-z-]+)"', r'data-status="\1"', s)
    return re.sub(r'\bv4-', 'v5-', s).replace('data-page="v4"', 'data-page="v5"')
res = {'identical': 0, 'chip-only': 0, 'edited': [], 'meta': [], 'fail': []}
for stem, log in applied.items():
    a, b = v4orig(stem), open(P + f'v5-{stem}.dc.html').read()
    if stem in META or stem in AGENT: res['meta'].append(stem); continue
    if a == b: res['identical'] += 1; continue
    if 'row' not in log:
        # chip-only: v5 must equal v4 minus the chip <li> and the chip hotspot link, nothing else
        t = re.sub(r'<li class="action-item" role="presentation" tabindex="0"><div style="height: 100%; width: 100%;"><div class="titlebar-text-link omn-claude-chip".*?</div></div></li>', '', a, flags=re.S)
        t = re.sub(r'<a href="v5-set-claude-1\.dc\.html" aria-label="Open Claude usage on claude\.ai"[^>]*></a>\n?', '', t)
        norm = lambda x: re.sub(r'\s+', '', x)
        if norm(t) == norm(b): res['chip-only'] += 1
        else: res['fail'].append((stem, ['differs beyond chip', log]))
    elif 'row' in log: res['edited'].append(stem)
    else: res['fail'].append((stem, ['unexpected change', log]))
print(json.dumps({k: (v if not isinstance(v, list) else v) for k, v in res.items()}, indent=1))
