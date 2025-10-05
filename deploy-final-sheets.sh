#!/bin/bash

# ========================================
# DEPLOY FINAL COMPLETO - SHEETS INTEGRATION
# ========================================

echo "Desplegando versión final con Google Sheets..."
echo ""

# Git add y commit
git add .
git commit -m "feat: Integración completa con Google Sheets para campaña de muestras

- Orden correcto: 1.Cafetería 2.Distrito 3.Dirección 4.Foto 5.Contacto  
- Guardar en pestaña Clientes con 15 columnas
- Guardar en PedidosWhatsApp como muestra gratis
- sheets-service implementado para persistencia
- WhatsApp del usuario guardado correctamente"

# Push a Heroku
echo "Enviando a Heroku..."
git push heroku main

echo ""
echo "Esperando 25 segundos..."
sleep 25

echo ""
echo "=========================================="
echo "SISTEMA COMPLETO DESPLEGADO"
echo "=========================================="
echo ""
echo "FLUJO CORRECTO (5 PASOS):"
echo "1. Nombre de cafetería"
echo "2. DISTRITO (selección)"
echo "3. Dirección completa"
echo "4. Foto de fachada"
echo "5. Nombre del contacto"
echo ""
echo "DATOS GUARDADOS EN SHEETS:"
echo ""
echo "Pestaña CLIENTES:"
echo "- ID_Cliente"
echo "- WhatsApp (usuario)"
echo "- Empresa (cafetería)"
echo "- Contacto"
echo "- Teléfono"
echo "- Dirección"
echo "- Distrito"
echo "- Ciudad: Lima"
echo "- Fecha Registro"
echo "- Total: 0 (muestra gratis)"
echo "- Notas: URL de foto"
echo ""
echo "Pestaña PEDIDOSWHATSAPP:"
echo "- Pedido con Total: 0"
echo "- Estado: Pendiente verificación"
echo "- Tipo: MUESTRA"
echo ""
echo "LINK FINAL:"
echo "https://wa.me/14155238886?text=SOLICITO%20MUESTRA"
echo ""
echo "NOTA: Si no tienes credenciales de Google configuradas,"
echo "los datos se guardarán solo en memoria."
echo ""
