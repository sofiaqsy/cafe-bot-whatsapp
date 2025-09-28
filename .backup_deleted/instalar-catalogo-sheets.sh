#!/bin/bash

echo "INSTALANDO BOT CON CATÁLOGO DESDE GOOGLE SHEETS"
echo "=================================================="

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar si existe el archivo .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}[AVISO] Archivo .env no encontrado. Creando desde ejemplo...${NC}"
    cp .env.example .env 2>/dev/null || echo "SPREADSHEET_ID=tu-spreadsheet-id
GOOGLE_CREDENTIALS_PATH=credentials.json
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=whatsapp:+14155238886
BUSINESS_NAME=Coffee Express
BUSINESS_PHONE=+51987654321
BUSINESS_EMAIL=ventas@coffeeexpress.com" > .env
    echo -e "${GREEN}[OK] Archivo .env creado. Por favor, configura las variables.${NC}"
fi

# 2. Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[INFO] Instalando dependencias...${NC}"
    npm install googleapis
fi

# 3. Hacer backup del bot actual
if [ -f "bot.js" ]; then
    echo -e "${YELLOW}[INFO] Haciendo backup del bot actual...${NC}"
    cp bot.js bot-backup-$(date +%Y%m%d-%H%M%S).js
    echo -e "${GREEN}[OK] Backup creado${NC}"
fi

# 4. Activar el nuevo bot con catálogo
echo -e "${YELLOW}[INFO] Activando bot con catálogo de Google Sheets...${NC}"
cp bot-con-catalogo-sheets.js bot.js

# 5. Verificar configuración
echo ""
echo -e "${GREEN}[OK] BOT INSTALADO CORRECTAMENTE${NC}"
echo ""
echo "CONFIGURACIÓN REQUERIDA EN .env:"
echo "=================================="
echo "1. SPREADSHEET_ID - ID de tu Google Sheets"
echo "2. GOOGLE_CREDENTIALS_PATH - Ruta al archivo credentials.json"
echo "3. TWILIO_ACCOUNT_SID - Tu SID de Twilio (opcional para pruebas)"
echo "4. TWILIO_AUTH_TOKEN - Tu token de Twilio (opcional para pruebas)"
echo ""
echo "CONFIGURACIÓN DE GOOGLE SHEETS:"
echo "=================================="
echo "1. Crea una hoja llamada 'CatalogoWhatsApp'"
echo "2. Agrega estos encabezados en la fila 1:"
echo "   A: ID_Producto"
echo "   B: Nombre"
echo "   C: Precio_Kg"
echo "   D: Origen"
echo "   E: Puntaje"
echo "   F: Agricultor"
echo "   G: Stock_Kg"
echo "   H: Descripcion"
echo "   I: Estado"
echo ""
echo "3. Agrega productos con Estado = 'ACTIVO' y Stock_Kg > 0"
echo ""
echo "PARA EJECUTAR EL BOT:"
echo "====================="
echo -e "${GREEN}npm start${NC}"
echo ""
echo "PARA PROBAR:"
echo "============"
echo "1. Abre http://localhost:3000"
echo "2. Haz clic en 'Probar Bot'"
echo "3. Escribe 'hola' y luego 'catálogo'"
echo ""