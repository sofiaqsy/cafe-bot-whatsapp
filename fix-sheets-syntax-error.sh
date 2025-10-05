#!/bin/bash

# Script para corregir el error de sintaxis en sheets-service.js y desplegar a Heroku
# Error: SyntaxError: Unexpected token '.' en línea 94

echo "========================================"
echo "🔧 FIX: Error de sintaxis en sheets-service.js"
echo "========================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "sheets-service.js" ]; then
    echo "❌ Error: No se encontró sheets-service.js"
    echo "   Asegúrate de ejecutar este script desde cafe-bot-local/"
    exit 1
fi

# Hacer backup del archivo actual
echo "📋 Creando backup del archivo actual..."
cp sheets-service.js sheets-service.js.backup-$(date +%Y%m%d-%H%M%S)

# Verificar si ya fue corregido
if grep -q "datosCliente.ciudad || 'Lima'," sheets-service.js; then
    echo "❌ El archivo aún contiene el error de sintaxis"
    echo "✅ La corrección ya fue aplicada en el archivo local"
    echo ""
else
    echo "✅ El archivo ya está corregido localmente"
fi

# Confirmar antes de continuar
echo ""
echo "📦 Este script va a:"
echo "   1. Hacer commit del fix"
echo "   2. Push a Heroku"
echo "   3. Ver los logs"
echo ""
read -p "¿Deseas continuar? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operación cancelada"
    exit 1
fi

# Git operations
echo ""
echo "📝 Agregando cambios a git..."
git add sheets-service.js

echo "💾 Creando commit..."
git commit -m "Fix: Corregir error de sintaxis en sheets-service.js línea 94

- Eliminar líneas duplicadas y mal formateadas (93-100)
- Mantener solo una llamada a sheets.spreadsheets.values.append
- El error causaba: SyntaxError: Unexpected token '.'"

echo ""
echo "🚀 Desplegando a Heroku..."
git push heroku main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Despliegue exitoso!"
    echo ""
    echo "📊 Mostrando logs de Heroku..."
    heroku logs --tail -n 50
else
    echo ""
    echo "❌ Error en el despliegue"
    echo "   Ejecuta: heroku logs --tail"
    echo "   Para ver más detalles"
fi

echo ""
echo "========================================"
echo "🎯 Para verificar el estado:"
echo "   heroku ps"
echo "   heroku logs --tail"
echo "========================================"
