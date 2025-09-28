#!/bin/bash

# ========================================
# SCRIPT PARA CONFIGURAR GOOGLE DRIVE EN HEROKU
# ========================================

echo "🚀 Configurando Google Drive en Heroku..."
echo "========================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No estás en el directorio del proyecto"
    echo "   Por favor, ejecuta este script desde: /Users/keylacusi/Desktop/OPEN IA/cafe-bots/cafe-bot-local/"
    exit 1
fi

echo "📝 PASO 1: Primero necesitas el ID de tu carpeta de Google Drive"
echo "--------------------------------------------------------------"
echo "1. Ve a Google Drive (drive.google.com)"
echo "2. Crea una carpeta llamada 'Comprobantes_CafeBot'"
echo "3. Ábrela y copia el ID de la URL"
echo "   Ejemplo: drive.google.com/drive/folders/[ESTE_ES_EL_ID]"
echo ""
read -p "📁 Pega aquí el ID de tu carpeta de Drive: " FOLDER_ID

if [ -z "$FOLDER_ID" ]; then
    echo "❌ Error: No ingresaste el ID de la carpeta"
    exit 1
fi

echo ""
echo "📝 PASO 2: Compartir la carpeta con el Service Account"
echo "--------------------------------------------------------------"
echo "⚠️  IMPORTANTE: Debes compartir la carpeta con este email:"
echo "   cafe-bot@maximal-journey-459103-k4.iam.gserviceaccount.com"
echo "   Dale permisos de 'Editor'"
echo ""
read -p "¿Ya compartiste la carpeta? (s/n): " COMPARTIDA

if [ "$COMPARTIDA" != "s" ] && [ "$COMPARTIDA" != "S" ]; then
    echo ""
    echo "Por favor:"
    echo "1. Ve a la carpeta en Google Drive"
    echo "2. Click derecho → Compartir"
    echo "3. Agrega: cafe-bot@maximal-journey-459103-k4.iam.gserviceaccount.com"
    echo "4. Selecciona 'Editor'"
    echo "5. Click en 'Enviar'"
    echo ""
    echo "Luego vuelve a ejecutar este script."
    exit 1
fi

echo ""
echo "🚀 PASO 3: Configurando variables en Heroku..."
echo "--------------------------------------------------------------"

# Configurar las variables de entorno en Heroku
echo "Agregando DRIVE_ENABLED=TRUE..."
heroku config:set DRIVE_ENABLED=TRUE

echo "Agregando DRIVE_FOLDER_ID=$FOLDER_ID..."
heroku config:set DRIVE_FOLDER_ID=$FOLDER_ID

# También agregar la variable alternativa por si acaso
echo "Agregando GOOGLE_DRIVE_FOLDER_ID=$FOLDER_ID..."
heroku config:set GOOGLE_DRIVE_FOLDER_ID=$FOLDER_ID

echo ""
echo "✅ Variables configuradas en Heroku!"
echo ""
echo "📝 PASO 4: Verificando configuración..."
echo "--------------------------------------------------------------"
heroku config:get DRIVE_ENABLED
heroku config:get DRIVE_FOLDER_ID

echo ""
echo "🔄 PASO 5: Reiniciando la aplicación..."
echo "--------------------------------------------------------------"
heroku restart

echo ""
echo "📋 PASO 6: Verificando logs..."
echo "--------------------------------------------------------------"
echo "Esperando 10 segundos para que la app reinicie..."
sleep 10

echo ""
echo "Mostrando últimos logs (busca '✅ Google Drive conectado'):"
echo ""
heroku logs --tail -n 50 | grep -E "(Google Drive|Drive|drive|DRIVE)"

echo ""
echo "=========================================="
echo "✅ CONFIGURACIÓN COMPLETADA!"
echo "=========================================="
echo ""
echo "📋 RESUMEN:"
echo "  - DRIVE_ENABLED = TRUE"
echo "  - DRIVE_FOLDER_ID = $FOLDER_ID"
echo "  - Carpeta compartida con Service Account"
echo ""
echo "🧪 PARA PROBAR:"
echo "1. Envía un mensaje al bot por WhatsApp"
echo "2. Haz un pedido de prueba"
echo "3. Cuando pida el comprobante, envía una imagen"
echo "4. Verifica que la imagen aparezca en tu carpeta de Drive"
echo ""
echo "📊 PARA VER LOGS EN TIEMPO REAL:"
echo "heroku logs --tail"
echo ""
echo "⚠️  Si ves errores de Drive en los logs, verifica:"
echo "   1. Que la carpeta esté compartida con el Service Account"
echo "   2. Que el ID de la carpeta sea correcto"
echo "   3. Que el Service Account tenga permisos de Editor"
echo ""
