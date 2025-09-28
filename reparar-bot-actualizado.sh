#!/bin/bash

# Script para reparar bot-final-actualizado.js
echo "🔧 Reparando bot-final-actualizado.js..."

# Hacer backup del archivo corrupto
if [ -f "bot-final-actualizado.js" ]; then
    echo "📦 Creando backup del archivo corrupto..."
    mv bot-final-actualizado.js bot-final-actualizado-corrupto-backup.js
fi

# Copiar el archivo funcional
if [ -f "bot-final.js" ]; then
    echo "✅ Copiando bot-final.js a bot-final-actualizado.js..."
    cp bot-final.js bot-final-actualizado.js
    echo "✅ Archivo reparado exitosamente!"
    echo ""
    echo "🚀 Para desplegar a Heroku, ejecuta:"
    echo "   git add ."
    echo "   git commit -m 'Fix: Repara archivo bot-final-actualizado.js'"
    echo "   git push heroku main"
else
    echo "❌ Error: No se encontró bot-final.js"
    echo "   El archivo bot-final.js es necesario para reparar bot-final-actualizado.js"
    exit 1
fi

echo ""
echo "✅ Proceso completado!"
