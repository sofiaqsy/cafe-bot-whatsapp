#!/bin/bash

# Script para aplicar correcciones y verificar el estado
echo "🔧 Verificando y aplicando correcciones del bot..."
echo ""

# Verificar estado de git
echo "📊 Estado actual de git:"
git status
echo ""

# Mostrar los archivos modificados
echo "📝 Archivos modificados:"
echo "  - service-initializer.js"
echo "  - google-sheets.js"
echo ""

# Preguntar si continuar
read -p "¿Deseas hacer commit y push de estos cambios? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]
then
    # Hacer commit
    git add service-initializer.js google-sheets.js
    git commit -m "Fix: Cargar pedidos existentes desde Google Sheets al iniciar

- Implementado carga de pedidos históricos al iniciar la aplicación
- Corregido método getAllOrders para buscar en hoja PedidosWhatsApp  
- Mejorado mapeo de userId desde columna T (Usuario WhatsApp)
- Agregado método saveOrder para compatibilidad
- Implementado método updateOrderStatus
- Los pedidos ahora se cargan correctamente en memoria al iniciar"

    # Push
    echo ""
    echo "📤 Enviando a GitHub..."
    git push origin main
    
    echo ""
    echo "✅ ¡Cambios aplicados exitosamente!"
    echo ""
    echo "⏰ Heroku desplegará automáticamente en 2-3 minutos"
    echo ""
    echo "📋 Para verificar que funciona correctamente:"
    echo "1. Espera 3 minutos para que Heroku despliegue"
    echo "2. Revisa los logs con: heroku logs --tail"
    echo "3. Busca estas líneas en los logs:"
    echo "   📥 Cargando pedidos históricos desde Google Sheets..."
    echo "   ✅ X pedidos cargados"
    echo "   📦 Y pendientes"
    echo ""
    echo "4. Prueba enviando 'Menu' al bot"
    echo "   Deberías ver tus pedidos pendientes al inicio"
else
    echo "❌ Operación cancelada"
fi
