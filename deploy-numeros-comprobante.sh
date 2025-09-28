#!/bin/bash

# ========================================
# DEPLOY: NÚMEROS EN OPCIONES DE COMPROBANTE
# ========================================

echo "🔢 Desplegando mejora de opciones con números..."
echo "========================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No estás en el directorio del proyecto"
    exit 1
fi

echo "📝 CAMBIOS IMPLEMENTADOS:"
echo "  1. Las opciones ahora usan números (1, 2, 3)"
echo "  2. Mantiene compatibilidad con palabras"
echo "  3. Interfaz más consistente y fácil de usar"
echo ""
echo "📋 NUEVAS OPCIONES:"
echo "  1 = Enviar comprobante más tarde"
echo "  2 = Cancelar el pedido"
echo "  3 = Ya hice la transferencia"
echo ""

# Git add, commit y push
echo "📦 Preparando cambios para Heroku..."
git add order-handler.js
git commit -m "feat: Usar números en opciones de comprobante para mayor facilidad de uso"

echo ""
echo "🚀 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando que se reinicie la aplicación (20 segundos)..."
sleep 20

echo ""
echo "📊 Verificando logs..."
heroku logs --tail -n 50 | grep -E "(esperando_comprobante|opción|mensaje)"

echo ""
echo "=========================================="
echo "✅ DESPLIEGUE COMPLETADO"
echo "=========================================="
echo ""
echo "🧪 PARA PROBAR:"
echo "  1. Haz un pedido hasta llegar al comprobante"
echo "  2. Verifica el nuevo mensaje con números"
echo "  3. Prueba escribir '1' para enviar después"
echo "  4. Prueba escribir '2' para cancelar"
echo "  5. Prueba escribir '3' si ya pagaste"
echo ""
echo "📱 NUEVO MENSAJE:"
echo "  Por favor, elige una opción:"
echo ""
echo "  📸 *Envía la foto del comprobante*"
echo ""
echo "  *O escribe el número:*"
echo "  *1* - Enviar comprobante más tarde (24 horas)"
echo "  *2* - Cancelar el pedido"
echo "  *3* - Si ya hiciste la transferencia"
echo ""
echo "✨ Más fácil, más rápido, más intuitivo!"
echo ""
