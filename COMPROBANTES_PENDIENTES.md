# 🔄 ACTUALIZACIÓN: COMPROBANTES PENDIENTES DE PAGO

## 📅 Fecha: Diciembre 2024
## 🎯 Funcionalidad: Manejo mejorado de comprobantes pendientes

## ✅ CAMBIOS IMPLEMENTADOS

### 1. **Nuevo Estado de Pedido**
- Se agregó el estado `PENDING_PAYMENT` ("Pendiente de pago") en `order-states.js`
- Este estado indica que el pedido está confirmado pero falta enviar el comprobante

### 2. **Flujo Mejorado en `esperando_comprobante`**
Cuando el bot está esperando el comprobante, ahora el usuario tiene estas opciones:

#### Opciones disponibles:
- **📸 Enviar foto**: Procesa el comprobante normalmente
- **"DESPUES"**: Guarda el pedido como pendiente (24 horas para enviar)
- **"CANCELAR"**: Cancela el pedido
- **"LISTO"**: Confirma pago sin foto (compatibilidad anterior)

#### Mensaje mejorado:
```
Por favor, elige una opción:

📸 *Envía la foto del comprobante*

*O escribe:*
• *DESPUES* - Enviar comprobante más tarde (tienes 24 horas)
• *CANCELAR* - Cancelar el pedido
• *LISTO* - Si ya hiciste la transferencia pero no puedes enviar foto

_Tu código de pedido: CAF-123456_
```

### 3. **Nueva Opción 5 en el Menú Principal**
- Solo aparece cuando hay pedidos pendientes de pago
- Texto: "*5* - 💳 Enviar comprobante pendiente"
- Muestra lista de pedidos pendientes con tiempo restante

### 4. **Nuevos Métodos en `state-manager.js`**
```javascript
// Obtener solo pedidos pendientes de pago
getPendingPaymentOrders(userId)

// Actualizar pedido con comprobante
updateOrderWithReceipt(orderId, mediaUrl)
```

### 5. **Nuevos Métodos en `order-handler.js`**
```javascript
// Guardar pedido sin comprobante
guardarPedidoPendientePago(from, userState)

// Mostrar pedidos pendientes
mostrarPedidosPendientesPago(from)
```

### 6. **Nuevos Cases en el Switch**
- `seleccionar_pedido_pendiente`: Muestra lista de pedidos pendientes
- `esperando_comprobante_pendiente`: Espera comprobante de pedido existente

## 🔧 ARCHIVOS MODIFICADOS

1. **`order-states.js`**
   - Agregado estado `PENDING_PAYMENT`
   - Actualizado arrays de estados pendientes y activos

2. **`state-manager.js`**
   - Agregado `getPendingPaymentOrders()`
   - Agregado `updateOrderWithReceipt()`

3. **`order-handler.js`**
   - Modificado case `esperando_comprobante`
   - Agregado case `seleccionar_pedido_pendiente`
   - Agregado case `esperando_comprobante_pendiente`
   - Agregado opción 5 en el menú principal
   - Agregados métodos auxiliares

## 📱 FLUJO DE USUARIO

### Escenario 1: Enviar comprobante después
1. Usuario realiza pedido
2. Llega a "esperando_comprobante"
3. Escribe "despues"
4. Pedido se guarda con estado "Pendiente de pago"
5. Usuario recibe confirmación con recordatorio de 24 horas

### Escenario 2: Enviar comprobante pendiente
1. Usuario escribe "menu"
2. Ve opción "5 - 💳 Enviar comprobante pendiente"
3. Selecciona opción 5
4. Ve lista de pedidos pendientes con tiempo restante
5. Selecciona pedido
6. Envía foto del comprobante
7. Pedido se actualiza a "Pendiente verificación"

## 🎯 CARACTERÍSTICAS CLAVE

### Tiempo límite de 24 horas
- Los pedidos pendientes de pago tienen 24 horas para recibir comprobante
- Se muestra tiempo restante en la lista
- Alerta especial cuando quedan menos de 3 horas

### Persistencia de datos
- Los pedidos pendientes se guardan en memoria
- Se sincronizan con Google Sheets si está disponible
- Los datos del cliente se mantienen para futuros pedidos

### Notificaciones
- Se notifica al admin cuando hay pedido pendiente de pago
- Se notifica cuando se recibe el comprobante tardío

## 🧪 TESTING

### Archivo de prueba incluido:
```bash
node test-comprobante-pendiente.js
```

Este archivo simula todo el flujo:
1. Crear pedido
2. Elegir "despues" para el comprobante
3. Verificar pedido pendiente
4. Volver al menú y ver opción 5
5. Enviar comprobante pendiente
6. Verificar actualización del estado

## 📝 NOTAS IMPORTANTES

1. **Compatibilidad**: Mantiene compatibilidad con flujo anterior (opción "listo")

2. **Estados claros**: 
   - `Pendiente de pago`: Sin comprobante
   - `Pendiente verificación`: Con comprobante, esperando validación

3. **UX mejorada**:
   - Opciones claras en cada paso
   - Recordatorios de tiempo límite
   - Fácil acceso desde menú principal

4. **Sincronización**:
   - Se actualiza en Google Sheets si está configurado
   - Se guarda imagen en Drive si está disponible

## 🚀 DEPLOY

```bash
# Commit cambios
git add .
git commit -m "feat: Agregar manejo de comprobantes pendientes de pago"

# Push a Heroku
git push heroku main
```

## ⚠️ CONSIDERACIONES

1. Los pedidos con más de 24 horas sin comprobante deberían cancelarse automáticamente (pendiente de implementar)
2. Considerar agregar recordatorios automáticos por WhatsApp
3. Posible mejora: permitir extensión de tiempo en casos especiales

## 📊 MÉTRICAS A TRACKEAR

- Porcentaje de pedidos con "enviar después"
- Tiempo promedio para enviar comprobante
- Tasa de abandono de pedidos pendientes
- Pedidos que expiran sin comprobante

---

**Implementado por**: Assistant
**Fecha**: Diciembre 2024
**Versión**: 1.0
