#!/bin/bash

# ========================================
# DEPLOY PARA CORREGIR URL DE COMPROBANTES
# ========================================

echo "🚀 Desplegando corrección de URLs de comprobantes..."
echo "========================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No estás en el directorio del proyecto"
    exit 1
fi

echo "📝 CAMBIOS IMPLEMENTADOS:"
echo "  1. La URL de Google Drive ahora se guarda en Sheets"
echo "  2. Las notificaciones ahora incluyen la URL de Drive"
echo "  3. Los comprobantes pendientes también usan URL de Drive"
echo ""

# Git add, commit y push
echo "📦 Preparando cambios para Heroku..."
git add order-handler.js google-sheets.js
git commit -m "fix: Usar URL de Google Drive en Sheets y notificaciones en lugar de URL de Twilio"

echo ""
echo "🚀 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando que se reinicie la aplicación..."
sleep 15

echo ""
echo "📊 Verificando logs..."
heroku logs --tail -n 50 | grep -E "(Drive|Sheets|URL|comprobante)"

echo ""
echo "✅ DESPLIEGUE COMPLETADO"
echo ""
echo "🧪 PRUEBA EL FIX:"
echo "  1. Envía un pedido con comprobante"
echo "  2. Verifica en Google Sheets que la URL sea de Drive"
echo "  3. Verifica que la notificación tenga la URL de Drive"
echo ""
echo "📋 URLS ESPERADAS:"
echo "  ❌ Antes: https://api.twilio.com/..."
echo "  ✅ Ahora: https://drive.google.com/file/d/..."
echo ""
