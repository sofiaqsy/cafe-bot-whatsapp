# FIX: Cliente WhatsApp - Documentación

## 📋 Resumen de cambios

### Problema 1: WhatsApp no se guardaba correctamente
**Antes:** Se guardaba solo el número normalizado (+51936934501)
**Ahora:** Se guarda el WhatsApp completo (whatsapp:+51936934501)

### Problema 2: Se pedían datos repetidamente
**Antes:** Cada pedido pedía todos los datos del cliente
**Ahora:** Si el cliente existe, muestra sus datos y pregunta si son correctos

## 🔧 Archivos modificados

### 1. `google-sheets.js`
- **Método `buscarCliente()`**: Ahora busca usando el formato completo whatsapp:+51...
- **Método `guardarCliente()`**: Guarda el WhatsApp completo en la columna B
- Se eliminó la normalización del teléfono al guardar

### 2. `order-handler.js`
- **Nuevo flujo en `confirmar_pedido`**: 
  1. Busca si el cliente existe en Google Sheets
  2. Si existe, muestra los datos y pregunta si son correctos
  3. Si no existe, pide los datos por primera vez
- **Nuevo estado `confirmar_datos_cliente`**: Maneja la confirmación o actualización de datos

## 🚀 Instrucciones de despliegue

### Paso 1: Hacer los scripts ejecutables
```bash
chmod +x test-fix.sh
chmod +x deploy.sh
```

### Paso 2: Probar los cambios localmente (opcional)
```bash
./test-fix.sh
```

### Paso 3: Desplegar los cambios
```bash
./deploy.sh
```

### Comandos manuales alternativos:
```bash
# 1. Ir al directorio del proyecto
cd "/Users/keylacusi/Desktop/OPEN IA/cafe-bots/cafe-bot-local"

# 2. Agregar los cambios
git add google-sheets.js order-handler.js

# 3. Hacer commit
git commit -m "fix: Guardar WhatsApp completo y reutilizar datos de clientes"

# 4. Push a GitHub
git push origin main

# 5. Desplegar a Heroku
git push heroku main

# 6. Ver logs de Heroku
heroku logs --tail -a cafe-bot-whatsapp-ad7ab21dc0a8
```

## 📊 Verificación en Google Sheets

### Hoja "Clientes"
La columna B (WhatsApp) ahora debe mostrar:
```
whatsapp:+51936934501
```
En lugar de:
```
+51936934501
```

## 🔄 Flujo del bot actualizado

### Para clientes nuevos:
1. Usuario confirma pedido → Bot pide datos de empresa
2. Bot guarda los datos con WhatsApp completo
3. Procede con el pago

### Para clientes existentes:
1. Usuario confirma pedido → Bot busca en Sheets
2. Bot muestra: "Hemos encontrado tus datos: [datos]"
3. Usuario confirma (SI) o pide cambiar (NO)
4. Si confirma → Procede con el pago
5. Si no → Pide los datos nuevamente

## 🧪 Casos de prueba

### Test 1: Cliente nuevo
1. Hacer un pedido con un número nuevo
2. Verificar que en Sheets se guarda: whatsapp:+51XXXXXXXXX

### Test 2: Cliente existente
1. Hacer un segundo pedido con el mismo número
2. El bot debe mostrar los datos guardados
3. Confirmar con "SI" debe ir directo al pago

### Test 3: Actualizar datos
1. Cliente existente hace pedido
2. Responder "NO" cuando muestra los datos
3. Ingresar nuevos datos
4. Verificar que se actualizan en Sheets

## ⚠️ Notas importantes

1. **Migración de datos antiguos**: Los clientes que ya estaban en la hoja con formato antiguo (+51...) NO serán encontrados hasta que hagan un nuevo pedido y se actualice su registro.

2. **Compatibilidad**: El sistema mantiene compatibilidad con el resto del código. El campo `telefono` del pedido sigue guardando el número que ingresa el cliente.

3. **WhatsApp de sesión**: El campo `userId` en los pedidos siempre usa el formato completo whatsapp:+51...

## 📝 Logs esperados

Al buscar un cliente existente:
```
🔍 Buscando cliente con WhatsApp: whatsapp:+51936934501
✅ Cliente encontrado: Cafetería Test
```

Al guardar un cliente:
```
💾 Guardando cliente con WhatsApp: whatsapp:+51936934501
✅ Nuevo cliente creado: Cafetería Test (CLI-12345678)
```

## 🆘 Solución de problemas

### Si el cliente no se encuentra:
1. Verificar que en la columna B esté el formato completo
2. Verificar que el bot está usando el `from` correcto
3. Revisar los logs de Heroku

### Si no se guardan los datos:
1. Verificar que Google Sheets está inicializado
2. Verificar permisos de la cuenta de servicio
3. Revisar que existe la hoja "Clientes"

## 📞 Contacto
Si hay problemas con el despliegue, revisar los logs con:
```bash
heroku logs --tail -a cafe-bot-whatsapp-ad7ab21dc0a8
```
