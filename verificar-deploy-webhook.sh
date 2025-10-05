#!/bin/bash

# Script de verificación y deployment del webhook con logs
echo "=========================================="
echo "🚀 VERIFICACIÓN Y DEPLOYMENT DE WEBHOOK-CLIENTE"
echo "=========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar directorio
cd /Users/keylacusi/Desktop/OPEN IA/cafe-bots/cafe-bot-local 2>/dev/null
if [ ! -f "app.js" ]; then
    echo -e "${RED}❌ Error: No estás en el directorio correcto${NC}"
    exit 1
fi

echo "📋 PASO 1: Verificación de archivos locales"
echo "----------------------------------------"

# Verificar webhook-cliente.js
if [ -f "webhook-cliente.js" ]; then
    echo -e "${GREEN}✅ webhook-cliente.js existe${NC}"
    echo "   Últimas líneas con logs:"
    grep -n "console.log" webhook-cliente.js | tail -5
else
    echo -e "${RED}❌ webhook-cliente.js NO existe${NC}"
    exit 1
fi

echo ""
echo "📋 PASO 2: Verificación en app.js"
echo "----------------------------------------"

# Verificar si está importado en app.js
if grep -q "require.*webhook-cliente" app.js; then
    echo -e "${GREEN}✅ webhook-cliente está importado en app.js${NC}"
    grep -n "webhook-cliente" app.js
else
    echo -e "${YELLOW}⚠️ webhook-cliente NO está importado en app.js${NC}"
    echo "   Agregándolo ahora..."
    
    # Hacer backup
    cp app.js app.js.backup-$(date +%Y%m%d-%H%M%S)
    
    # Agregar después de webhookEstado
    sed -i '' "/const webhookEstado = require('.\/webhook-estado');/a\\
const webhookCliente = require('./webhook-cliente');" app.js
    
    sed -i '' "/app.use('\/', webhookEstado);/a\\
app.use('/', webhookCliente); \/\/ Webhook de clientes" app.js
    
    echo -e "${GREEN}✅ Agregado a app.js${NC}"
fi

echo ""
echo "📋 PASO 3: Verificar estado en Heroku"
echo "----------------------------------------"

# Test remoto del endpoint
echo "🌐 Probando endpoint remoto..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://cafe-bot-whatsapp-ad7ab21dc0a8.herokuapp.com/webhook-cliente/test)

if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ El endpoint YA ESTÁ ACTIVO en Heroku (HTTP $RESPONSE)${NC}"
    echo "   Verificando respuesta..."
    curl -s https://cafe-bot-whatsapp-ad7ab21dc0a8.herokuapp.com/webhook-cliente/test | python -m json.tool
    echo ""
    echo -e "${YELLOW}⚠️ El webhook ya está desplegado. ¿Quieres re-desplegar con los nuevos logs? (s/n):${NC}"
    read -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "✅ No se requiere re-deployment"
        echo ""
        echo "📊 Mostrando logs recientes de Heroku..."
        heroku logs --tail -n 30 | grep -E "(webhook-cliente|WEBHOOK-CLIENTE)" || echo "No hay logs recientes del webhook"
        exit 0
    fi
else
    echo -e "${YELLOW}⚠️ El endpoint NO está activo (HTTP $RESPONSE)${NC}"
    echo "   Necesita deployment"
fi

echo ""
echo "📋 PASO 4: Preparar deployment"
echo "----------------------------------------"

# Verificar cambios
git status --short webhook-cliente.js app.js

echo ""
echo -e "${YELLOW}¿Proceder con el deployment? (s/n):${NC}"
read -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Deployment cancelado"
    exit 1
fi

echo ""
echo "📋 PASO 5: Git commit"
echo "----------------------------------------"

git add webhook-cliente.js app.js
git commit -m "feat: Agregar logs detallados a webhook-cliente

- Logs de inicialización del módulo
- Logs de cada solicitud recibida
- Logs del proceso de envío
- Logs para debugging en Heroku"

echo ""
echo "📋 PASO 6: Deploy a Heroku"
echo "----------------------------------------"

git push heroku main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ DEPLOYMENT EXITOSO${NC}"
    echo ""
    
    # Esperar que Heroku reinicie
    echo "⏳ Esperando que Heroku reinicie (20 segundos)..."
    for i in {20..1}; do
        echo -ne "\r   $i segundos restantes..."
        sleep 1
    done
    echo ""
    
    # Verificar que el endpoint esté activo
    echo ""
    echo "🧪 Verificando endpoint..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://cafe-bot-whatsapp-ad7ab21dc0a8.herokuapp.com/webhook-cliente/test)
    
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ Endpoint activo y funcionando (HTTP $RESPONSE)${NC}"
        curl -s https://cafe-bot-whatsapp-ad7ab21dc0a8.herokuapp.com/webhook-cliente/test | python -m json.tool
    else
        echo -e "${RED}❌ El endpoint no responde correctamente (HTTP $RESPONSE)${NC}"
        echo "   Verificando logs..."
    fi
    
    echo ""
    echo "📊 Logs de inicialización del webhook:"
    echo "----------------------------------------"
    heroku logs --tail -n 50 | grep -E "(webhook-cliente|WEBHOOK-CLIENTE)" || echo "No se encontraron logs del webhook"
    
    echo ""
    echo "=========================================="
    echo "📋 PRÓXIMOS PASOS:"
    echo "=========================================="
    echo ""
    echo "1. Verifica los logs en tiempo real:"
    echo "   ${YELLOW}heroku logs --tail | grep WEBHOOK-CLIENTE${NC}"
    echo ""
    echo "2. Prueba desde Google Sheets:"
    echo "   - Menú → Tests → Test Aprobación Cliente"
    echo ""
    echo "3. Monitorea los logs durante la prueba:"
    echo "   ${YELLOW}heroku logs --tail${NC}"
    echo ""
    echo "4. Si hay errores, busca:"
    echo "   - [WEBHOOK-CLIENTE] para logs del módulo"
    echo "   - [SEND] para logs de envío"
    echo "   - [ERROR] para errores"
    
else
    echo ""
    echo -e "${RED}❌ Error en deployment${NC}"
    echo ""
    echo "Verificando el error..."
    heroku logs --tail -n 30 | grep -i error
    echo ""
    echo "Intenta estos comandos para debug:"
    echo "  heroku logs --tail"
    echo "  heroku ps"
    echo "  heroku restart"
fi
