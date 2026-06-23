import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  query, orderBy, deleteDoc, doc, updateDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBee2kGF_exUOqA9GKBbD5cHJEDTqgpXCA",
  authDomain: "convencion-d44d8.firebaseapp.com",
  projectId: "convencion-d44d8",
  storageBucket: "convencion-d44d8.firebasestorage.app",
  messagingSenderId: "902388942151",
  appId: "1:902388942151:web:68c8a9e069aae7150cb862"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db   = getFirestore(app);
const auth = getAuth(app);

// ===== CONFIGURACIÓN =====
const ADMIN_EMAIL = "Adminconvencion@gmail.com";

// Presupuesto aprobado (de la imagen)
const PRESUPUESTO_EGRESOS = {
  "Gerencia General":       200000,
  "Gerencia Ejecutiva":     200000,
  "Gerencia Administrativa":200000,
  "Predicadores":          2650000,
  "Sonido":                2200000,
  "Músicos Invitados":     1000000,
  "Logística y Trasteo":    500000,
  "Alimentación":          2250000,
  "Publicidad y Decoración":800000,
  "Hotel":                   50000,
  "Imprevistos":           1150000,
  "Relaciones Públicas":    500000,
  "Aseo":                   450000,
  "SEPRI":                  550000,
  "Electricidad":           300000,
  "Finanzas":                50000,
  "Silletería":             825000,
  "Espiritual":              70000,
  "Música":                 300000,
  "Vigilancia":             350000,
  "Ujieres y Recepción":    200000,
  "Decoración":             350000,
};

const PRESUPUESTO_INGRESOS = {
  "Aporte Zonal":    5000000,
  "Ofrendas":        6545000,
  "Aportes Pastores":1900000,
  "Culto Lanzamiento":1000000,
  "Varios":           700000,
};

// ===== ESTADO GLOBAL =====
let esAdmin = false;
let ingresosGlobal = [];
let egresosGlobal  = [];
let totalIngresosGlobal = 0;
let totalEgresosGlobal  = 0;

// ===== AUTH =====
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  esAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  actualizarInterfaz();
  iniciarListeners();
});

function actualizarInterfaz() {
  const badge = document.getElementById("rolBadge");
  if (badge) {
    if (esAdmin) {
      badge.textContent = "👑 Administrador";
      badge.className = "rol-badge admin";
    } else {
      badge.textContent = "👁️ Solo Lectura";
      badge.className = "rol-badge lectura";
    }
  }

  const secIngreso = document.getElementById("seccionIngreso");
  const secEgreso  = document.getElementById("seccionEgreso");
  if (secIngreso) secIngreso.style.display = esAdmin ? "block" : "none";
  if (secEgreso)  secEgreso.style.display  = esAdmin ? "block" : "none";
}

window.cerrarSesion = async function () {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (e) {
    alert("❌ Error al cerrar sesión");
  }
};

// ===== FORMATEO DE NÚMEROS =====
function fmt(n) {
  return "$" + Number(n).toLocaleString("es-CO");
}

function aplicarFormateo(inputId, hiddenId) {
  const input  = document.getElementById(inputId);
  const hidden = document.getElementById(hiddenId);
  if (!input) return;

  input.addEventListener("input", function () {
    const numStr = this.value.replace(/\D/g, "");
    const num    = numStr === "" ? 0 : Number(numStr);
    this.value   = num === 0 ? "" : num.toLocaleString("es-CO");
    if (hidden) hidden.value = num;
  });

  input.addEventListener("blur", function () {
    if (this.value === "" || this.value === "0") this.value = "0";
  });

  input.addEventListener("focus", function () {
    if (this.value === "0") this.value = "";
  });
}

window.addEventListener("DOMContentLoaded", () => {
  aplicarFormateo("ingresoMonto",  "ingresoMontoValue");
  aplicarFormateo("egresoMonto",   "egresoMontoValue");

  // Fecha por defecto
  ["ingresoFecha", "egresoFecha"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = new Date().toISOString().split("T")[0];
  });

  // Mostrar campo "Otro" en egresos
  const selectConcepto = document.getElementById("egresoConcepto");
  if (selectConcepto) {
    selectConcepto.addEventListener("change", function () {
      const grupoOtro = document.getElementById("grupoOtroConcepto");
      if (grupoOtro) {
        grupoOtro.style.display = this.value === "Otro" ? "block" : "none";
      }
    });
  }
});

// ===== TABS =====
window.cambiarTab = function (tab) {
  document.getElementById("tabIngresos").style.display = tab === "ingresos" ? "block" : "none";
  document.getElementById("tabEgresos").style.display  = tab === "egresos"  ? "block" : "none";

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
};

// ===== LISTENERS FIRESTORE =====
function iniciarListeners() {
  // Ingresos
  const qI = query(collection(db, "Ingresos"), orderBy("fecha", "desc"));
  onSnapshot(qI, snap => {
    ingresosGlobal = [];
    snap.forEach(d => ingresosGlobal.push({ id: d.id, data: d.data() }));
    renderIngresos();
    actualizarResumen();
  });

  // Egresos
  const qE = query(collection(db, "Egresos"), orderBy("fecha", "desc"));
  onSnapshot(qE, snap => {
    egresosGlobal = [];
    snap.forEach(d => egresosGlobal.push({ id: d.id, data: d.data() }));
    renderEgresos();
    actualizarResumen();
  });
}

// ===== RESUMEN FINANCIERO =====
function actualizarResumen() {
  totalIngresosGlobal = ingresosGlobal.reduce((s, r) => s + (r.data.monto || 0), 0);
  totalEgresosGlobal  = egresosGlobal.reduce((s, r)  => s + (r.data.monto || 0), 0);
  const saldo = totalIngresosGlobal - totalEgresosGlobal;

  setText("totalIngresos",  fmt(totalIngresosGlobal));
  setText("totalEgresos",   fmt(totalEgresosGlobal));
  setText("cntIngresos",    ingresosGlobal.length + " registros");
  setText("cntEgresos",     egresosGlobal.length  + " registros");

  const saldoEl = document.getElementById("saldoDisponible");
  if (saldoEl) {
    saldoEl.textContent = fmt(saldo);
    saldoEl.style.color = saldo < 0 ? "#ffcccc" : "white";
  }

  renderDesgloseIngresos();
  renderComparativoEgresos();
}

function renderDesgloseIngresos() {
  const container = document.getElementById("desgloseIngresos");
  if (!container) return;

  // Agrupar por rubro
  const rubros = {};
  ingresosGlobal.forEach(r => {
    const rubro = r.data.rubro || "Otros";
    rubros[rubro] = (rubros[rubro] || 0) + (r.data.monto || 0);
  });

  if (Object.keys(rubros).length === 0) {
    container.innerHTML = '<p style="color:#5c6b7d;font-size:0.88rem">Sin ingresos registrados aún.</p>';
    return;
  }

  container.innerHTML = Object.entries(rubros)
    .sort((a, b) => b[1] - a[1])
    .map(([rubro, total]) => `
      <div class="desglose-item">
        <div class="desglose-item-label">${rubro}</div>
        <div class="desglose-item-value">${fmt(total)}</div>
        <div style="font-size:0.75rem;color:#5c6b7d;margin-top:4px">
          vs ${fmt(PRESUPUESTO_INGRESOS[rubro] || 0)} ppto.
        </div>
      </div>
    `).join("");
}

function renderComparativoEgresos() {
  const container = document.getElementById("comparativoEgresos");
  if (!container) return;

  // Agrupar egresos reales por concepto
  const reales = {};
  egresosGlobal.forEach(r => {
    const concepto = r.data.concepto || "Otro";
    reales[concepto] = (reales[concepto] || 0) + (r.data.monto || 0);
  });

  // Combinar presupuesto + real
  const todos = { ...PRESUPUESTO_EGRESOS };
  Object.keys(reales).forEach(k => { if (!todos[k]) todos[k] = 0; });

  const filas = Object.entries(todos)
    .map(([concepto, ppto]) => ({ concepto, ppto, real: reales[concepto] || 0 }))
    .sort((a, b) => b.ppto - a.ppto);

  container.innerHTML = `
    <div class="comp-row header-row">
      <div>Concepto</div>
      <div style="text-align:right">Presupuesto</div>
      <div style="text-align:right">Real</div>
      <div>Avance</div>
    </div>
    ${filas.map(f => {
      const pct = f.ppto > 0 ? Math.min((f.real / f.ppto) * 100, 100) : 0;
      const cls = pct < 75 ? "fill-ok" : pct < 100 ? "fill-over" : "fill-high";
      return `
        <div class="comp-row">
          <div class="comp-name">${f.concepto}</div>
          <div class="comp-num">${fmt(f.ppto)}</div>
          <div class="comp-real">${fmt(f.real)}</div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill ${cls}" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    }).join("")}
  `;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ===== RENDER INGRESOS =====
function renderIngresos() {
  const container = document.getElementById("listaIngresos");
  if (!container) return;

  if (ingresosGlobal.length === 0) {
    container.innerHTML = '<p class="empty-msg">No hay ingresos registrados aún.</p>';
    return;
  }

  container.innerHTML = ingresosGlobal.map(r => {
    const d = r.data;
    return `
      <div class="registro-card">
        <div class="card-head ingreso-head">
          <div class="card-head-left">
            <h3>💵 ${d.rubro || "Ingreso"}</h3>
            <div class="card-sub">${d.diaSemana || ""}, ${d.fecha || ""}</div>
          </div>
          <div class="card-monto">${fmt(d.monto || 0)}</div>
        </div>
        <div class="card-body">
          ${d.congregacion ? rowInfo("🏛️ Congregación / Persona", d.congregacion) : ""}
          ${d.observacion  ? rowInfo("📝 Observación", d.observacion)   : ""}
        </div>
        ${esAdmin ? `
          <div class="card-actions">
            <button class="btn-edit" onclick="editarIngreso('${r.id}')">✏️ Editar</button>
            <button class="btn-del"  onclick="eliminarIngreso('${r.id}')">🗑️ Eliminar</button>
          </div>
        ` : ""}
      </div>
    `;
  }).join("");
}

// ===== RENDER EGRESOS =====
function renderEgresos() {
  const container = document.getElementById("listaEgresos");
  if (!container) return;

  if (egresosGlobal.length === 0) {
    container.innerHTML = '<p class="empty-msg">No hay egresos registrados aún.</p>';
    return;
  }

  container.innerHTML = egresosGlobal.map(r => {
    const d = r.data;
    return `
      <div class="registro-card">
        <div class="card-head egreso-head">
          <div class="card-head-left">
            <h3>💸 ${d.concepto || "Egreso"}</h3>
            <div class="card-sub">${d.diaSemana || ""}, ${d.fecha || ""}</div>
          </div>
          <div class="card-monto">${fmt(d.monto || 0)}</div>
        </div>
        <div class="card-body">
          ${d.descripcion ? rowInfo("📝 Descripción", d.descripcion) : ""}
        </div>
        ${esAdmin ? `
          <div class="card-actions">
            <button class="btn-edit" onclick="editarEgreso('${r.id}')">✏️ Editar</button>
            <button class="btn-del"  onclick="eliminarEgreso('${r.id}')">🗑️ Eliminar</button>
          </div>
        ` : ""}
      </div>
    `;
  }).join("");
}

function rowInfo(lbl, val) {
  return `
    <div class="info-fila">
      <span class="lbl">${lbl}</span>
      <span class="val">${val}</span>
    </div>
  `;
}

// ===== GUARDAR INGRESO =====
window.guardarIngreso = async function () {
  if (!esAdmin) { alert("⛔ Solo el administrador puede registrar ingresos."); return; }

  const fecha        = document.getElementById("ingresoFecha").value;
  const rubro        = document.getElementById("ingresoRubro").value;
  const congregacion = document.getElementById("ingresoCongregacion").value.trim();
  const monto        = Number(document.getElementById("ingresoMontoValue").value);
  const observacion  = document.getElementById("ingresoObservacion").value.trim();

  if (!fecha)        { alert("⚠️ Ingrese la fecha"); return; }
  if (!rubro)        { alert("⚠️ Seleccione el rubro de ingreso"); return; }
  if (monto <= 0)    { alert("⚠️ Ingrese un monto válido"); return; }

  const diaSemana = getDiaSemana(fecha);

  try {
    await addDoc(collection(db, "Ingresos"), {
      fecha, diaSemana, rubro, congregacion, monto, observacion,
      creadoEn: new Date().toISOString()
    });
    alert("✅ Ingreso registrado correctamente");
    limpiarFormIngreso();
  } catch (err) {
    console.error(err);
    alert("❌ Error al guardar: " + err.message);
  }
};

function limpiarFormIngreso() {
  document.getElementById("ingresoRubro").value        = "";
  document.getElementById("ingresoCongregacion").value = "";
  document.getElementById("ingresoMonto").value        = "0";
  document.getElementById("ingresoMontoValue").value   = "0";
  document.getElementById("ingresoObservacion").value  = "";
  document.getElementById("ingresoFecha").value        = new Date().toISOString().split("T")[0];
}

// ===== GUARDAR EGRESO =====
window.guardarEgreso = async function () {
  if (!esAdmin) { alert("⛔ Solo el administrador puede registrar egresos."); return; }

  const fecha        = document.getElementById("egresoFecha").value;
  let   concepto     = document.getElementById("egresoConcepto").value;
  const descripcion  = document.getElementById("egresoDescripcion").value.trim();
  const monto        = Number(document.getElementById("egresoMontoValue").value);

  if (concepto === "Otro") {
    concepto = document.getElementById("egresoOtro").value.trim();
  }

  if (!fecha)        { alert("⚠️ Ingrese la fecha"); return; }
  if (!concepto)     { alert("⚠️ Seleccione o escriba el concepto"); return; }
  if (monto <= 0)    { alert("⚠️ Ingrese un monto válido"); return; }

  const diaSemana = getDiaSemana(fecha);

  try {
    await addDoc(collection(db, "Egresos"), {
      fecha, diaSemana, concepto, descripcion, monto,
      creadoEn: new Date().toISOString()
    });
    alert("✅ Egreso registrado correctamente");
    limpiarFormEgreso();
  } catch (err) {
    console.error(err);
    alert("❌ Error al guardar: " + err.message);
  }
};

function limpiarFormEgreso() {
  document.getElementById("egresoConcepto").value    = "";
  document.getElementById("egresoDescripcion").value = "";
  document.getElementById("egresoMonto").value       = "0";
  document.getElementById("egresoMontoValue").value  = "0";
  document.getElementById("egresoFecha").value       = new Date().toISOString().split("T")[0];
  document.getElementById("grupoOtroConcepto").style.display = "none";
  if (document.getElementById("egresoOtro")) document.getElementById("egresoOtro").value = "";
}

// ===== EDITAR =====
window.editarIngreso = async function (id) {
  if (!esAdmin) return;
  try {
    const snap = await getDoc(doc(db, "Ingresos", id));
    if (!snap.exists()) { alert("❌ No encontrado"); return; }
    const d = snap.data();

    const monto = prompt("Monto:", d.monto);
    if (monto === null) return;
    const congregacion = prompt("Congregación / Persona:", d.congregacion || "");
    if (congregacion === null) return;
    const observacion = prompt("Observación:", d.observacion || "");
    if (observacion === null) return;

    await updateDoc(doc(db, "Ingresos", id), {
      monto: Number(monto), congregacion: congregacion.trim(), observacion: observacion.trim()
    });
    alert("✅ Ingreso actualizado");
  } catch (err) { alert("❌ Error: " + err.message); }
};

window.editarEgreso = async function (id) {
  if (!esAdmin) return;
  try {
    const snap = await getDoc(doc(db, "Egresos", id));
    if (!snap.exists()) { alert("❌ No encontrado"); return; }
    const d = snap.data();

    const monto = prompt("Monto:", d.monto);
    if (monto === null) return;
    const descripcion = prompt("Descripción:", d.descripcion || "");
    if (descripcion === null) return;

    await updateDoc(doc(db, "Egresos", id), {
      monto: Number(monto), descripcion: descripcion.trim()
    });
    alert("✅ Egreso actualizado");
  } catch (err) { alert("❌ Error: " + err.message); }
};

// ===== ELIMINAR =====
window.eliminarIngreso = async function (id) {
  if (!esAdmin) return;
  if (!confirm("⚠️ ¿Eliminar este ingreso? Esta acción no se puede deshacer.")) return;
  try {
    await deleteDoc(doc(db, "Ingresos", id));
    alert("✅ Ingreso eliminado");
  } catch (err) { alert("❌ Error: " + err.message); }
};

window.eliminarEgreso = async function (id) {
  if (!esAdmin) return;
  if (!confirm("⚠️ ¿Eliminar este egreso? Esta acción no se puede deshacer.")) return;
  try {
    await deleteDoc(doc(db, "Egresos", id));
    alert("✅ Egreso eliminado");
  } catch (err) { alert("❌ Error: " + err.message); }
};

// ===== UTILIDADES =====
function getDiaSemana(fechaStr) {
  const [a, m, d] = fechaStr.split("-");
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return dias[new Date(a, m - 1, d).getDay()];
}

export { db, auth, ingresosGlobal, egresosGlobal, totalIngresosGlobal, totalEgresosGlobal, PRESUPUESTO_EGRESOS, PRESUPUESTO_INGRESOS };
