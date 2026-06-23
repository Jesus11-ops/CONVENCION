import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

const ADMIN_EMAIL = "Adminconvencion@gmail.com";

const PRESUPUESTO_EGRESOS = {
  "Gerencia General": 200000, "Gerencia Ejecutiva": 200000, "Gerencia Administrativa": 200000,
  "Predicadores": 2650000, "Sonido": 2200000, "Músicos Invitados": 1000000,
  "Logística y Trasteo": 500000, "Alimentación": 2250000, "Publicidad y Decoración": 800000,
  "Hotel": 50000, "Imprevistos": 1150000, "Relaciones Públicas": 500000,
  "Aseo": 450000, "SEPRI": 550000, "Electricidad": 300000,
  "Finanzas": 50000, "Silletería": 825000, "Espiritual": 70000,
  "Música": 300000, "Vigilancia": 350000, "Ujieres y Recepción": 200000, "Decoración": 350000,
};

const PRESUPUESTO_INGRESOS = {
  "Aporte Zonal": 5000000, "Ofrendas": 6545000, "Aportes Pastores": 1900000,
  "Culto Lanzamiento": 1000000, "Varios": 700000,
};

window.exportarExcel = async function () {
  const user = auth.currentUser;
  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    alert("⛔ Solo el administrador puede exportar datos.");
    return;
  }

  // Cargar ExcelJS
  if (!window.ExcelJS) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src     = "https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js";
      s.onload  = res;
      s.onerror = () => rej(new Error("No se pudo cargar ExcelJS"));
      document.head.appendChild(s);
    });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "Convención Zonal Sahagún - IPUC";
  wb.created = new Date();

  // ======= HOJA 1: INGRESOS =======
  const wsI = wb.addWorksheet("Ingresos");
  wsI.columns = [
    { header: "Fecha",        key: "fecha",         width: 14 },
    { header: "Día",          key: "dia",            width: 12 },
    { header: "Rubro",        key: "rubro",          width: 22 },
    { header: "Congregación", key: "congregacion",   width: 28 },
    { header: "Monto",        key: "monto",          width: 16 },
    { header: "Observación",  key: "observacion",    width: 30 },
  ];

  estiloHeader(wsI.getRow(1), "FF1a3a6b");

  const snapI = await getDocs(query(collection(db, "Ingresos"), orderBy("fecha", "asc")));
  let totalIngresos = 0;
  snapI.forEach(d => {
    const r = d.data();
    const row = wsI.addRow({
      fecha: r.fecha || "", dia: r.diaSemana || "", rubro: r.rubro || "",
      congregacion: r.congregacion || "", monto: r.monto || 0, observacion: r.observacion || ""
    });
    row.getCell("monto").numFmt = '#,##0';
    totalIngresos += r.monto || 0;
    alternarFila(row, wsI.rowCount);
  });

  const filaTotalI = wsI.addRow(["", "", "", "TOTAL INGRESOS", totalIngresos, ""]);
  filaTotalI.eachCell((cell, col) => {
    cell.font = { bold: true };
    if (col === 5) { cell.numFmt = '#,##0'; cell.fill = solidFill("FF0d7a4e"); cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; }
  });

  // ======= HOJA 2: EGRESOS =======
  const wsE = wb.addWorksheet("Egresos");
  wsE.columns = [
    { header: "Fecha",       key: "fecha",       width: 14 },
    { header: "Día",         key: "dia",          width: 12 },
    { header: "Concepto",    key: "concepto",     width: 28 },
    { header: "Descripción", key: "descripcion",  width: 35 },
    { header: "Monto",       key: "monto",        width: 16 },
  ];

  estiloHeader(wsE.getRow(1), "FFc0392b");

  const snapE = await getDocs(query(collection(db, "Egresos"), orderBy("fecha", "asc")));
  let totalEgresos = 0;
  snapE.forEach(d => {
    const r = d.data();
    const row = wsE.addRow({
      fecha: r.fecha || "", dia: r.diaSemana || "", concepto: r.concepto || "",
      descripcion: r.descripcion || "", monto: r.monto || 0
    });
    row.getCell("monto").numFmt = '#,##0';
    totalEgresos += r.monto || 0;
    alternarFila(row, wsE.rowCount);
  });

  const filaTotalE = wsE.addRow(["", "", "", "TOTAL EGRESOS", totalEgresos]);
  filaTotalE.eachCell((cell, col) => {
    cell.font = { bold: true };
    if (col === 5) { cell.numFmt = '#,##0'; cell.fill = solidFill("FFc0392b"); cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; }
  });

  // ======= HOJA 3: PRESUPUESTO vs REAL =======
  const wsP = wb.addWorksheet("Presupuesto vs Real");
  wsP.columns = [
    { header: "Concepto",         key: "concepto",   width: 30 },
    { header: "Presupuestado",    key: "ppto",        width: 18 },
    { header: "Real Ejecutado",   key: "real",        width: 18 },
    { header: "Diferencia",       key: "diff",        width: 18 },
    { header: "% Ejecución",      key: "pct",         width: 14 },
  ];

  estiloHeader(wsP.getRow(1), "FF1a3a6b");

  // Sección Egresos
  wsP.addRow(["--- EGRESOS ---", "", "", "", ""]).eachCell(c => {
    c.font = { bold: true, color: { argb: "FFc0392b" } };
  });

  // Agrupar reales
  const realesEg = {};
  snapE.forEach(d => {
    const r = d.data();
    realesEg[r.concepto] = (realesEg[r.concepto] || 0) + (r.monto || 0);
  });

  let sumPptoEg = 0, sumRealEg = 0;
  Object.entries(PRESUPUESTO_EGRESOS).forEach(([concepto, ppto]) => {
    const real = realesEg[concepto] || 0;
    const diff = real - ppto;
    const pct  = ppto > 0 ? ((real / ppto) * 100).toFixed(1) + "%" : "N/A";
    const row  = wsP.addRow({ concepto, ppto, real, diff, pct });
    ["ppto", "real", "diff"].forEach(k => row.getCell(k).numFmt = '#,##0');
    if (diff > 0) row.getCell("diff").font = { color: { argb: "FFc0392b" } };
    alternarFila(row, wsP.rowCount);
    sumPptoEg += ppto; sumRealEg += real;
  });

  const totEg = wsP.addRow(["TOTAL EGRESOS", sumPptoEg, sumRealEg, sumRealEg - sumPptoEg, ""]);
  totEg.eachCell((c, col) => {
    c.font = { bold: true };
    if ([2, 3, 4].includes(col)) c.numFmt = '#,##0';
  });

  wsP.addRow([]);

  // Sección Ingresos
  wsP.addRow(["--- INGRESOS ---", "", "", "", ""]).eachCell(c => {
    c.font = { bold: true, color: { argb: "FF0d7a4e" } };
  });

  const realesIng = {};
  snapI.forEach(d => {
    const r = d.data();
    realesIng[r.rubro] = (realesIng[r.rubro] || 0) + (r.monto || 0);
  });

  let sumPptoIng = 0, sumRealIng = 0;
  Object.entries(PRESUPUESTO_INGRESOS).forEach(([rubro, ppto]) => {
    const real = realesIng[rubro] || 0;
    const diff = real - ppto;
    const pct  = ppto > 0 ? ((real / ppto) * 100).toFixed(1) + "%" : "N/A";
    const row  = wsP.addRow({ concepto: rubro, ppto, real, diff, pct });
    ["ppto", "real", "diff"].forEach(k => row.getCell(k).numFmt = '#,##0');
    alternarFila(row, wsP.rowCount);
    sumPptoIng += ppto; sumRealIng += real;
  });

  const totIng = wsP.addRow(["TOTAL INGRESOS", sumPptoIng, sumRealIng, sumRealIng - sumPptoIng, ""]);
  totIng.eachCell((c, col) => {
    c.font = { bold: true };
    if ([2, 3, 4].includes(col)) c.numFmt = '#,##0';
  });

  // ======= HOJA 4: RESUMEN EJECUTIVO =======
  const wsR = wb.addWorksheet("Resumen Ejecutivo");
  wsR.columns = [{ width: 32 }, { width: 20 }];

  const titulo = wsR.addRow(["RESUMEN FINANCIERO CONVENCIÓN ZONAL SAHAGÚN", ""]);
  titulo.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  titulo.fill = solidFill("FF1a3a6b");
  wsR.mergeCells(`A${titulo.number}:B${titulo.number}`);

  wsR.addRow([]);

  const fecha = wsR.addRow(["Fecha de exportación:", new Date().toLocaleDateString("es-CO")]);
  fecha.getCell(1).font = { bold: true };

  wsR.addRow([]);

  addResumenFila(wsR, "Total Ingresos", totalIngresos, "FF0d7a4e");
  addResumenFila(wsR, "Total Egresos",  totalEgresos,  "FFc0392b");
  wsR.addRow([]);
  addResumenFila(wsR, "SALDO DISPONIBLE", totalIngresos - totalEgresos, totalIngresos - totalEgresos >= 0 ? "FF1a3a6b" : "FFc0392b");
  wsR.addRow([]);
  addResumenFila(wsR, "Presupuesto Total Egresos", 15145000, "FF5c6b7d");
  addResumenFila(wsR, "Presupuesto Total Ingresos", 15145000, "FF5c6b7d");

  // Descargar
  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `convencion_sahagun_${new Date().toISOString().split("T")[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);

  alert("✅ Excel exportado con 4 hojas:\n1. Ingresos\n2. Egresos\n3. Presupuesto vs Real\n4. Resumen Ejecutivo");
};

// ===== HELPERS =====
function estiloHeader(row, colorArgb) {
  row.height = 22;
  row.eachCell(cell => {
    cell.fill = solidFill(colorArgb);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
}

function solidFill(argb) {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function alternarFila(row, num) {
  if (num % 2 === 0) {
    row.eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F9FD" } };
    });
  }
}

function addResumenFila(ws, label, value, colorArgb) {
  const row = ws.addRow([label, value]);
  row.getCell(1).font = { bold: true };
  row.getCell(2).numFmt = '#,##0';
  row.getCell(2).fill = solidFill(colorArgb);
  row.getCell(2).font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.getCell(2).alignment = { horizontal: "right" };
}
