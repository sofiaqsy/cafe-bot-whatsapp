#!/bin/bash

echo "=========================================="
echo "COPIANDO Y MODIFICANDO BOT-FINAL.JS"
echo "=========================================="

# Hacer backup
echo "[INFO] Creando backup..."
cp bot-final.js bot-final-backup-$(date +%Y%m%d-%H%M%S).js

# Copiar bot-final.js a bot-final-actualizado.js
echo "[INFO] Copiando bot-final.js a bot-final-actualizado.js..."
cp bot-final.js bot-final-actualizado.js

echo "[OK] Archivo copiado"
echo ""
echo "Ahora necesitas modificar manualmente bot-final-actualizado.js para:"
echo "1. Agregar import de googleapis al inicio"
echo "2. Agregar función obtenerCatalogoSheets()"
echo "3. Reemplazar el catálogo hardcodeado"
echo "4. Eliminar emoticonos"
echo ""