#!/bin/bash

# Script rápido para corregir el despliegue en Heroku

echo "🔧 Corrigiendo configuración para Heroku..."

# Verificar que estamos en el directorio correcto
if [ ! -f "bot-final.js" ]; then
    echo "❌ Error: No se encontró bot-final.js"
    echo "Asegúrate de estar en el directorio cafe-bot-local"
    exit 1
fi

echo "✅ Archivo bot-final.js encontrado"

# Corregir Procfile
echo "web: node bot-final.js" > Procfile
echo "✅ Procfile actualizado"

# Corregir package.json - actualizar main y start script
if [ -f "package.json" ]; then
    # Usar sed para actualizar el archivo
    sed -i.bak 's/"main": "bot-final-actualizado.js"/"main": "bot-final.js"/' package.json
    sed -i.bak 's/"start": "node bot-final-actualizado.js"/"start": "node bot-final.js"/' package.json
    sed -i.bak 's/"dev": "nodemon bot-final-actualizado.js"/"dev": "nodemon bot-final.js"/' package.json
    echo "✅ package.json actualizado"
fi

echo ""
echo "📋 Verificando cambios..."
echo "Procfile contiene:"
cat Procfile
echo ""
echo "package.json scripts:"
grep -A3 '"scripts"' package.json

echo ""
echo "🚀 Ahora ejecuta los siguientes comandos para desplegar:"
echo ""
echo "git add ."
echo "git commit -m 'Fix: Actualizar referencias a bot-final.js'"
echo "git push heroku main  # o 'git push heroku master' según tu rama"
echo ""
echo "✨ Listo! Los archivos han sido corregidos."
