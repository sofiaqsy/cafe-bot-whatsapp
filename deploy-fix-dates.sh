#!/bin/bash

# ========================================
# FIX PARA FECHAS "INVALID DATE"
# ========================================

echo "🔧 Desplegando corrección de fechas Invalid Date..."
echo "========================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No estás en el directorio del proyecto"
    exit 1
fi

echo "📝 PROBLEMAS CORREGIDOS:"
echo "  1. Fechas que mostraban 'Invalid Date' en historial"
echo "  2. Parseo correcto de fechas en formato DD/MM/YYYY"
echo "  3. Manejo robusto de diferentes formatos de fecha"
echo "  4. Fallback a 'Reciente' si no hay fecha válida"
echo ""

# Git add, commit y push
echo "📦 Preparando cambios para Heroku..."
git add order-handler.js state-manager.js
git commit -m "fix: Corregir Invalid Date en historial de pedidos - manejo robusto de fechas"

echo ""
echo "🚀 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando que se reinicie la aplicación (30 segundos)..."
sleep 30

echo ""
echo "📊 Verificando logs..."
heroku logs --tail -n 100 | grep -E "(fecha|timestamp|Invalid|Date|parseando)"

echo ""
echo "=========================================="
echo "✅ DESPLIEGUE COMPLETADO"
echo "=========================================="
echo ""
echo "🧪 PARA PROBAR:"
echo "  1. Envía 'menu' al bot"
echo "  2. Selecciona opción 4 (Volver a pedir)"
echo "  3. Verifica que las fechas se muestren correctamente"
echo ""
echo "📋 FORMATOS DE FECHA SOPORTADOS:"
echo "  ✅ DD/MM/YYYY (28/09/2025)"
echo "  ✅ YYYY-MM-DD (2025-09-28)"
echo "  ✅ Fecha ISO (2025-09-28T10:30:00)"
echo "  ✅ Fallback a 'Reciente' si no se reconoce"
echo ""
echo "📌 NOTA: Los pedidos antiguos sin fecha válida mostrarán 'Reciente'"
echo ""
