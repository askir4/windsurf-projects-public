# Codebase-Review – Gewaechshaus

## Kurzfazit
Die Codebasis ist ein funktionales, praxisnahes Full-Stack-Projekt (Express + SQLite + Vanilla-Frontend), das fuer den Lernfeld-Kontext viele Features sauber abdeckt: Auth, Rollen, Audit-Logs, Sensor-API, UI fuer Beete/Pflanzen und Sync. Positiv sind die klare Feature-Abdeckung, die Sicherheitsbemuehungen (Input-Validation, Rate-Limits, Audit-Log) und die vergleichsweise gut dokumentierten Server-Endpunkte. Gleichzeitig gibt es einige sicherheitsrelevante Stellen (offene Daten-API, statischer File-Serve aus dem Projektroot, Default-Admin, in-memory Rate Limits) und strukturelle Engpaesse (monolithisches Frontend, begrenzte Modularitaet, keine echten Migrations/Schema-Versionen).

## Was gut gelungen ist
- **Feature-Tiefe**: Pflanzen-/Beetverwaltung, Sensoren, Duenger, Audit-Logs und Admin-Panel sind sauber integriert.
- **Server-Seite**: Input-Validation, simple Rate-Limits, Audit-Logging und Passwort-Hashing sind vorhanden.
- **Datenmodell**: Normalisierte Tabellen (zones/slots/plants/users/audit_logs) und Transaktionen beim Speichern der Hauptdaten.
- **Tests**: Auth/RBAC/Rate-Limit Tests geben eine solide Basis fuer Regressionen.
- **UX**: Viele Interaktionen (Drag & Drop, Picker, Multi-Select, Modals) sind direkt nutzbar.

## Risiken / Schwachstellen
- **Offene Daten-Endpunkte**: `/api/data` ist ohne Auth erreichbar und erlaubt Komplett-Overwrite via POST. Das ist im LAN kritisch.
- **Statisches Serving aus Projektroot**: `express.static(__dirname)` kann Server-Dateien/Logs/DB ausliefern, wenn sie nicht explizit ausgeschlossen werden.
- **Default-Admin**: `admin/admin123!` als Fallback ist fuer echte Deployments riskant, selbst wenn env vars empfohlen sind.
- **Session-Sicherheit**: `secure: false` (ohne HTTPS) ist fuer Prod ein Risiko; Secret wechselt per Start, was Sessions invalidiert.
- **Rate-Limit in Memory**: Bei Restart oder Multi-Instance nicht wirksam; zudem einfacher zu umgehen.
- **Upload-Validierung**: Dateityp-Pruefung erfolgt nur ueber Extension, kein Content-Type/Magic-Check.
- **Frontend-Monolith**: `script.js` ist sehr gross und mischt UI, State und Netzwerk; erschwert Wartung.

## Code-Struktur und Wartbarkeit
- **Frontend**: Eine grosse Klasse mit vielen Zustandsvariablen und direktem DOM-Zugriff. Funktional, aber schwer zu testen/erweitern. Modularisierung in kleinere Komponenten/Services waere sinnvoll.
- **Backend**: Monolithischer `server.js`, klar gegliedert, aber mit vielen Verantwortungen (Auth, Data, Sensors, Logs). Refactoring in Router/Controller waere langfristig wartbarer.
- **Dokumentation**: README und SERVER.md sind hilfreich und detailreich.

## Tests und Qualitaet
- Tests decken Kern-Auth und RBAC ab, aber sind stark an einen laufenden Server gebunden (keine Isolation, reale DB).
- Kein Test fuer die Daten-API oder Sensoren; keine UI-Tests.

## Fazit
Ein starkes, funktionales Projekt mit viel Feature-Scope und sichtbarer Praxisorientierung. Fuer einen Produktionsbetrieb braucht es vor allem mehr Sicherheitshygiene (Auth auf Datenendpunkten, statische Auslieferung haerten, Default-Admin entfernen, HTTPS) und strukturelle Entkoppelung im Frontend/Backend. Als Lern-/Schulprojekt sehr solide, als lauffaehige Demo ebenfalls brauchbar, aber mit klaren Upgrade-Punkten fuer Sicherheit und Wartbarkeit.
