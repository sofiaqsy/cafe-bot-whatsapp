#!/bin/bash

# Script para diagnosticar y corregir el problema del webhook-cliente
echo "=========================================="
echo "🔍 DIAGNÓSTICO: Webhook-Cliente NO se está cargando"
echo "=========================================="
echo ""

cd /Users/keylacusi/Desktop/OPEN IA/cafe-bots/cafe-bot-local 2>/dev/null

echo "📋 PASO 1: Verificar app.js localmente"
echo "----------------------------------------"

# Verificar si webhook-cliente está importado
if grep -q "webhook-cliente" app.js; then
    echo "✅ webhook-cliente está en app.js:"
    grep -n "webhook-cliente" app.js
else
    echo "❌ webhook-cliente NO está en app.js"
    echo ""
    echo "📝 Agregándolo ahora..."
    
    # Hacer backup
    cp app.js app.js.backup-$(date +%Y%m%d-%H%M%S)
    
    # Buscar dónde agregar el require - después de webhook-estado
    LINE_NUM=$(grep -n "const webhookEstado = require" app.js | cut -d: -f1)
    
    if [ ! -z "$LINE_NUM" ]; then
        # Insertar después de webhookEstado
        sed -i '' "${LINE_NUM}a\\
const webhookCliente = require('./webhook-cliente');" app.js
        
        # Buscar dónde agregar el app.use
        USE_LINE=$(grep -n "app.use.*webhookEstado" app.js | cut -d: -f1)
        
        if [ ! -z "$USE_LINE" ]; then
            sed -i '' "${USE_LINE}a\\
app.use('/', webhookCliente); \/\/ Webhook de clientes" app.js
            echo "✅ Agregado correctamente"
        else
            echo "⚠️ No se encontró dónde agregar app.use"
        fi
    else
        echo "⚠️ No se encontró webhookEstado, agregando al final de los requires..."
        # Buscar la última línea de require
        LAST_REQUIRE=$(grep -n "^const.*require" app.js | tail -1 | cut -d: -f1)
        sed -i '' "${LAST_REQUIRE}a\\
const webhookCliente = require('./webhook-cliente');" app.js
        
        # Agregar el app.use después del último app.use existente
        LAST_USE=$(grep -n "^app.use" app.js | tail -1 | cut -d: -f1)
        sed -i '' "${LAST_USE}a\\
app.use('/', webhookCliente); \/\/ Webhook de clientes" app.js
    fi
fi

echo ""
echo "📋 PASO 2: Mostrar las líneas agregadas"
echo "----------------------------------------"
echo "Líneas con 'webhook' en app.js:"
grep --color=always -n "webhook" app.js | head -20

echo ""
echo "📋 PASO 3: Verificar webhook-cliente.js"
echo "----------------------------------------"
if [ -f "webhook-cliente.js" ]; then
    echo "✅ webhook-cliente.js existe"
    echo "Primeras líneas del archivo:"
    head -10 webhook-cliente.js
else
    echo "❌ webhook-cliente.js NO existe!"
    exit 1
fi

echo ""
echo "📋 PASO 4: Verificar estado de Git"
echo "----------------------------------------"
git status --short app.js webhook-cliente.js

echo ""
echo "=========================================="
echo "📝 ACCIONES REQUERIDAS:"
echo "=========================================="
echo ""
echo "1. Ejecuta estos comandos:"
echo ""
echo "   git add app.js webhook-cliente.js"
echo "   git commit -m \"fix: Agregar webhook-cliente que faltaba en app.js\""
echo "   git push heroku main"
echo ""
echo "2. Después del deploy, verifica con:"
echo ""
echo "   heroku logs --tail | grep -E '(WEBHOOK-CLIENTE|webhook-cliente)'"
echo ""
echo "3. Deberías ver estos logs al iniciar:"
echo "   🔧 [WEBHOOK-CLIENTE] Módulo cargado..."
echo "   ✅ [WEBHOOK-CLIENTE] MessageService importado..."
echo "   📍 [WEBHOOK-CLIENTE] Registrando ruta POST /webhook-cliente"
echo ""
echo "4. Prueba el endpoint:"
echo ""
echo "   curl https://cafe-bot-whatsapp-ad7ab21dc0a8.herokuapp.com/webhook-cliente/test"
echo ""

# Ofrecer hacer el deployment automático
echo "=========================================="
echo ""
read -p "¿Quieres que haga el deployment automáticamente? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo ""
    echo "🚀 Iniciando deployment automático..."
    echo ""
    
    git add app.js webhook-cliente.js
    git commit -m "fix: Agregar webhook-cliente que faltaba en app.js

- Importar módulo webhook-cliente
- Registrar ruta /webhook-cliente
- Corregir error 404 en endpoint"
    
    git push heroku main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deploy exitoso!"
        echo ""
        echo "⏳ Esperando que Heroku reinicie (20 segundos)..."
        sleep 20
        
        echo ""
        echo "🔍 Buscando logs del webhook-cliente..."
        heroku logs -n 100 | grep -E "(WEBHOOK-CLIENTE|webhook-cliente)" || echo "No se encontraron logs aún"
        
        echo ""
        echo "🧪 Probando endpoint..."
        curl -s https://cafe-bot-whatsapp-ad7ab21dc0a8.herokuapp.com/webhook-cliente/test | python -m json.tool || echo "Error al probar endpoint"
    else
        echo "❌ Error en deployment"
    fi
fi
