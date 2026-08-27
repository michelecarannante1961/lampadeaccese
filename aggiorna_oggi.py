#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import os
import sys
import urllib.request
import html
import xml.etree.ElementTree as ET

OGGI_PATH = os.path.join(os.path.dirname(__file__), "oggi.json")
ARCHIVIO_PATH = os.path.join(os.path.dirname(__file__), "data", "archivio.json")
VATICAN_RSS_URL = "https://www.vaticannews.va/content/vaticannews/it/vangelo-del-giorno-e-parola-del-giorno.rss.xml"

def valida_oggi(data):
    required = ["data_iso", "hero", "fraseLuce", "letture", "omelia", "santo"]
    for r in required:
        if r not in data:
            print(f"Manca il campo obbligatorio: {r}")
            return False
    print("Validazione superata con successo!")
    return True

def salva_dati(data, archivia=True):
    if not valida_oggi(data):
        return False

    with open(OGGI_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"File salvato con successo: {OGGI_PATH}")

    if archivia and os.path.exists(ARCHIVIO_PATH):
        try:
            with open(ARCHIVIO_PATH, "r", encoding="utf-8") as f:
                arch = json.load(f)
            iso = data.get("data_iso")
            if iso:
                arch[iso] = data
                with open(ARCHIVIO_PATH, "w", encoding="utf-8") as f:
                    json.dump(arch, f, ensure_ascii=False, indent=2)
                print(f"Contenuto archiviato per la data: {iso}")
        except Exception as e:
            print(f"Avviso archiviazione: {e}")
    return True

def sincronizza_da_vatican_news():
    print("Connessione al feed ufficiale di Vatican News...")
    try:
        req = urllib.request.Request(VATICAN_RSS_URL, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as res:
            xml_data = res.read().decode('utf-8', errors='ignore')

        root = ET.fromstring(xml_data)
        item = root.find('channel').find('item')
        if item is None:
            print("Nessun elemento trovato nel feed.")
            return False

        title = item.findtext('title')
        audio_el = item.find('enclosure')
        audio_url = audio_el.get('url') if audio_el is not None else ""

        print(f"Trovato: {title}")
        print(f"Audio MP3: {audio_url}")

        if os.path.exists(OGGI_PATH):
            with open(OGGI_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
        else:
            data = {}

        if "audio" not in data:
            data["audio"] = {}
        data["audio"]["url"] = audio_url
        data["audio"]["fonte"] = "Vatican News — Radio Vaticana"

        if "letture" in data and "vangelo" in data["letture"]:
            data["letture"]["vangelo"]["audioUrl"] = audio_url

        salva_dati(data)
        print("Sincronizzazione da Vatican News completata!")
        return True

    except Exception as e:
        print(f"Errore durante la sincronizzazione: {e}")
        return False

def main():
    print("=== LAMPADE ACCESE — Gestore Contenuti & Vatican News ===")
    if len(sys.argv) > 1 and sys.argv[1] == "--sync-vatican":
        sincronizza_da_vatican_news()
        return

    if os.path.exists(OGGI_PATH):
        with open(OGGI_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"Data in oggi.json: {data.get('data_iso')} ({data.get('hero', {}).get('dataLeggibile')})")
        print(f"Audio Vatican News: {data.get('audio', {}).get('url')}")
        print(f"Omelia: {data.get('omelia', {}).get('autore')} ({data.get('omelia', {}).get('data')})")
        valida_oggi(data)
    else:
        print("oggi.json non trovato.")

if __name__ == "__main__":
    main()
