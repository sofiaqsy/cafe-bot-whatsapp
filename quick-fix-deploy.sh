#!/bin/bash

# Script simplificado para hacer el fix y deploy rápido
echo "🔧 Aplicando fix de sintaxis y desplegando..."

# Commit and push
git add sheets-service.js
git commit -m "Fix: Error de sintaxis en sheets-service.js línea 94"
git push heroku main

# Ver resultado
echo ""
echo "📊 Estado de la aplicación:"
heroku ps
echo ""
echo "📝 Últimos logs:"
heroku logs -n 30
