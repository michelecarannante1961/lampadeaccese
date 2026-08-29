#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys, json, shutil, smtplib, subprocess, urllib.request, re
import xml.etree.ElementTree as ET
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

REPO_DIR = r"C:\Users\pcù\.gemini\antigravity\scratch\lampadeaccese"
DESKTOP_DIR = r"C:\Users\pcù\Desktop"
SECRETS_PATH = r"C:\Users\pcù\.lampade_accese_secrets.json"
VATICAN_RSS_URL = "https://www.vaticannews.va/content/vaticannews/it/vangelo-del-giorno-e-parola-del-giorno.rss.xml"

with open(SECRETS_PATH, "r", encoding="utf-8") as f:
    sec = json.load(f)

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465
GMAIL_USER = sec["gmail_user"]
GMAIL_PASS = sec["gmail_pass"]
RECIPIENT = sec["gmail_user"]
GITHUB_TOKEN = sec["github_token"]
GITHUB_REPO_URL = f"https://michelecarannante1961:{GITHUB_TOKEN}@github.com/michelecarannante1961/lampadeaccese.git"

def get_latest_vatican_audio():
    try:
        req = urllib.request.Request(VATICAN_RSS_URL, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as res:
            xml_data = res.read().decode('utf-8', errors='ignore')
        root = ET.fromstring(xml_data)
        item = root.find('channel').find('item')
        if item is not None:
            enc = item.find('enclosure')
            if enc is not None and enc.get('url'):
                return enc.get('url')
    except Exception as e:
        print("Audio RSS err:", e)
    return "https://media.vaticannews.va/media2/audio/s1/2026/08/07/12/139237941_F139237941.mp3"

def main():
    oggi_file = os.path.join(REPO_DIR, "oggi.json")
    with open(oggi_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    audio_url = get_latest_vatican_audio()
    data["audio"]["url"] = audio_url
    if "letture" in data and "vangelo" in data["letture"]:
        data["letture"]["vangelo"]["audioUrl"] = audio_url
    with open(oggi_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Git push
    subprocess.run(["git", "remote", "set-url", "origin", GITHUB_REPO_URL], cwd=REPO_DIR, check=True)
    subprocess.run(["git", "pull", "--rebase", "origin", "main"], cwd=REPO_DIR, check=False)
    subprocess.run(["git", "add", "oggi.json", "data/archivio.json", "index.html", ".gitignore"], cwd=REPO_DIR, check=True)
    subprocess.run(["git", "commit", "-m", f"Aggiornamento liturgico {data.get('data_iso')}"], cwd=REPO_DIR, capture_output=True, text=True)
    subprocess.run(["git", "push", "origin", "main"], cwd=REPO_DIR, check=True)
    print("Push completato con successo!")

if __name__ == "__main__":
    main()
