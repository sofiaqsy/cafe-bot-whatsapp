# 🚀 CONFIGURAR GOOGLE DRIVE EN HEROKU

## 📋 MÉTODO 1: USANDO EL SCRIPT AUTOMÁTICO (RECOMENDADO)

He creado un script que hace todo automáticamente:

```bash
# Dar permisos de ejecución al script
chmod +x configurar-drive-heroku.sh

# Ejecutar el script
./configurar-drive-heroku.sh
```

El script te guiará paso a paso y configurará todo automáticamente.

---

## 🛠️ MÉTODO 2: CONFIGURACIÓN MANUAL

Si prefieres hacerlo manualmente o el script no funciona:

### PASO 1: Crear y Compartir Carpeta en Google Drive

1. **Crear carpeta**:
   - Ve a [Google Drive](https://drive.google.com)
   - Crea una carpeta llamada "Comprobantes_CafeBot"
   
2. **Compartir con Service Account**:
   - Click derecho en la carpeta → "Compartir"
   - Agregar email: `cafe-bot@maximal-journey-459103-k4.iam.gserviceaccount.com`
   - Dar permisos de "Editor"
   - Click en "Enviar"

3. **Obtener ID**:
   - Abre la carpeta
   - Copia el ID de la URL: `drive.google.com/drive/folders/[ESTE_ES_EL_ID]`

### PASO 2: Configurar Variables en Heroku

#### Opción A: Desde la Terminal (Más Rápido)

```bash
# Configurar las variables de entorno
heroku config:set DRIVE_ENABLED=TRUE
heroku config:set DRIVE_FOLDER_ID=tu_id_de_carpeta_aqui
heroku config:set GOOGLE_DRIVE_FOLDER_ID=tu_id_de_carpeta_aqui

# Verificar que se configuraron
heroku config

# Reiniciar la app
heroku restart

# Ver logs para confirmar
heroku logs --tail
```

#### Opción B: Desde el Dashboard de Heroku (Interfaz Web)

1. Ve a [dashboard.heroku.com](https://dashboard.heroku.com)
2. Selecciona tu aplicación
3. Click en la pestaña "Settings"
4. En la sección "Config Vars", click en "Reveal Config Vars"
5. Agregar estas variables:

| KEY | VALUE |
|-----|-------|
| DRIVE_ENABLED | TRUE |
| DRIVE_FOLDER_ID | tu_id_de_carpeta_aqui |
| GOOGLE_DRIVE_FOLDER_ID | tu_id_de_carpeta_aqui |

6. La app se reiniciará automáticamente

### PASO 3: Verificar que Funciona

```bash
# Ver los logs
heroku logs --tail

# Buscar estas líneas:
# ✅ Google Drive conectado
# 📁 Folder ID: 1abc2def...
```

---

## 🧪 PRUEBA COMPLETA

1. **Enviar mensaje de prueba**:
   ```
   WhatsApp → "hola"
   Bot → Menú principal
   ```

2. **Hacer pedido de prueba**:
   ```
   Tú → "1" (Ver catálogo)
   Tú → "1" (Seleccionar producto)
   Tú → "10" (Cantidad)
   Tú → "si" (Confirmar)
   ```

3. **Enviar comprobante**:
   ```
   Bot → Pide comprobante
   Tú → [Enviar imagen]
   ```

4. **Verificar en Drive**:
   - Abre tu carpeta en Google Drive
   - Deberías ver: `comprobante_CAF-123456_timestamp.jpg`

---

## 📊 MONITOREO EN TIEMPO REAL

### Ver logs mientras pruebas:
```bash
# Logs completos
heroku logs --tail

# Solo logs de Drive
heroku logs --tail | grep -i drive

# Solo errores
heroku logs --tail | grep -i error
```

### Mensajes esperados en logs:

✅ **Éxito**:
```
📁 Intentando conectar con carpeta de Drive: 1abc2def...
✅ Google Drive conectado correctamente
📁 Carpeta de comprobantes lista: 1abc2def...
📸 Procesando imagen: comprobante_CAF-123456_1234567890.jpg
✅ Imagen subida a Drive: comprobante_CAF-123456_1234567890.jpg
🔗 Link: https://drive.google.com/file/d/xxxxx/view
```

⚠️ **Si falla**:
```
⚠️ No se encontró ID de carpeta de Drive - Usando almacenamiento local
⚠️ Google Drive deshabilitado - Usando almacenamiento local
```

---

## 🔧 TROUBLESHOOTING

### Error: "No se pudo acceder a la carpeta de Drive"
```bash
# Verificar que la carpeta está compartida
# El Service Account debe tener permisos de Editor

# Verificar las variables
heroku config:get DRIVE_ENABLED
heroku config:get DRIVE_FOLDER_ID

# Deberían mostrar:
# DRIVE_ENABLED: TRUE
# DRIVE_FOLDER_ID: 1abc2def3ghi4jkl...
```

### Error: "Usando almacenamiento local"
```bash
# Asegurarse que DRIVE_ENABLED sea TRUE (en mayúsculas)
heroku config:set DRIVE_ENABLED=TRUE

# NO uses: true, True, o 1
```

### Las imágenes no aparecen en Drive
1. Verifica en los logs si hay errores
2. Confirma que el Service Account tiene permisos
3. Revisa que el ID de la carpeta es correcto
4. Asegúrate que no hay espacios en el ID

---

## 🎯 VENTAJAS DE USAR DRIVE EN HEROKU

1. **Sin límites de almacenamiento**: Heroku borra archivos locales al reiniciar
2. **Persistencia**: Las imágenes se mantienen para siempre
3. **Acceso fácil**: Puedes ver/descargar desde cualquier lugar
4. **Organización**: Todo en una carpeta dedicada
5. **Backup automático**: Google Drive maneja los respaldos

---

## 📝 NOTAS IMPORTANTES

1. **Heroku Dynos**: Los archivos locales se pierden cada 24 horas o al hacer deploy
2. **Por eso es CRÍTICO** usar Google Drive para los comprobantes
3. **Service Account**: Ya está configurado en las variables de Heroku
4. **Sin costo adicional**: Google Drive gratis tiene 15GB

---

## 🚨 COMANDOS ÚTILES

```bash
# Ver todas las variables configuradas
heroku config

# Ver solo las de Drive
heroku config | grep DRIVE

# Eliminar una variable (si necesitas corregir)
heroku config:unset NOMBRE_VARIABLE

# Reiniciar la app
heroku restart

# Ver estado de la app
heroku ps

# Abrir la app en el navegador
heroku open

# Ver logs de las últimas 2 horas
heroku logs --since 2h

# Descargar todos los logs
heroku logs -n 1500 > logs.txt
```

---

**Última actualización**: Diciembre 2024
**Estado**: ✅ Listo para configurar
**Tiempo estimado**: 5-10 minutos
