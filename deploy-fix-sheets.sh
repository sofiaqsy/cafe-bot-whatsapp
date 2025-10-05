#!/bin/bash

# ========================================
# FIX DEPLOY - CORREGIR ERROR SHEETS-SERVICE
# ========================================

echo "🔧 Corrigiendo error de sheets-service..."
echo ""

# Git add y commit
git add cafe-gratis-handler.js
git commit -m "fix: Comentar sheets-service temporalmente para evitar error de módulo"

# Push a Heroku
echo "🚀 Enviando fix a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando 20 segundos..."
sleep 20

echo ""
echo "✅ Listo! El bot debería estar funcionando ahora."
echo ""
echo "📝 NOTA: La integración con Google Sheets está temporalmente deshabilitada."
echo "Los pedidos se guardan solo en memoria por ahora."
echo ""
echo "🔗 LINK DE LA CAMPAÑA:"
echo "https://wa.me/51936934501?text=CAFEGRATUITO"
echo ""
echo "Prueba el link ahora que debería funcionar!"
echo ""
