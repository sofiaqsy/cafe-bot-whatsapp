#!/bin/bash

# Script para mostrar y verificar los estados de pedidos
# Compatible con Google Sheets

echo "==========================================="
echo "   ESTADOS DE PEDIDOS - CAFÉ BOT"
echo "==========================================="
echo ""

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 ESTADOS ESTÁNDAR (Google Sheets):${NC}"
echo ""

echo -e "${YELLOW}Estados que requieren acción del cliente:${NC}"
echo -e "${RED}  • Pendiente verificación${NC} - Cliente debe enviar comprobante"
echo ""

echo -e "${YELLOW}Estados en proceso:${NC}"
echo -e "${GREEN}  • Pago confirmado${NC} - Pago verificado por admin"
echo -e "${CYAN}  • En preparación${NC} - Preparando el pedido"
echo -e "${CYAN}  • En camino${NC} - Pedido en ruta de entrega"
echo -e "${CYAN}  • Listo para recoger${NC} - Disponible para pickup"
echo ""

echo -e "${YELLOW}Estados finales:${NC}"
echo -e "${GREEN}  • Entregado${NC} - Pedido entregado al cliente"
echo -e "${GREEN}  • Completado${NC} - Proceso completamente finalizado"
echo -e "${RED}  • Cancelado${NC} - Pedido cancelado"
echo ""

echo "==========================================="
echo -e "${BLUE}🔄 FLUJO DE ESTADOS:${NC}"
echo ""

echo "1. Cliente hace pedido → ${RED}Pendiente verificación${NC}"
echo "2. Cliente envía comprobante → ${RED}Pendiente verificación${NC}"
echo "3. Admin verifica pago → ${GREEN}Pago confirmado${NC}"
echo "4. Se prepara pedido → ${CYAN}En preparación${NC}"
echo "5. Sale a entrega → ${CYAN}En camino${NC}"
echo "6. Cliente recibe → ${GREEN}Entregado${NC}"
echo "7. Proceso finaliza → ${GREEN}Completado${NC}"
echo ""

echo "==========================================="
echo -e "${BLUE}📱 NOTIFICACIONES AUTOMÁTICAS:${NC}"
echo ""

echo "El bot notifica automáticamente al cliente cuando:"
echo "  • ${GREEN}Pago confirmado${NC} → '✅ PAGO CONFIRMADO'"
echo "  • ${CYAN}En preparación${NC} → '🎆 PEDIDO EN PREPARACIÓN'"
echo "  • ${CYAN}En camino${NC} → '🚚 PEDIDO EN CAMINO'"
echo "  • ${GREEN}Entregado${NC} → '✅ PEDIDO ENTREGADO'"
echo ""

echo "==========================================="
echo -e "${YELLOW}⚠️ IMPORTANTE:${NC}"
echo ""
echo "• Estos estados deben coincidir EXACTAMENTE con Google Sheets"
echo "• No uses variaciones como 'Pendiente de verificación'"
echo "• El estado inicial siempre es 'Pendiente verificación'"
echo "• Los estados son case-sensitive"
echo ""

echo "==========================================="
echo -e "${GREEN}✅ Estados configurados correctamente en:${NC}"
echo "  • order-states.js"
echo "  • state-manager.js"
echo "  • order-handler.js"
echo ""
