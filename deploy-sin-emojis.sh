#!/bin/bash

# ========================================
# DEPLOY - MENSAJES SIN EMOJIS
# ========================================

echo "🔧 Actualizando mensajes de notificación (sin emojis en el contenido)..."
echo ""

# Git add, commit y push
git add webhook-estado.js
git commit -m "style: Quitar emojis del contenido de las notificaciones, mantener solo en títulos"

echo "🚀 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando 20 segundos..."
sleep 20

echo ""
echo "✅ Listo!"
echo ""
echo "📝 CAMBIOS APLICADOS:"
echo ""
echo "ANTES:"
echo "  📦 Producto: Café Premium"
echo "  ⏱️ Tiempo estimado: 20 minutos"
echo "  ¡Gracias! ☕"
echo ""
echo "AHORA:"
echo "  Producto: Café Premium"
echo "  Tiempo estimado: 20 minutos"
echo "  Gracias!"
echo ""
echo "Los títulos mantienen sus emojis: ✅ PAGO CONFIRMADO"
echo ""
echo "🧪 Prueba cambiando el estado de un pedido en Google Sheets"
echo ""
