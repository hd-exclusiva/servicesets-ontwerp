# Servicesets website en portaal: ontwerp

Klikbaar ontwerp van Servicesets.com, met zeven schermen. Open `index.html` voor het overzicht.

| Scherm | Bestand |
| --- | --- |
| Homepage | `Main.dc.html` |
| Configurator: set samenstellen | `Configurator.dc.html` |
| Productpagina standaardset | `Product.dc.html` |
| Klantportaal | `Portaal.dc.html` |
| Mobiel: herbestellen | `Mobiel.dc.html` |
| Checkout | `Checkout.dc.html` |
| Standaardsets: overzicht | `Standaardsets.dc.html` |

`support.js` zorgt dat de interactieve delen werken (configurator, bespaarcalculator, tegels en snel bestellen) zonder build-stap. De site draait dus direct op GitHub Pages.

## Afbeeldingen

Zet de foto's in de map `img/` met deze namen. Extensie mag `.jpg`, `.png`, `.webp` of `.svg` zijn. Ontbreekt een bestand, dan toont de pagina een grijs vlak met de omschrijving, en voor het logo de tekst SERVICESETS.

| Bestandsnaam | Wat |
| --- | --- |
| `logo` | Servicesets-logo (header) |
| `hero` | Homepage-foto: vader en zoon zetten een tent op |
| `set-bad-douche` | Gastenset bad en douche |
| `set-keuken` | Serviceset keuken |
| `set-koffie-thee` | Welcome coffee set |
| `set-spel` | Spelset SuperDobbel |
| `item-afwasmiddel` | Configurator: afwasmiddel |
| `item-afwasborstel` | Configurator: afwasborstel |
| `item-schuursponsje` | Configurator: schuursponsje |
| `item-vaatwastabletten` | Configurator: vaatwastabletten |
| `item-toiletpapier` | Configurator: toiletpapier |
| `item-lucifers` | Configurator: lucifers |

## GitHub Pages

Settings → Pages → Source: *Deploy from a branch*, branch `main`, map `/ (root)`.
