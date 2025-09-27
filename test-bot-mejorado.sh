#!/bin/bash

echo "☕ Probando bot localmente con soporte de imágenes..."

# Verificar si existe bot-mejorado.js
if [ ! -f "bot-mejorado.js" ]; then
    echo "❌ Error: No se encuentra bot-mejorado.js"
    exit 1
fi

# Verificar dependencias
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Ejecutar el bot mejorado
echo "🚀 Iniciando bot con soporte de imágenes..."
echo ""
echo "📸 El bot ahora puede:"
echo "   - Recibir imágenes de WhatsApp"
echo "   - Procesar comprobantes de pago"
echo "   - Guardar imágenes en carpeta 'uploads'"
echo ""

node bot-mejorado.js
