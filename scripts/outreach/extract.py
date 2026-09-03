"""A regi elovalogato-tablakbol nyers (email, nev, forras) rekordokat nyer ki.

A negy tabla szerkezete elter (a 2022/23/24 Google-urlap valaszok, a 2025 kezi
munkatabla), ezert nem oszlopnev szerint dolgozunk: minden munkalap minden cellajaban
emailt keresunk, es a sorban a hozza legkozelebbi nev-szeru cellat parositjuk hozza.
"""
import json, re, sys, unicodedata
from pathlib import Path
import openpyxl

EMAIL = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')

def looks_like_name(v: str) -> bool:
    v = (v or '').strip()
    if not v or len(v) < 4 or len(v) > 60:
        return False
    if EMAIL.search(v):
        return False
    if v[0].isdigit():
        return False
    if v.lower() in {'stb', 'igen', 'nem', 'nan', 'none', 'null'}:
        return False
    if re.match(r'^(https?:|www\.)', v, re.I):
        return False
    return any(ch.isalpha() for ch in v)

def name_nearest(cells, i):
    for j in range(i - 1, -1, -1):
        if looks_like_name(cells[j]):
            return cells[j].strip()
    for j in range(i + 1, len(cells)):
        if looks_like_name(cells[j]):
            return cells[j].strip()
    return ''

def header_columns(cells):
    """Google-urlap valaszlapoknal a fejlecbol pontosan tudjuk, melyik oszlop a nev.
    Visszaadja (nev_oszlop, email_oszlopok) vagy (None, []) ha nincs ilyen fejlec."""
    name_col, email_cols = None, []
    for i, c in enumerate(cells):
        h = c.strip().lower()
        if not h:
            continue
        if name_col is None and h.startswith('név'):
            name_col = i
        if 'mail' in h:
            email_cols.append(i)
    return (name_col, email_cols) if (name_col is not None and email_cols) else (None, [])

def extract(path: Path, label: str):
    out = []
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    for ws in wb.worksheets:
        rows = [[('' if c is None else str(c)).strip() for c in r] for r in ws.iter_rows(values_only=True)]
        if not rows:
            continue
        name_col, email_cols = header_columns(rows[0])
        for cells in (rows[1:] if name_col is not None else rows):
            if name_col is not None:
                # Fejleces lap: a nev BIZTOSAN a nev-oszlopbol jon, nem talalgatunk.
                name = cells[name_col].strip() if name_col < len(cells) else ''
                seen = set()
                for ci in email_cols:
                    if ci < len(cells):
                        for m in EMAIL.finditer(cells[ci]):
                            e = m.group(0).lower()
                            if e in seen:
                                continue
                            seen.add(e)
                            out.append({'email': e, 'name': name, 'source': label,
                                        'sheet': ws.title, 'from_header': True})
            else:
                for i, cell in enumerate(cells):
                    for m in EMAIL.finditer(cell):
                        out.append({'email': m.group(0).lower(), 'name': name_nearest(cells, i),
                                    'source': label, 'sheet': ws.title, 'from_header': False})
    wb.close()
    return out

def main():
    downloads = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / 'Downloads'
    files = {
        '10. OB (2022)': '10.SPOB előválogatók.xlsx',
        '11. OB (2023)': '11. Slam Poetry Országos Bajnokság (válaszok).xlsx',
        '12. OB (2024)': '12. Slam Poetry Országos Bajnokság  (válaszok).xlsx',
        '13. OB (2025)': 'Slam Poetry OB 2025.xlsx',
    }
    records, missing = [], []
    for label, fn in files.items():
        p = downloads / fn
        if not p.exists():
            missing.append(str(p)); continue
        got = extract(p, label)
        records.extend(got)
        print(f'  {label:16s} {len(got):4d} email-elofordulas  ({fn})')
    if missing:
        print('HIANYZO FAJLOK:', *missing, sep='\n  ')
        sys.exit(1)
    dest = Path('outreach/private/raw-records.json')
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(records, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'\nOsszesen {len(records)} elofordulas -> {dest}')

if __name__ == '__main__':
    main()
