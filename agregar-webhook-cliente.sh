#!/bin/bash

# Script para agregar el webhook de clientes al bot de WhatsApp
echo "=========================================="
echo "🔧 AGREGAR WEBHOOK DE CLIENTES"
echo "=========================================="
echo ""

# Verificar directorio
if [ ! -f "app.js" ] && [ ! -f "package.json" ]; then
    echo "❌ Error: No estás en el directorio cafe-bot-local"
    echo "   cd /Users/keylacusi/Desktop/OPEN IA/cafe-bots/cafe-bot-local"
    exit 1
fi

echo "📋 Este script agregará:"
echo "   ✅ Nueva ruta /webhook-cliente"
echo "   ✅ Manejo de aprobación/rechazo de clientes"
echo "   ✅ Mensajes personalizados"
echo "   ✅ Envío automático de catálogo"
echo ""

# Verificar si ya existe webhook-estado.js
if [ ! -f "webhook-estado.js" ]; then
    echo "⚠️ No se encuentra webhook-estado.js"
    echo "   Primero necesitas tener configurado el webhook de pedidos"
    exit 1
fi

# Crear el archivo webhook-cliente.js si no existe
if [ ! -f "webhook-cliente.js" ]; then
    echo "📝 El archivo webhook-cliente.js ya fue creado"
    echo "   Procediendo con la integración..."
fi

# Buscar el archivo principal (app.js o index.js o bot.js)
MAIN_FILE=""
if [ -f "app.js" ]; then
    MAIN_FILE="app.js"
elif [ -f "index.js" ]; then
    MAIN_FILE="index.js"
elif [ -f "bot.js" ]; then
    MAIN_FILE="bot.js"
elif [ -f "server.js" ]; then
    MAIN_FILE="server.js"
else
    echo "❌ No se encontró archivo principal (app.js/index.js/bot.js)"
    exit 1
fi

echo "📄 Archivo principal encontrado: $MAIN_FILE"
echo ""

# Hacer backup del archivo principal
cp $MAIN_FILE ${MAIN_FILE}.backup-$(date +%Y%m%d-%H%M%S)

# Verificar si el webhook ya está registrado
if grep -q "webhook-cliente" $MAIN_FILE; then
    echo "✅ El webhook de clientes ya está registrado"
else
    echo "📝 Necesitas agregar estas líneas a tu archivo $MAIN_FILE:"
    echo ""
    echo "----------------------------------------"
    cat << 'EOF'
// Agregar después de tus otros requires/imports:
const webhookCliente = require('./webhook-cliente');

// Agregar después de app.use('/webhook-estado', ...):
app.use(webhookCliente);

// O si usas rutas específicas:
app.post('/webhook-cliente', webhookCliente);
EOF
    echo "----------------------------------------"
    echo ""
fi

# Verificar dependencias necesarias
echo "🔍 Verificando dependencias..."
if ! grep -q "twilio" package.json; then
    echo "⚠️ Twilio no está instalado. Instalando..."
    npm install twilio
fi

echo ""
echo "=========================================="
echo "📋 PASOS PARA COMPLETAR LA INTEGRACIÓN:"
echo "=========================================="
echo ""
echo "1. EDITAR $MAIN_FILE y agregar:"
echo "   const webhookCliente = require('./webhook-cliente');"
echo "   app.use(webhookCliente);"
echo ""
echo "2. VERIFICAR que webhook-cliente.js tenga tu función enviarMensajeWhatsApp"
echo ""
echo "3. HACER COMMIT Y DEPLOY:"
echo "   git add webhook-cliente.js $MAIN_FILE"
echo "   git commit -m 'feat: Agregar webhook para aprobación de clientes'"
echo "   git push heroku main"
echo ""
echo "4. VERIFICAR EN HEROKU:"
echo "   heroku logs --tail"
echo ""
echo "5. PROBAR DESDE GOOGLE SHEETS:"
echo "   Menú → Tests → Test Aprobación Cliente"
echo ""
echo "=========================================="

# Ofrecer edición automática si es app.js
if [ "$MAIN_FILE" = "app.js" ]; then
    echo ""
    read -p "¿Quieres que intente agregar el webhook automáticamente a $MAIN_FILE? (s/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        # Buscar dónde agregar el require
        if grep -q "require('./webhook-estado')" $MAIN_FILE; then
            # Agregar después del webhook-estado
            sed -i.tmp "/require('\.\/webhook-estado')/a\\
const webhookCliente = require('./webhook-cliente');" $MAIN_FILE
            
            # Buscar dónde registrar la ruta
            if grep -q "app.use.*webhook" $MAIN_FILE; then
                sed -i.tmp "/app.use.*webhook-estado/a\\
app.use(webhookCliente);" $MAIN_FILE
            fi
            
            echo "✅ Webhook agregado automáticamente a $MAIN_FILE"
            echo "   Por favor revisa el archivo para confirmar"
        else
            echo "⚠️ No se pudo agregar automáticamente"
            echo "   Por favor agrega manualmente las líneas mostradas arriba"
        fi
    fi
fi

echo ""
echo "✨ Script completado. Sigue los pasos indicados arriba."
