# bestellung
Ein Portal für Bestellungen

## Lokal starten

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

## Bestellung per E-Mail

Kundennummer und Kundenname eingeben, Artikel suchen und Kartonmengen wählen.
Der E-Mail-Empfänger ist zunächst `enzo.notari@pregel-deutschland.de` und kann im Formular geändert werden.
Unter **Bestellung prüfen** zeigt die E-Mail-Vorschau den Kunden und alle Artikelspalten:
Artikelnummer, Menge_KT, Artikelbeschreibung, Gewicht_KG, Gewicht_pro_Karton_KG, Kundennummer, Kategorie und Kundenname.

**E-Mail öffnen** erstellt einen Entwurf im installierten E-Mail-Programm. Die Nachricht wird nicht automatisch gesendet.
Bei langen Bestellungen wird stattdessen eine `.eml`-Datei heruntergeladen; **E-Mail-Datei** bietet diesen Download jederzeit an.
Ob eine `.eml`-Datei direkt als bearbeitbarer Entwurf geöffnet wird, hängt vom E-Mail-Programm ab.
Die E-Mail enthält die Artikeldaten als Text mit tabulatorgetrennten Spalten. Excel kann zusätzlich heruntergeladen oder geteilt werden; beim Öffnen über `mailto:` wird kein Anhang automatisch hinzugefügt.
