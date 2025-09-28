#!/bin/bash

# ========================================
# DEPLOY: FLUJO MEJORADO POST-PEDIDO
# ========================================

echo "🔄 Desplegando mejora de flujo post-pedido..."
echo "========================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No estás en el directorio del proyecto"
    exit 1
fi

echo "📝 MEJORAS IMPLEMENTADAS:"
echo "  1. Después de completar un pedido, cualquier mensaje lleva al menú"
echo "  2. Ya no es necesario escribir 'menu' específicamente"
echo "  3. Flujo más natural y sin fricción"
echo "  4. Menos confusión para el usuario"
echo ""
echo "🎯 BENEFICIOS:"
echo "  ✅ Más intuitivo - no hay que memorizar comandos"
echo "  ✅ Flujo continuo - siempre vuelve al menú"
echo "  ✅ Menos errores - cualquier texto funciona"
echo ""

# Git add, commit y push
echo "📦 Preparando cambios para Heroku..."
git add order-handler.js
git commit -m "feat: Cualquier mensaje después de completar pedido lleva al menú - flujo más intuitivo"

echo ""
echo "🚀 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando que se reinicie la aplicación (20 segundos)..."
sleep 20

echo ""
echo "📊 Verificando logs..."
heroku logs --tail -n 50 | grep -E "(pedido_completado|menu|estado)"

echo ""
echo "=========================================="
echo "✅ DESPLIEGUE COMPLETADO"
echo "=========================================="
echo ""
echo "🧪 PARA PROBAR:"
echo "  1. Completa un pedido hasta el final"
echo "  2. Cuando veas 'Escribe cualquier mensaje para volver al menú'"
echo "  3. Escribe lo que quieras: 'hola', '1', 'xyz', etc."
echo "  4. Verifica que te lleve al menú principal"
echo ""
echo "📱 NUEVOS MENSAJES FINALES:"
echo ""
echo "  Después de confirmar pedido:"
echo "  '_Escribe cualquier mensaje para volver al menú_'"
echo ""
echo "  En lugar de:"
echo "  '_Escribe *menu* para realizar otro pedido_'"
echo ""
echo "✨ Experiencia más fluida y natural!"
echo ""
