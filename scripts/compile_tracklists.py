#!/usr/bin/env python3
"""Compile every Midnight Radio tracklist into one markdown file."""
import re, html, time, urllib.request, sys

BASE = "https://www.jamesreeves.co"
UA = {"User-Agent": "Mozilla/5.0 (tracklist-compiler; james's own site)"}

def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8")

def clean(text):
    text = re.sub(r"<a\b[^>]*>.*?</a>", "", text, flags=re.S)   # links out first
    text = re.sub(r"<[^>]+>", "", text)                          # remaining tags
    text = html.unescape(text).replace("\xa0", " ")
    return re.sub(r"\s+", " ", text).strip()

# ---- 1. Episode list from the /radio/ dial (newest first) ----
radio = fetch(BASE + "/radio/")
dial = re.search(r'id="dialList".*?</div>', radio, re.S).group(0)
eps = []
for m in re.finditer(r'<a href="([^"]+)" data-slug="([^"]+)">(.*?)</a>', dial, re.S):
    url, slug, inner = m.groups()
    if url.startswith("/"):
        url = BASE + url
    ep_m = re.search(r'data-ep="hash-mr-([0-9a-z]+)"', inner)
    num = ep_m.group(1).upper() if ep_m else "?"
    title = clean(inner)
    eps.append({"num": num, "slug": slug, "url": url, "title": title})
eps.reverse()  # oldest first
print(f"episodes found: {len(eps)}", file=sys.stderr)

# ---- 2. Fetch each episode, parse date + first <ol> ----
total_tracks = 0
for ep in eps:
    page = fetch(ep["url"])
    d = re.search(r'property="article:published_time" content="([\d-]+)', page)
    ep["date"] = d.group(1) if d else ""
    desc = re.search(r'name="description" content="([^"]*)"', page)
    ep["desc"] = html.unescape(desc.group(1)) if desc else ""
    # Tracklists span four eras of formatting:
    #   A. list items with <strong>Artist - Title</strong><br>details
    #   B. plain list items: Artist - Title<br>(details)
    #   C. no list at all: <p><strong>Artist - Title</strong><br><em>details</em><br>commentary
    # Always scoped to the post content — matching the whole page lets
    # unrelated markup swallow the list.
    body_m = re.search(r'class="post-content">(.*?)<div class="post-meta"', page, re.S)
    body = body_m.group(1) if body_m else page

    def norm_detail(raw):
        d = clean(raw).strip("()")
        parts = [p.strip(" ,()") for p in re.split(r"[•|]", d)]
        return " • ".join(p for p in parts if p)

    tracks = []
    for lst in re.finditer(r"<(ol|ul)[^>]*>(.*?)</\1>", body, re.S):
        lis = re.findall(r"<li>(.*?)</li>", lst.group(2), re.S)
        cand = []
        for li in lis:
            strong = re.search(r"<strong>(.*?)</strong>", li, re.S)
            if strong:   # era A (skip strong-less quote/aside items)
                head = clean(strong.group(1))
                rest = re.sub(r"^\s*<br\s*/?>", "", li[strong.end():])
                cand.append((head, norm_detail(rest)))
        if not cand:     # era B: plain lis, Artist - Title before the <br>
            plain = []
            for li in lis:
                bits = re.split(r"<br\s*/?>", li, maxsplit=1)
                head = clean(bits[0])
                if " - " not in head and " – " not in head:
                    break   # not a tracklist-shaped list
                plain.append((head, norm_detail(bits[1]) if len(bits) > 1 else ""))
            if len(plain) == len(lis) and plain:
                cand = plain
        if cand:
            tracks = cand
            break
    if not tracks:       # era C: paragraph tracklist
        for m2 in re.finditer(r"<p><strong>(.*?)</strong>(.*?)</p>", body, re.S):
            head = clean(m2.group(1))
            if " - " not in head and " – " not in head:
                continue
            rest = m2.group(2)
            em = re.search(r"<em>(.*?)</em>", rest, re.S)
            detail = norm_detail(em.group(1)) if em else norm_detail(re.split(r"<br\s*/?>", rest)[0])
            tracks.append((head, detail))
    if not tracks:
        # Last resort — sample-collage episodes list their materials
        # as plain items (MR21's ingredients, MR41's 96:01 pieces).
        # Take the content list with the most items, whole lines as
        # entries. Only zero-track episodes ever reach this.
        lists = [re.findall(r"<li>(.*?)</li>", l.group(2), re.S)
                 for l in re.finditer(r"<(ol|ul)[^>]*>(.*?)</\1>", body, re.S)]
        if lists:
            best = max(lists, key=len)
            for li in best:
                head = clean(re.split(r"<br\s*/?>", li)[0])
                head = re.sub(r"\s*\|\s*\)", ")", head)
                tracks.append((head, ""))
    ep["tracks"] = tracks
    total_tracks += len(tracks)
    print(f"  MR{ep['num']:>3} {ep['slug']}: {len(tracks)} tracks", file=sys.stderr)
    time.sleep(0.3)

# ---- 3. Write the master file ----
from datetime import date as _date
out = []
out.append("# Midnight Radio Tracklists\n")
out.append(f"*{len(eps)} episodes · {total_tracks} tracks · compiled {_date.today().isoformat()} from [jamesreeves.co/radio](https://www.jamesreeves.co/radio/)*\n")
out.append("\n## Index\n")
for ep in eps:
    out.append(f"- [Episode {ep['num']}: {ep['title']}](#{'episode-' + ep['num'].lower()})")
out.append("\n---\n")
for ep in eps:
    out.append(f"\n<a id=\"episode-{ep['num'].lower()}\"></a>")
    out.append(f"\n## Episode {ep['num']}: {ep['title']}\n")
    if ep["date"]:
        out.append(f"*{ep['date']}*")
    if ep["desc"]:
        out.append(f"  \n*{ep['desc']}*")
    out.append("")
    if not ep["tracks"]:
        out.append("_No formal tracklist — this episode was built from samples, tape loops, and field recordings._")
    for i, (head, detail) in enumerate(ep["tracks"], 1):
        out.append(f"{i}. **{head}**  ")
        out.append(f"   {detail}" if detail else "   —")
    out.append("")

dest = "/Users/jamesreeves/Dev/Zen/midnight_radio_all_tracklists.md"
open(dest, "w").write("\n".join(out))
print(f"wrote {dest}", file=sys.stderr)
