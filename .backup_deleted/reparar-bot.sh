#!/bin/bash

echo "=========================================="
echo "REPARANDO BOT-FINAL-ACTUALIZADO.JS"
echo "=========================================="

# Hacer backup del archivo corrupto
echo "[INFO] Haciendo backup del archivo corrupto..."
mv bot-final-actualizado.js bot-final-actualizado-corrupto.js

# Copiar bot-final.js como base
echo "[INFO] Copiando bot-final.js como base..."
cp bot-final.js bot-final-actualizado.js

echo "[OK] Archivo reparado"
echo ""
echo "Ahora bot-final-actualizado.js es una copia exacta de bot-final.js"
echo "que funciona correctamente."
echo ""
echo "Para desplegar:"
echo "git add ."
echo "git commit -m 'Reparar bot-final-actualizado.js'"
echo "git push heroku main"