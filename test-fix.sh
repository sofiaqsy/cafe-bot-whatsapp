#!/bin/bash
# Script para probar los cambios antes de hacer commit

echo "========================================="
echo "VERIFICANDO CAMBIOS EN CLIENTE WHATSAPP"
echo "========================================="
echo ""

# Ir al directorio del proyecto
cd "/Users/keylacusi/Desktop/OPEN IA/cafe-bots/cafe-bot-local"

# Ejecutar prueba
echo "Ejecutando prueba de cliente..."
node test-cliente-fix.js

echo ""
echo "========================================="
echo "PRUEBA COMPLETADA"
echo "========================================="
echo ""
echo "Si la prueba fue exitosa, ejecuta:"
echo "  ./deploy.sh"
echo ""
