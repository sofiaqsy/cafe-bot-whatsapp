#!/bin/bash

echo "☕ Iniciando Bot de WhatsApp (Versión Profesional)..."
echo ""

# Verificar si existe node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install express dotenv twilio
    echo ""
fi

echo "🚀 Iniciando el bot..."
echo ""
echo "📌 Para probar, abre en tu navegador:"
echo "   http://localhost:3000/test"
echo ""
echo "💡 Comandos útiles:"
echo "   - Escribe 'hola' para comenzar"
echo "   - Escribe '1' para ver catálogo"
echo "   - Escribe 'menu' en cualquier momento"
echo ""

# Ejecutar el bot profesional
node bot-pro.js
