#!/bin/bash

echo "=========================================="
echo "SOLUCION RAPIDA PARA HEROKU"
echo "=========================================="

# Opción 1: Cambiar a bot-final.js que sabemos que funciona
echo "[INFO] Cambiando a bot-final.js..."

# Actualizar package.json
sed -i.bak 's/bot-final-actualizado\.js/bot-final.js/g' package.json

# Actualizar Procfile
echo "web: node bot-final.js" > Procfile

echo "[OK] Configuración actualizada para usar bot-final.js"
echo ""
echo "EJECUTA ESTOS COMANDOS:"
echo "========================"
echo "git add package.json Procfile"
echo "git commit -m 'Cambiar a bot-final.js que funciona'"
echo "git push heroku main --force"
echo ""
echo "Esto usará bot-final.js que ya está probado y funciona."