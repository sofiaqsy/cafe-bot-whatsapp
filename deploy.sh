#!/bin/bash
# Script de despliegue para los cambios de cliente WhatsApp

echo "========================================="
echo "DESPLEGANDO FIX DE CLIENTE WHATSAPP"
echo "========================================="
echo ""

# Ir al directorio del proyecto
cd "/Users/keylacusi/Desktop/OPEN IA/cafe-bots/cafe-bot-local"

# Mostrar estado de git
echo "📊 Estado actual de Git:"
git status --short
echo ""

# Agregar cambios
echo "📦 Agregando cambios..."
git add google-sheets.js order-handler.js test-cliente-fix.js test-fix.sh deploy.sh

# Crear commit
echo "💾 Creando commit..."
git commit -m "fix: Guardar WhatsApp completo y reutilizar datos de clientes existentes

- Modificado google-sheets.js para guardar WhatsApp en formato completo (whatsapp:+51...)
- Actualizado buscarCliente() para buscar con el formato completo
- Modificado order-handler.js para buscar clientes existentes antes de pedir datos
- Agregado flujo de confirmación de datos para clientes existentes
- Los clientes existentes ven sus datos y pueden confirmarlos o cambiarlos
- Creado script de prueba test-cliente-fix.js

Resuelve:
1. WhatsApp se guarda correctamente en la columna B de la hoja Clientes
2. No se vuelven a pedir datos a clientes que ya existen"

echo ""
echo "🚀 Haciendo push a GitHub..."
git push origin main

echo ""
echo "☁️ Desplegando a Heroku..."
git push heroku main

echo ""
echo "========================================="
echo "DESPLIEGUE COMPLETADO"
echo "========================================="
echo ""
echo "✅ Cambios desplegados exitosamente"
echo ""
echo "Para ver los logs de Heroku:"
echo "  heroku logs --tail -a cafe-bot-whatsapp-ad7ab21dc0a8"
echo ""
echo "Cambios implementados:"
echo "1. WhatsApp se guarda en formato completo (whatsapp:+51936934501)"
echo "2. Búsqueda de clientes funciona con el formato completo"
echo "3. Clientes existentes ven sus datos y pueden confirmarlos"
echo "4. No se piden datos repetidos a clientes conocidos"
