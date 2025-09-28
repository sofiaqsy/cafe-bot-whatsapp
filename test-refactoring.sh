#!/bin/bash

# Script para probar el bot refactorizado
# Compara el comportamiento con el bot original

echo "==========================================="
echo "   PRUEBA DE BOT REFACTORIZADO"
echo "==========================================="
echo ""

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 CHECKLIST DE PRUEBAS:${NC}"
echo ""

echo "1. MENSAJE DE BIENVENIDA:"
echo "   [ ] Mensaje completo en una sola respuesta"
echo "   [ ] Muestra pedidos pendientes si existen"
echo "   [ ] Saludo personalizado si es cliente conocido"
echo ""

echo "2. FLUJO DE PEDIDO:"
echo "   [ ] NO solicita email"
echo "   [ ] Solo pide: Empresa → Contacto → Teléfono → Dirección"
echo "   [ ] Va directo al pago después de dirección"
echo ""

echo "3. MENÚ PRINCIPAL:"
echo "   [ ] Muestra pedidos pendientes al inicio"
echo "   [ ] Opción 4 (reorden) solo si hay historial"
echo "   [ ] Formato correcto del menú"
echo ""

echo "4. CLIENTE RECURRENTE:"
echo "   [ ] Usa datos guardados del cliente"
echo "   [ ] No vuelve a pedir datos"
echo "   [ ] Va directo al pago"
echo ""

echo "5. REORDEN:"
echo "   [ ] Muestra pedidos anteriores"
echo "   [ ] Permite seleccionar y repetir"
echo "   [ ] Va directo al pago con datos guardados"
echo ""

echo -e "${BLUE}🧪 CASOS DE PRUEBA:${NC}"
echo ""

echo -e "${GREEN}CASO 1: Cliente Nuevo${NC}"
echo "1. Enviar: 'Hola'"
echo "   Esperar: Menú completo en un mensaje"
echo "2. Enviar: '1'"
echo "   Esperar: Catálogo"
echo "3. Enviar: '2'"
echo "   Esperar: Confirmación producto + pedir cantidad"
echo "4. Enviar: '10'"
echo "   Esperar: Resumen + confirmación"
echo "5. Enviar: 'SI'"
echo "   Esperar: Pedir empresa (NO EMAIL)"
echo ""

echo -e "${GREEN}CASO 2: Cliente con Pedido Pendiente${NC}"
echo "1. Crear un pedido pero no enviar comprobante"
echo "2. Enviar: 'Hola'"
echo "   Esperar: Ver pedido pendiente en el menú"
echo "3. Verificar formato del pedido pendiente"
echo ""

echo -e "${GREEN}CASO 3: Cliente Recurrente${NC}"
echo "1. Completar un pedido completo"
echo "2. Enviar: 'Hola' nuevamente"
echo "3. Enviar: '1' para nuevo pedido"
echo "4. Seleccionar producto y cantidad"
echo "5. Enviar: 'SI'"
echo "   Esperar: Debe ir directo al pago sin pedir datos"
echo ""

echo -e "${GREEN}CASO 4: Reorden${NC}"
echo "1. Cliente con pedidos anteriores"
echo "2. Enviar: 'Hola'"
echo "3. Enviar: '4'"
echo "   Esperar: Lista de pedidos anteriores"
echo "4. Enviar: '1'"
echo "   Esperar: Confirmación de reorden con pago directo"
echo ""

echo "==========================================="
echo ""
echo -e "${YELLOW}🚀 Para iniciar las pruebas:${NC}"
echo ""
echo "1. Ejecutar bot refactorizado:"
echo -e "${BLUE}   node app.js${NC}"
echo ""
echo "2. En otra terminal, ejecutar bot original para comparar:"
echo -e "${BLUE}   node bot-final.js${NC}"
echo ""
echo "3. Enviar mensajes de prueba y comparar respuestas"
echo ""
echo -e "${RED}⚠️ IMPORTANTE:${NC}"
echo "- Ambos bots deben comportarse EXACTAMENTE igual"
echo "- El mensaje de bienvenida debe ser uno solo"
echo "- NO debe pedir email en ningún momento"
echo "- Debe mostrar pedidos pendientes al inicio"
echo ""
