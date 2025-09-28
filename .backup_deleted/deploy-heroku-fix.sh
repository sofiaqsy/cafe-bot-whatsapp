#!/bin/bash

echo "🚀 Script de despliegue a Heroku - Solución completa"
echo "=================================================="

# 1. Verificar si existe bot-final-actualizado.js
if [ ! -f "bot-final-actualizado.js" ]; then
    echo "⚠️ No existe bot-final-actualizado.js, creándolo..."
    
    # Copiar bot-final.js a bot-final-actualizado.js
    if [ -f "bot-final.js" ]; then
        cp bot-final.js bot-final-actualizado.js
        echo "✅ Archivo bot-final-actualizado.js creado"
    else
        echo "❌ Error: No se encontró bot-final.js"
        exit 1
    fi
fi

# 2. Verificar que el archivo sea correcto
echo "📋 Verificando bot-final-actualizado.js..."
if head -n 1 bot-final-actualizado.js | grep -q "const express"; then
    echo "✅ El archivo parece correcto"
else
    echo "⚠️ El archivo parece corrupto, reparándolo..."
    cp bot-final.js bot-final-actualizado.js
    echo "✅ Archivo reparado"
fi

# 3. Agregar archivos a git
echo ""
echo "📦 Agregando archivos a git..."
git add .
git add -f bot-final-actualizado.js

# 4. Hacer commit
echo "💾 Haciendo commit..."
git commit -m "Fix: Agrega bot-final-actualizado.js para Heroku"

# 5. Push a Heroku
echo ""
echo "🚀 Desplegando a Heroku..."
git push heroku main --force

echo ""
echo "✅ Despliegue completado!"
echo ""
echo "📊 Para ver los logs en tiempo real, ejecuta:"
echo "   heroku logs --tail"
