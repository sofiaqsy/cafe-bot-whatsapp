#!/bin/bash
# Script para activar el bot con catálogo desde Google Sheets

echo "=========================================="
echo "ACTIVANDO BOT CON CATÁLOGO DINÁMICO"
echo "=========================================="

# Hacer backup del bot actual
if [ -f "bot.js" ]; then
    echo "[INFO] Haciendo backup del bot actual..."
    cp bot.js bot-backup-$(date +%Y%m%d-%H%M%S).js
    echo "[OK] Backup creado"
fi

# Copiar el nuevo bot con catálogo
echo "[INFO] Activando nuevo bot con catálogo..."
cp bot-con-catalogo-sheets.js bot.js

echo "[OK] Bot actualizado correctamente"
echo ""
echo "Para desplegar en Heroku:"
echo "========================"
echo "git add ."
echo "git commit -m 'Activar bot con catálogo dinámico desde Google Sheets'"
echo "git push heroku main"
echo ""