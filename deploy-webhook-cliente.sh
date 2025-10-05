#!/bin/bash

# Script de deployment rápido para agregar webhook de clientes
echo "=========================================="
echo "🚀 DEPLOY: Webhook de Aprobación de Clientes"
echo "=========================================="
echo ""

# Verificar directorio
if [ ! -f "app.js" ]; then
    echo "❌ Error: No estás en cafe-bot-local"
    cd /Users/keylacusi/Desktop/OPEN IA/cafe-bots/cafe-bot-local 2>/dev/null
    if [ ! -f "app.js" ]; then
        echo "   No se pudo encontrar el directorio"
        exit 1
    fi
    echo "✅ Cambiado al directorio correcto"
fi

# Paso 1: Verificar que webhook-cliente.js existe
if [ ! -f "webhook-cliente.js" ]; then
    echo "❌ webhook-cliente.js no existe"
    exit 1
fi
echo "✅ webhook-cliente.js encontrado"

# Paso 2: Modificar app.js si no está modificado
if ! grep -q "webhook-cliente" app.js; then
    echo "📝 Agregando webhook-cliente a app.js..."
    
    # Hacer backup
    cp app.js app.js.backup-$(date +%Y%m%d-%H%M%S)
    
    # Agregar el require después de webhook-estado
    sed -i '' "/const webhookEstado = require('.\/webhook-estado');/a\\
const webhookCliente = require('./webhook-cliente');" app.js
    
    # Agregar la ruta después de webhookEstado
    sed -i '' "/app.use('\/', webhookEstado);/a\\
app.use('/', webhookCliente); \/\/ Webhook de clientes" app.js
    
    echo "✅ app.js modificado"
else
    echo "✅ webhook-cliente ya está en app.js"
fi

# Paso 3: Verificar los cambios
echo ""
echo "📋 Verificando cambios en app.js:"
echo "----------------------------------------"
grep -A1 -B1 "webhook" app.js | head -20
echo "----------------------------------------"
echo ""

# Paso 4: Git add y commit
echo "📝 Preparando commit..."
git add webhook-cliente.js app.js
git status --short

echo ""
read -p "¿Los cambios se ven correctos? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Deployment cancelado"
    echo "   Puedes revisar los archivos manualmente"
    exit 1
fi

# Paso 5: Commit
echo "💾 Haciendo commit..."
git commit -m "feat: Agregar webhook para aprobación de clientes

- Nueva ruta /webhook-cliente
- Maneja estados: Verificado y Rechazado
- Envía mensajes personalizados
- Envía catálogo automático a clientes verificados"

# Paso 6: Push a Heroku
echo ""
echo "🚀 Desplegando a Heroku..."
git push heroku main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT EXITOSO!"
    echo ""
    
    # Esperar que se reinicie
    echo "⏳ Esperando que Heroku reinicie (15 segundos)..."
    sleep 15
    
    # Test del endpoint
    echo "🧪 Probando endpoint..."
    curl -s https://cafe-bot-whatsapp-ad7ab21dc0a8.herokuapp.com/webhook-cliente/test | python -m json.tool
    
    echo ""
    echo "📊 Mostrando logs recientes..."
    heroku logs --tail -n 20 | grep -E "(webhook-cliente|aprobacion_cliente)"
    
    echo ""
    echo "=========================================="
    echo "✅ WEBHOOK DE CLIENTES ACTIVO"
    echo "=========================================="
    echo ""
    echo "📋 Para probar:"
    echo "   1. Ve a Google Sheets"
    echo "   2. Menú → Tests → Test Aprobación Cliente"
    echo "   3. Revisa los logs: heroku logs --tail"
    echo ""
    echo "🔗 URLs configuradas:"
    echo "   Pedidos:  /webhook-estado"
    echo "   Clientes: /webhook-cliente"
    echo ""
else
    echo ""
    echo "❌ Error en deployment"
    echo "   Revisa los logs: heroku logs --tail"
    echo ""
    echo "💡 Solución manual:"
    echo "   1. Edita app.js manualmente"
    echo "   2. Agrega: const webhookCliente = require('./webhook-cliente');"
    echo "   3. Agrega: app.use('/', webhookCliente);"
    echo "   4. git add -A && git commit -m 'Add webhook-cliente'"
    echo "   5. git push heroku main"
fi
