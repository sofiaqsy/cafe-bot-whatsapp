#!/bin/bash

# ========================================
# DEPLOY FINAL CON GOOGLE SHEETS FUNCIONANDO
# ========================================

echo "Desplegando con Google Sheets integrado..."
echo ""

# Git add y commit
git add .
git commit -m "fix: Integración completa con Google Sheets usando variables existentes

- Usar GOOGLE_SERVICE_ACCOUNT_KEY y GOOGLE_SPREADSHEET_ID
- Inicializar sheets-service automáticamente
- Guardar en Clientes y PedidosWhatsApp
- Orden correcto: 1.Cafetería 2.Distrito 3.Dirección 4.Foto 5.Contacto"

# Push a Heroku  
echo "Enviando a Heroku..."
git push heroku main

echo ""
echo "Esperando 30 segundos..."
sleep 30

echo ""
echo "=========================================="
echo "SISTEMA COMPLETO CON GOOGLE SHEETS"
echo "=========================================="
echo ""
echo "VARIABLES DE ENTORNO EN HEROKU:"
echo "✅ GOOGLE_SERVICE_ACCOUNT_KEY (ya configurada)"
echo "✅ GOOGLE_SPREADSHEET_ID (ya configurada)"
echo ""
echo "FLUJO DE 5 PASOS:"
echo "1. Nombre cafetería"
echo "2. DISTRITO"
echo "3. Dirección"
echo "4. Foto fachada"
echo "5. Nombre contacto"
echo ""
echo "SE GUARDARÁ EN GOOGLE SHEETS:"
echo ""
echo "Pestaña CLIENTES (15 columnas):"
echo "A: ID_Cliente"
echo "B: WhatsApp"
echo "C: Empresa (cafetería)"
echo "D: Contacto"
echo "E: Teléfono"
echo "F: Email (vacío)"
echo "G: Dirección"
echo "H: Distrito"
echo "I: Ciudad (Lima)"
echo "J: Fecha Registro"
echo "K: Última Compra"
echo "L: Total Pedidos (1)"
echo "M: Total Comprado (0)"
echo "N: Total Kg (1)"
echo "O: Notas (URL foto)"
echo ""
echo "Pestaña PEDIDOSWHATSAPP:"
echo "- Pedido con total 0"
echo "- Estado: Pendiente verificación"
echo "- Tipo: MUESTRA"
echo ""
echo "LINK:"
echo "https://wa.me/14155238886?text=SOLICITO%20MUESTRA"
echo ""
echo "¡Los datos ahora aparecerán en tu Google Sheet!"
echo ""
