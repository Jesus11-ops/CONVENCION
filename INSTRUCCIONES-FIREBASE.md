# 🔥 INSTRUCCIONES PARA CONFIGURAR FIREBASE
## Convención Zonal Sahagún · IPUC

---

## PASO 1: Crear el proyecto Firebase

1. Ve a **https://console.firebase.google.com**
2. Click en **"Agregar proyecto"**
3. Nombre sugerido: `convencion-sahagun`
4. Desactiva Google Analytics (no es necesario)
5. Click **"Crear proyecto"**

---

## PASO 2: Habilitar Authentication

1. En el menú izquierdo → **Authentication**
2. Click **"Comenzar"**
3. Ve a la pestaña **"Método de inicio de sesión"**
4. Activa **"Correo electrónico/contraseña"**
5. Guarda

---

## PASO 3: Crear Firestore Database

1. En el menú izquierdo → **Firestore Database**
2. Click **"Crear base de datos"**
3. Selecciona **"Comenzar en modo de producción"**
4. Elige la región: **`us-central1`** (o la más cercana)
5. Click **"Listo"**

---

## PASO 4: Reglas de seguridad de Firestore

Ve a **Firestore → Reglas** y pega esto exactamente:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Solo usuarios autenticados pueden leer
    match /Ingresos/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.auth.token.email == "TU_CORREO_ADMIN@gmail.com";
    }

    match /Egresos/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.auth.token.email == "TU_CORREO_ADMIN@gmail.com";
    }

    match /usuarios/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ Reemplaza `TU_CORREO_ADMIN@gmail.com` con el correo real del administrador.

---

## PASO 5: Obtener la configuración (firebaseConfig)

1. Ve a **Configuración del proyecto** (engranaje ⚙️ en el menú)
2. Baja hasta **"Tus aplicaciones"**
3. Click en el ícono **`</>`** (Web)
4. Nombre de la app: `convencion-sahagun-web`
5. **NO** actives Firebase Hosting
6. Copia el objeto `firebaseConfig` que aparece

---

## PASO 6: Pegar la config en los archivos

Abre los siguientes 3 archivos y reemplaza el bloque `firebaseConfig`:

- **`auth.js`** → línea 8-15
- **`app.js`** → línea 9-16
- **`exportar.js`** → línea 10-17

También reemplaza:
- `"TU_CORREO_ADMIN@gmail.com"` → con el correo del administrador

---

## PASO 7: Crear el primer usuario (administrador)

1. En Firebase Console → **Authentication → Usuarios**
2. Click **"Agregar usuario"**
3. Ingresa el correo y contraseña del administrador
4. Guarda

---

## PASO 8: Subir los archivos

Sube **todos estos archivos** al mismo lugar (hosting, carpeta local, etc.):

```
✅ index.html         (página de login)
✅ dashboard.html     (panel principal)
✅ style.css          (estilos)
✅ auth.js            (autenticación)
✅ app.js             (lógica principal)
✅ exportar.js        (exportar Excel)
```

---

## 📊 COLECCIONES QUE SE CREAN EN FIREBASE

### Colección: `Ingresos`
```
{
  fecha:          "2025-02-15",         // string YYYY-MM-DD
  diaSemana:      "Sábado",             // calculado automáticamente
  rubro:          "Aporte Zonal",       // de la lista desplegable
  congregacion:   "Congregación Norte", // quién hizo el aporte
  monto:          250000,               // número entero (sin decimales)
  observacion:    "Recibido en culto",  // opcional
  creadoEn:       "2025-02-15T10:30Z"   // timestamp ISO
}
```

### Colección: `Egresos`
```
{
  fecha:          "2025-02-15",
  diaSemana:      "Sábado",
  concepto:       "Sonido",             // de la lista de conceptos
  descripcion:    "Alquiler equipo",    // opcional
  monto:          1500000,
  creadoEn:       "2025-02-15T10:30Z"
}
```

### Colección: `usuarios`
```
{
  uid:       "firebase-uid-del-usuario",
  email:     "correo@ejemplo.com",
  creadoEn:  "2025-02-15T10:30Z"
}
```

---

## 👥 ROLES Y PERMISOS

| Acción                        | Administrador | Lectura |
|-------------------------------|:-------------:|:-------:|
| Ver ingresos                  | ✅            | ✅      |
| Ver egresos                   | ✅            | ✅      |
| Ver resumen financiero        | ✅            | ✅      |
| Registrar ingresos            | ✅            | ❌      |
| Registrar egresos             | ✅            | ❌      |
| Editar / Eliminar registros   | ✅            | ❌      |
| Exportar Excel                | ✅            | ❌      |
| Crear usuarios                | ✅ (desde login) | ❌   |

**Máximo 3 usuarios** en el sistema.

---

## 📈 PRESUPUESTO CARGADO

El sistema ya tiene cargado el presupuesto de la convención:

**Total Presupuesto: $15.145.000**

| Egresos presupuestados | Monto |
|------------------------|------:|
| Predicadores | $2.650.000 |
| Sonido | $2.200.000 |
| Alimentación | $2.250.000 |
| Relaciones Públicas | $1.150.000 |
| Músicos Invitados | $1.000.000 |
| ... y más | |

El comparativo **Presupuesto vs Real** se actualiza automáticamente.

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

**"No veo el formulario de registro"**
→ Solo el administrador lo ve. Verifica que inicias con el correo correcto.

**"Error al guardar"**
→ Verifica las Reglas de Firestore (Paso 4) y que el correo admin coincide.

**"No carga nada"**
→ Abre F12 → Consola y busca errores en rojo.

---

*Sistema desarrollado para la Iglesia Pentecostal Unida de Colombia*
*Convención Zonal Sahagún · v1.0*
