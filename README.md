# Refurbished AirPods E-Commerce Platform

## Übersicht

Diese statische E-Commerce-Website bietet eine Plattform für den Verkauf von refurbished AirPods. Das Projekt wurde mit Vanilla HTML, CSS und JavaScript entwickelt und verzichtet bewusst auf externe Frameworks, um eine schlanke und performante Lösung zu gewährleisten. Die Anwendung bietet eine vollständige Shopping-Erfahrung inklusive Produktbrowsing, Detailansichten, Warenkorb-Verwaltung und einem simulierten Checkout-Prozess.

## Features

- **Produktkatalog**: Übersichtliche Darstellung aller verfügbaren refurbished AirPods-Modelle
- **Produkt-Detailansicht**: Detaillierte Informationen zu jedem Produkt mit Bildern, Beschreibungen und Spezifikationen
- **Warenkorb mit localStorage**: Persistente Warenkorb-Verwaltung über Browser-Sitzungen hinweg
- **Suche & Filter**: Dynamische Produktsuche und Filterfunktionen nach Kategorie, Preis und Zustand
- **Simulierter Checkout**: Vollständiger Checkout-Prozess mit Formularvalidierung
- **Responsive Design**: Optimierte Darstellung für Desktop, Tablet und mobile Geräte
- **Benachrichtigungssystem**: Toast-Notifications für Benutzer-Feedback
- **Fehlerbehandlung**: Robuste Error-Handling-Mechanismen

## Technologie-Stack

- **HTML5**: Semantisches Markup für strukturierte Inhalte
- **CSS3**: Modernes Styling mit Flexbox, Grid und Custom Properties
- **Vanilla JavaScript**: Keine externen Dependencies, modulare Code-Struktur
- **localStorage API**: Client-seitige Datenpersistenz für Warenkorb
- **sessionStorage API**: Temporäre Speicherung von Bestelldaten
- **GitHub Pages**: Deployment-ready Konfiguration

## Dateistruktur

/
├── index.html                 # Startseite mit Produktkatalog
├── product.html              # Produkt-Detailseite
├── cart.html                 # Warenkorb-Seite
├── checkout.html             # Checkout-Seite
├── confirmation.html         # Bestellbestätigungs-Seite
├── README.md                 # Projektdokumentation
├── /css/
│   └── styles.css           # Globale Styles und Design-System
├── /js/
│   ├── app.js               # Hauptanwendung und Initialisierung
│   ├── cart.js              # Warenkorb-Logik und localStorage-Management
│   ├── products.js          # Produktdaten-Management
│   ├── search.js            # Such- und Filterfunktionalität
│   ├── checkout.js          # Checkout-Prozess und Validierung
│   └── utils.js             # Hilfsfunktionen und gemeinsame Utilities
├── /data/
│   └── products.json        # Produktdatenbank (JSON-Format)
└── /images/
    ├── airpods-pro-2.jpg    # Produktbilder (entsprechend products.json)
    ├── airpods-3.jpg
    ├── airpods-2.jpg
    └── ...                  # Weitere Produktbilder


## Installation & Deployment

### Lokale Entwicklung

1. **Repository klonen**:
   ```bash
   git clone <repository-url>
   cd refurbished-airpods-shop
   

2. **Produktbilder hinzufügen**:
   Platziere alle Produktbilder im `./images/` Ordner. Die Dateinamen müssen den Pfaden in `./data/products.json` entsprechen.

3. **Anwendung starten**:
   Öffne `index.html` direkt im Browser oder nutze einen lokalen Webserver:
   ```bash
   # Mit Python 3
   python -m http.server 8000
   
   # Mit Node.js (http-server)
   npx http-server
   
   Öffne dann `http://localhost:8000` im Browser.

### GitHub Pages Deployment

1. **Repository auf GitHub hochladen**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   

2. **GitHub Pages aktivieren**:
   - Navigiere zu Repository Settings
   - Scrolle zu "Pages" Sektion
   - Wähle Branch "main" und Root-Verzeichnis "/"
   - Speichere die Einstellungen

3. **Website aufrufen**:
   Die Site ist nach wenigen Minuten unter `https://<username>.github.io/<repository-name>/` verfügbar.

## Verwendung

### Navigation

- **Startseite**: Zeigt alle verfügbaren Produkte im Katalog
- **Suchleiste**: Filtere Produkte nach Namen oder Beschreibung
- **Filter**: Nutze die Filteroptionen für Kategorie, Preis und Zustand
- **Produktdetails**: Klicke auf ein Produkt für detaillierte Informationen
- **Warenkorb**: Klicke auf das Warenkorb-Icon im Header (zeigt Anzahl der Artikel)
- **Checkout**: Folge dem Checkout-Prozess zur Bestellabwicklung

### Warenkorb-Verwaltung

- Produkte über "In den Warenkorb" Button hinzufügen
- Mengen direkt im Warenkorb anpassen
- Artikel über "Entfernen" Button aus dem Warenkorb löschen
- Warenkorb bleibt über Browser-Sitzungen erhalten (localStorage)

### Checkout-Prozess

1. Warenkorb überprüfen und ggf. anpassen
2. "Zur Kasse" Button klicken
3. Lieferadresse und Zahlungsinformationen eingeben
4. Bestellung überprüfen und abschließen
5. Bestellbestätigung erhalten

## Entwickler-Hinweise

### Code-Struktur

Die Anwendung folgt dem **Module Pattern** für eine saubere Trennung von Funktionalitäten:

- **app.js**: Orchestriert die Anwendung und initialisiert Module
- **cart.js**: Exportiert CartManager für komplette Warenkorb-Verwaltung
- **products.js**: Verwaltet Produktdaten und Rendering
- **search.js**: Implementiert Such- und Filter-Logik
- **checkout.js**: Handhabt Checkout-Prozess und Validierung
- **utils.js**: Gemeinsame Hilfsfunktionen (Formatierung, Validierung, etc.)

### localStorage & sessionStorage

- **localStorage**: Persistente Speicherung des Warenkorbs (cart_items)
- **sessionStorage**: Temporäre Speicherung von Bestelldaten (order_data)

### Design-System

Das Projekt nutzt ein konsistentes Design-System mit folgenden Komponenten:

**Farben** (CSS Custom Properties in styles.css):
- Primary: #1d4ed8 (Blau)
- Secondary: #64748b (Grau)
- Success: #16a34a (Grün)
- Error: #dc2626 (Rot)
- Warning: #eab308 (Gelb)

**Utility-Klassen**:
- `.hidden`: Element ausblenden
- `.active`: Aktiver Zustand
- `.error`, `.success`: Status-Indikatoren
- `.loading`: Lade-Zustand
- `.disabled`: Deaktivierter Zustand
- `.badge`: Anzahl-Badge (z.B. Warenkorb)
- `.toast`: Benachrichtigungen
- `.spinner`: Lade-Animation

**Globale IDs**:
- `app-container`: Haupt-Container
- `cart-badge`: Warenkorb-Anzahl
- `product-grid`: Produkt-Raster
- `search-input`: Suchfeld
- `filter-container`: Filter-Bereich

### Best Practices

- **Keine Inline-Styles**: Nutze ausschließlich CSS-Klassen
- **Relative Pfade**: Alle Pfade beginnen mit `./`
- **Error Handling**: Try-catch Blöcke für robuste Fehlerbehandlung
- **Modularer Code**: Funktionen mit klarer Verantwortlichkeit
- **Event Delegation**: Effizientes Event-Handling für dynamische Inhalte

### Produktdaten erweitern

Bearbeite `./data/products.json` um Produkte hinzuzufügen oder zu ändern:

```json
{
  "id": "unique-id",
  "name": "Produktname",
  "price": 199.99,
  "originalPrice": 249.99,
  "condition": "Ausgezeichnet",
  "image": "./images/produkt.jpg",
  "description": "Produktbeschreibung",
  "features": ["Feature 1", "Feature 2"],
  "category": "AirPods Pro"
}


## Browser-Kompatibilität

Die Anwendung wurde getestet und ist kompatibel mit:

- **Google Chrome** (ab Version 90)
- **Mozilla Firefox** (ab Version 88)
- **Safari** (ab Version 14)
- **Microsoft Edge** (ab Version 90)

### Voraussetzungen

- JavaScript muss aktiviert sein
- localStorage und sessionStorage müssen verfügbar sein
- Moderne CSS-Features (Flexbox, Grid, Custom Properties)

## Lizenz

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.