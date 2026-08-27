#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/sync-og-tags.py
Sincronizza automaticamente i meta tag Open Graph (og:title, og:description)
e Twitter Card (twitter:title, twitter:description) in index.html
leggendo i valori da oggi.json.
"""

import json
import os
import re
import sys

def compute_og_values(oggi_data):
    """
    Calcola il titolo e la descrizione Open Graph / Twitter Card in base a oggi.json:
    - Titolo: "Lampade Accese — " + hero.dataLeggibile + (se santo.nome presente) " · " + santo.nome
    - Descrizione: fraseLuce.testo + " (" + fraseLuce.riferimento + ") — il Vangelo e l'omelia del giorno."
    """
    hero = oggi_data.get("hero") or {}
    data_leggibile = (hero.get("dataLeggibile") or "").strip()

    santo = oggi_data.get("santo") or {}
    santo_nome = ""
    if isinstance(santo, dict):
        santo_nome = (santo.get("nome") or "").strip()
    elif isinstance(santo, str):
        santo_nome = santo.strip()

    if data_leggibile and santo_nome:
        titolo = f"Lampade Accese — {data_leggibile} · {santo_nome}"
    elif data_leggibile:
        titolo = f"Lampade Accese — {data_leggibile}"
    elif santo_nome:
        titolo = f"Lampade Accese — {santo_nome}"
    else:
        titolo = "Lampade Accese — Una Parola per illuminare la giornata"

    frase_luce = oggi_data.get("fraseLuce") or {}
    if isinstance(frase_luce, dict):
        testo = (frase_luce.get("testo") or "").strip()
        riferimento = (frase_luce.get("riferimento") or "").strip()
    else:
        testo = str(frase_luce).strip()
        riferimento = ""

    if testo and riferimento:
        descrizione = f"{testo} ({riferimento}) — il Vangelo e l'omelia del giorno."
    elif testo:
        descrizione = f"{testo} — il Vangelo e l'omelia del giorno."
    else:
        descrizione = "Lampade Accese: la Parola di Dio del giorno, Vangelo, omelia dei Papi e audio ufficiale Vatican News."

    return titolo, descrizione

def escape_attribute(text):
    """
    Esegue l'escape dei caratteri che potrebbero rompere l'attributo HTML content="..."
    mantenendo i caratteri UTF-8 leggibili.
    """
    return (text.replace('&', '&amp;')
                .replace('"', '&quot;')
                .replace('<', '&lt;')
                .replace('>', '&gt;'))

def update_index_html(index_path, titolo, descrizione):
    """
    Aggiorna esclusivamente i 4 tag meta in index.html:
    - og:title
    - og:description
    - twitter:title
    - twitter:description
    Preserva i fine riga originali e non tocca altri tag o sezioni.
    """
    if not os.path.exists(index_path):
        raise FileNotFoundError(f"File {index_path} non trovato.")

    with open(index_path, "r", encoding="utf-8", newline="") as f:
        content = f.read()

    safe_titolo = escape_attribute(titolo)
    safe_descrizione = escape_attribute(descrizione)

    # Regex mirate per ciascun tag
    patterns = [
        (r'(<meta\s+property=["\']og:title["\']\s+content=")[^"]*("\s*/?>)', safe_titolo, "og:title"),
        (r'(<meta\s+property=["\']og:description["\']\s+content=")[^"]*("\s*/?>)', safe_descrizione, "og:description"),
        (r'(<meta\s+name=["\']twitter:title["\']\s+content=")[^"]*("\s*/?>)', safe_titolo, "twitter:title"),
        (r'(<meta\s+name=["\']twitter:description["\']\s+content=")[^"]*("\s*/?>)', safe_descrizione, "twitter:description"),
    ]

    new_content = content
    for pattern, new_val, label in patterns:
        if not re.search(pattern, new_content, flags=re.IGNORECASE):
            print(f"ATTENZIONE: Tag {label} non trovato in {index_path}")
            continue
        new_content = re.sub(
            pattern,
            lambda m, val=new_val: f"{m.group(1)}{val}{m.group(2)}",
            new_content,
            count=1,
            flags=re.IGNORECASE
        )

    if new_content == content:
        print("I tag in index.html sono già aggiornati. Nessuna modifica necessaria.")
        return False

    with open(index_path, "w", encoding="utf-8", newline="") as f:
        f.write(new_content)

    print(f"Aggiornato {index_path} con successo:")
    print(f"  Titolo:      {titolo}")
    print(f"  Descrizione: {descrizione}")
    return True

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    oggi_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(base_dir, "oggi.json")
    index_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(base_dir, "index.html")

    if not os.path.exists(oggi_path):
        print(f"Errore: File {oggi_path} non trovato.")
        sys.exit(1)

    with open(oggi_path, "r", encoding="utf-8") as f:
        oggi_data = json.load(f)

    titolo, descrizione = compute_og_values(oggi_data)
    update_index_html(index_path, titolo, descrizione)

if __name__ == "__main__":
    main()
