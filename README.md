# bestellung
Ein Portal für Bestellungen

## Lokal starten

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

## Bestellung

Aussendienstmitarbeiter (Pflichtfeld), Kundennummer und Kundenname eingeben, Artikel suchen und Kartonmengen wählen. Unter **Bestellung prüfen** Mengen und E-Mail-Vorschau kontrollieren. Die Nachricht enthält eine Tabelle mit **Artikelnummer** und **Menge_KT** für SAP sowie eine zweite Tabelle mit allen Bestelldaten. Die Datenzeilen ohne Überschrift können im Büro nach SAP kopiert werden. Die tatsächliche Übernahme hängt vom SAP-Eingabefeld ab.

**E-Mail senden** übermittelt die Bestellung nach Bestätigung direkt über den Vercel-Backend an `ad@pregel-deutschland.de`. Dazu den vom Administrator bereitgestellten Bestell-PIN eingeben. Es wird kein `.eml`-Entwurf mehr erzeugt.

Alternativ kopiert **E-Mail mit Tabellen kopieren** HTML und Text in die Zwischenablage. In eine neue HTML-E-Mail mit Formatierung einfügen. Empfänger und Betreff dabei separat eingeben. Der Excel-Button auf der Hauptseite bleibt verfügbar; SheetJS ist lokal gebündelt.

## Versand über Resend auf Vercel

Die Schaltfläche **E-Mail senden** sendet nach Bestätigung über `/api/send-order`. Kein E-Mail-Programm und keine `.eml`-Datei nötig. Der Server erzeugt die HTML-Tabellen aus dem vorhandenen Artikelkatalog und akzeptiert keine frei wählbaren Empfänger oder HTML-Inhalte.

In **Vercel → Project → Settings → Environment Variables** für Production (und bei Bedarf Preview) einrichten:

- `RESEND_API_KEY`: API-Key aus dem eigenen Resend-Account, nur serverseitig.
- `ORDER_ACCESS_CODE`: selbst gewählter, langer Zugangscode; nur den berechtigten Kollegen mitteilen. Im Portal als „Bestell-PIN“ eingeben. Nicht im Repository speichern.

Danach das aktuelle Deployment unter **Deployments → Redeploy** neu bereitstellen. Im Projekt Framework **Other**, ohne Build Command und mit Output Directory `.` verwenden. `vercel.json` bindet `index.html` in die Node-Funktion ein, damit der Server auf denselben Katalog zugreifen kann.

Der Test-Mittelsender ist `onboarding@resend.dev`; ausschließlich `ad@pregel-deutschland.de` wird adressiert. Das muss die Adresse des Resend-Accounts sein. Für andere Empfänger später einen eigenen, verifizierten Sender konfigurieren und die serverseitige Empfängerregel anpassen. Die API-Key-Werte niemals in Chat, HTML oder GitHub eintragen.

Erfolgreiche API-Antwort bedeutet Annahme durch Resend, nicht bestätigte Zustellung. Den Posteingang/Spamordner und Resend-Logs prüfen. Wiederholte Versuche desselben unveränderten Auftrags verwenden dieselbe Idempotency-ID, um doppelte Übermittlung zu vermeiden. Bei Änderungen am Auftrag entsteht eine neue ID. Beim Neuladen der Seite geht diese ID verloren.

GitHub Pages und `python3 -m http.server` bieten keinen Backend-Versand; dort bleiben die Vorschau, Excel und das Kopieren formatierter Tabellen nutzbar.

Backend-Prüfungen ohne echte E-Mails: `node --test tests/send-order.test.cjs`.

Der Aussendienstmitarbeiter wird vor den Kundendaten in der HTML- und Text-E-Mail angegeben. Bei einem Wechsel des Resend-Accounts den neuen API-Key als `RESEND_API_KEY` in Vercel Production ersetzen und neu deployen. Mit `onboarding@resend.dev` muss der Account auf `ad@pregel-deutschland.de` registriert sein.
