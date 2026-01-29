#!/bin/bash
# Gewächshaus Server - Raspberry Pi Startskript
# Mit automatischem Neustart bei Absturz

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_FILE="$SCRIPT_DIR/server-simple.js"
LOG_FILE="$SCRIPT_DIR/server.log"
PID_FILE="$SCRIPT_DIR/server.pid"

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funktion: Server starten
start_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Server läuft bereits (PID: $PID)${NC}"
            return 1
        fi
        rm -f "$PID_FILE"
    fi

    echo -e "${GREEN}🌱 Starte Gewächshaus Server...${NC}"
    
    # Server mit niedriger Priorität starten (schont CPU)
    cd "$SCRIPT_DIR"
    nice -n 10 node --max-old-space-size=128 "$SERVER_FILE" >> "$LOG_FILE" 2>&1 &
    
    echo $! > "$PID_FILE"
    sleep 2
    
    if ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Server gestartet (PID: $(cat $PID_FILE))${NC}"
        echo -e "${GREEN}  URL: http://localhost:3001${NC}"
        return 0
    else
        echo -e "${RED}✗ Server konnte nicht gestartet werden${NC}"
        rm -f "$PID_FILE"
        return 1
    fi
}

# Funktion: Server stoppen
stop_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stoppe Server (PID: $PID)...${NC}"
            kill $PID
            sleep 2
            if ps -p $PID > /dev/null 2>&1; then
                kill -9 $PID
            fi
            echo -e "${GREEN}✓ Server gestoppt${NC}"
        fi
        rm -f "$PID_FILE"
    else
        echo -e "${YELLOW}Server läuft nicht${NC}"
    fi
}

# Funktion: Status prüfen
check_status() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            MEM=$(ps -o rss= -p $PID | awk '{print int($1/1024)"MB"}')
            echo -e "${GREEN}✓ Server läuft (PID: $PID, RAM: $MEM)${NC}"
            return 0
        fi
    fi
    echo -e "${RED}✗ Server läuft nicht${NC}"
    return 1
}

# Funktion: Auto-Restart Daemon
run_daemon() {
    echo -e "${GREEN}🔄 Starte Auto-Restart Daemon...${NC}"
    echo "Drücke Ctrl+C zum Beenden"
    
    while true; do
        if ! check_status > /dev/null 2>&1; then
            echo -e "${YELLOW}$(date): Server neu starten...${NC}"
            start_server
        fi
        sleep 30
    done
}

# Funktion: Logs anzeigen
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        echo "Keine Logs vorhanden"
    fi
}

# Hauptmenü
case "$1" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        stop_server
        sleep 1
        start_server
        ;;
    status)
        check_status
        ;;
    daemon)
        run_daemon
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Gewächshaus Server - Raspberry Pi"
        echo ""
        echo "Verwendung: $0 {start|stop|restart|status|daemon|logs}"
        echo ""
        echo "  start   - Server starten"
        echo "  stop    - Server stoppen"
        echo "  restart - Server neu starten"
        echo "  status  - Status prüfen"
        echo "  daemon  - Mit Auto-Restart laufen"
        echo "  logs    - Logs anzeigen"
        exit 1
        ;;
esac

exit 0
