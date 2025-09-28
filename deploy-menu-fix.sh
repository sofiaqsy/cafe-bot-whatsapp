#!/bin/bash

# Script para aplicar correcciones finales
echo "🔧 Aplicando correcciones finales del bot..."
echo ""

# Mostrar resumen de cambios
echo "📋 Cambios realizados:"
echo "  ✅ Los pedidos activos ahora se muestran correctamente en el menú"
echo "  ✅ Se muestran TODOS los pedidos activos (no solo pendientes)"
echo "  ✅ Se incluye el estado actual del pedido (En camino, En preparación, etc.)"
echo "  ✅ Se quitaron los emojis de las opciones del menú para un aspecto más profesional"
echo ""

# Verificar estado de git
echo "📊 Estado actual de git:"
git status --short
echo ""

# Preguntar si continuar
read -p "¿Deseas hacer commit y push de estos cambios? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]
then
    # Hacer commit
    git add order-handler.js
    git commit -m "Fix: Mostrar pedidos activos correctamente en el menú

- Los pedidos activos ahora se muestran al entrar al menú
- Se muestran TODOS los pedidos activos (En camino, En preparación, etc.)
- Se incluye el estado actual de cada pedido con íconos descriptivos
- Se quitaron los emojis de las opciones del menú principal
- Mejorada la lógica para filtrar pedidos completados/cancelados"

    # Push
    echo ""
    echo "📤 Enviando a GitHub..."
    git push origin main
    
    echo ""
    echo "✅ ¡Cambios aplicados exitosamente!"
    echo ""
    echo "⏰ Heroku desplegará automáticamente en 2-3 minutos"
    echo ""
    echo "📋 Para verificar que funciona:"
    echo "1. Espera 3 minutos para el despliegue"
    echo "2. Envía 'Menu' al bot"
    echo "3. Deberías ver tus pedidos activos así:"
    echo ""
    echo "   📦 TUS PEDIDOS ACTIVOS:"
    echo "   ━━━━━━━━━━━━━━━━━"
    echo "   🚚 CAF-838522"
    echo "      Café Premium"
    echo "      10kg - S/500.00"
    echo "      Estado: En camino"
    echo "      ⏱️ Hace 2 horas"
    echo ""
    echo "   📱 MENÚ PRINCIPAL"
    echo "   1 - Ver catálogo y pedir"
    echo "   2 - Consultar pedido"
    echo "   3 - Información del negocio"
    echo ""
else
    echo "❌ Operación cancelada"
fi
