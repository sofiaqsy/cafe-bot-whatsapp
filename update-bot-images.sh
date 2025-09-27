#!/bin/bash

# Script para actualizar bot-pro.js con soporte de imágenes
# Mantiene toda la funcionalidad existente y agrega manejo de comprobantes

echo "🔄 Actualizando bot-pro.js con soporte de imágenes..."

# Verificar que existan los archivos necesarios
if [ ! -f "image-handler.js" ]; then
    echo "❌ Error: No se encuentra image-handler.js"
    exit 1
fi

if [ ! -f "payment-handler.js" ]; then
    echo "❌ Error: No se encuentra payment-handler.js"
    exit 1
fi

if [ ! -f "bot-pro.js" ]; then
    echo "❌ Error: No se encuentra bot-pro.js"
    exit 1
fi

# Crear backup
echo "📦 Creando backup de bot-pro.js..."
cp bot-pro.js bot-pro-backup-$(date +%Y%m%d-%H%M%S).js

echo "✅ Archivos listos para actualización"
echo ""
echo "📋 INSTRUCCIONES MANUALES:"
echo "=========================="
echo ""
echo "1. El webhook ya está actualizado para recibir MediaUrl"
echo "2. image-handler.js maneja la descarga de imágenes"
echo "3. payment-handler.js contiene la lógica de pagos"
echo ""
echo "Para completar la integración, agrega esto en bot-pro.js:"
echo ""
echo "   - Importar payment-handler al inicio:"
echo "     const paymentHandler = require('./payment-handler');"
echo ""
echo "   - En la función manejarMensaje, agregar parámetro mediaUrl:"
echo "     async function manejarMensaje(from, body, mediaUrl = null)"
echo ""
echo "   - Agregar casos para manejar imágenes en el switch principal"
echo ""
echo "🚀 Para probar localmente:"
echo "   node bot-pro.js"
echo ""
echo "📤 Para subir a Heroku:"
echo "   git add ."
echo "   git commit -m 'Agregar soporte de imágenes para comprobantes'"
echo "   git push heroku main"
echo ""
echo "✅ Script completado"
