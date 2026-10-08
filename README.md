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

**E-Mail mit Tabelle** lädt einen `.eml`-Entwurf mit HTML-Tabellen herunter. Im E-Mail-Programm öffnen und selbst senden. Ob die Datei direkt als bearbeitbarer Entwurf geöffnet wird, hängt vom E-Mail-Programm ab; gegebenenfalls „Erneut senden“ verwenden.

Die Nachricht enthält eine separate Tabelle mit **Artikelnummer** und **Menge_KT** für SAP sowie eine zweite Tabelle mit allen Bestelldaten. Die SAP-Datenzeilen ohne Überschrift markieren, kopieren und in SAP einfügen. Artikelnummern bleiben als Text inklusive führender Nullen erhalten. Die tatsächliche Übernahme hängt vom SAP-Eingabefeld ab.

Excel kann weiterhin über den Excel-Button auf der Hauptseite heruntergeladen werden. Die E-Mail hat zusätzlich eine Textversion für Programme ohne HTML-Unterstützung.

**E-Mail mit Tabellen kopieren** kopiert HTML und Text in die Zwischenablage. In eine neue E-Mail mit normalem Einfügen (Strg+V) übernehmen; das E-Mail-Programm muss HTML-/Rich-Text-Nachrichten erlauben. Nicht „Nur Text einfügen“ verwenden. Bei blockierter Zwischenablage die sichtbaren Tabellen in der Vorschau markieren und kopieren. Empfänger und Betreff separat im E-Mail-Programm eingeben.

E-Mails enthalten keine ausführbaren Kopierbuttons; im Büro die Zeilen der zweispaltigen SAP-Tabelle ohne Überschrift kopieren. Wenn ein E-Mail-Programm den `.eml`-Entwurf als Klartext anzeigt, stattdessen das Kopieren der formatierten Tabellen verwenden oder die HTML-Anzeige im E-Mail-Programm aktivieren.
