#!/bin/bash

# Script para corregir el problema de carga de pedidos desde Google Sheets
echo "🔧 Aplicando correcciones para cargar pedidos desde Google Sheets..."

# Hacer commit de los cambios
git add service-initializer.js google-sheets.js
git commit -m "Fix: Cargar pedidos existentes desde Google Sheets al iniciar

- Implementado carga de pedidos históricos al iniciar la aplicación
- Corregido método getAllOrders para buscar en hoja PedidosWhatsApp  
- Mejorado mapeo de userId desde columna T (Usuario WhatsApp)
- Agregado método saveOrder para compatibilidad
- Implementado método updateOrderStatus
- Los pedidos ahora se cargan correctamente en memoria al iniciar"

# Push a GitHub
echo "📤 Enviando cambios a GitHub..."
git push origin main

echo "✅ Cambios aplicados y enviados a GitHub"
echo "⏳ Heroku desplegará automáticamente los cambios en unos minutos"
echo ""
echo "📊 Resumen de cambios:"
echo "  - service-initializer.js: Añadida carga de pedidos desde Sheets"
echo "  - google-sheets.js: Corregida lectura de pedidos y userId"
echo ""
echo "🔍 Verifica en los logs de Heroku que aparezca:"
echo "  '📥 Cargando pedidos históricos desde Google Sheets...'"
echo "  '✅ X pedidos cargados'"
