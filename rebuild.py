#!/usr/bin/env python3
"""Rebuild de RR Headliners tracker index.html uit snapshots.json.
Usage: python3 rebuild.py <output_html_path>
Leest (zelfde map): snapshots.json, handles.txt, template.html."""
import json,re,sys,os
D=os.path.dirname(os.path.abspath(__file__))
OUT=sys.argv[1] if len(sys.argv)>1 else os.path.join(D,"index_rebuilt.html")
snaps=sorted(json.load(open(os.path.join(D,"snapshots.json"))),key=lambda s:s["date"])
handles=[l.strip() for l in open(os.path.join(D,"handles.txt")) if l.strip()]
def disp(h):
    suf={'official','officiall','music','techno','hardtechno','dj','live'}
    parts=[p for p in h.replace('.',' ').replace('_',' ').split(' ') if p]
    parts=[p for p in parts if p.lower() not in suf] or parts
    return ' '.join(w.capitalize() for w in parts)
def js(s): return json.dumps(s,ensure_ascii=False)
def clean(c):
    c=(c or '').strip(); c=re.sub(r'[\"”]+\s*\.?\s*$','',c); return re.sub(r'\s+',' ',c).strip()
def rec(snap,h): return snap["data"].get(h) or {}
def fof(snap,h): return (rec(snap,h).get("f")) or 0
def nameof(h):
    for s in snaps:
        n=(rec(s,h).get("name") or "").strip()
        if n: return n
    return disp(h)
weeks=[]
for i,snap in enumerate(snaps):
    accs=[]
    for h in handles:
        r=rec(snap,h); f=r.get("f") or 0
        base=fof(snaps[0],h) or f
        prev=fof(snaps[i-1],h) if i>0 else None
        accs.append((h,f,base,prev,snap["date"],r.get("posts",[])))
    weeks.append((snap["week"],snap["date"],accs))
weeks=list(reversed(weeks))
L=["window.SEED_DATA = {","  history: ["]
for wi,(week,date,accs) in enumerate(weeks):
    L+=["    {",f"      week: {js(week)},",f"      date: {js(date)},","      accounts: ["]
    for ai,(h,f,base,prev,lu,posts) in enumerate(accs):
        c="," if ai<len(accs)-1 else ""
        L+=["        {",f"          username: {js(h)},",f"          name: {js(nameof(h))},",
            f"          followers: {f},",f"          baseline_followers: {base if base else 'null'},",
            f"          prev_followers: {prev if prev is not None else 'null'},",
            f"          last_updated: {js(lu)},"]
        if posts:
            L.append("          posts: [")
            for pi,p in enumerate(posts):
                pc="," if pi<len(posts)-1 else ""
                L.append(f"            {{ date: {js(p.get('date',''))}, caption: {js(clean(p.get('cap','')))}, likes: {p.get('likes',0)}, comments: {p.get('comments',0)}, type: {js(p.get('type','normal'))} }}{pc}")
            L.append("          ]")
        else:
            L.append("          posts: []")
        L.append("        }"+c)
    L+=["      ]","    }"+("," if wi<len(weeks)-1 else "")]
L+=["  ]","};"]
seed="\n".join(L)
tpl=open(os.path.join(D,"template.html")).read()
start=tpl.index("window.SEED_DATA"); marker=tpl.index("// ─── STATE",start); end=tpl.rindex("};",start,marker)+2
open(OUT,"w").write(tpl[:start]+seed+tpl[end:])
print("wrote",OUT,"| weeks:",len(weeks),"| accounts/week:",len(handles))
