#!/bin/bash

# Script para corregir problemas de visualización en el menú
echo "🔧 Corrigiendo problemas de visualización del menú..."
echo ""

# Ejecutar el script Python
python3 fix-obtener-menu.py

echo ""
echo "📋 Cambios realizados:"
echo "  ✅ Corregido [object Object] -> ahora muestra el nombre del producto"
echo "  ✅ Corregido 'Hace NaN días' -> ahora calcula el tiempo correctamente"
echo "  ✅ Eliminados emojis del encabezado del menú"
echo ""

# Verificar estado de git
echo "📊 Archivos modificados:"
git status --short
echo ""

# Preguntar si continuar
read -p "¿Deseas hacer commit y push de estos cambios? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]
then
    # Hacer commit
    git add order-handler.js
    git commit -m "Fix: Corregir visualización de productos y tiempo en el menú

- Corregido [object Object]: ahora muestra correctamente el nombre del producto
- Corregido 'Hace NaN días': cálculo de tiempo mejorado y seguro
- Eliminados emojis del encabezado para aspecto más profesional
- Manejo robusto de fechas inválidas o faltantes"

    # Push
    echo ""
    echo "📤 Enviando a GitHub..."
    git push origin main
    
    echo ""
    echo "✅ ¡Correcciones aplicadas exitosamente!"
    echo ""
    echo "⏰ Heroku desplegará en 2-3 minutos"
    echo ""
    echo "📋 Resultado esperado al enviar 'Menu':"
    echo ""
    echo "TUS PEDIDOS ACTIVOS:"
    echo "━━━━━━━━━━━━━━━━━"
    echo ""
    echo "CAF-838522"
    echo "Café Premium"
    echo "5kg - S/250.00"
    echo "Estado: En camino"
    echo "Hace 2 horas"
    echo ""
    echo "MENÚ PRINCIPAL"
    echo ""
    echo "1 - Ver catálogo y pedir"
    echo "2 - Consultar pedido"
    echo "3 - Información del negocio"
    echo "4 - Volver a pedir"
else
    echo "❌ Operación cancelada"
fi
