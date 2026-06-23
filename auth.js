import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBee2kGF_exUOqA9GKBbD5cHJEDTqgpXCA",
  authDomain: "convencion-d44d8.firebaseapp.com",
  projectId: "convencion-d44d8",
  storageBucket: "convencion-d44d8.firebasestorage.app",
  messagingSenderId: "902388942151",
  appId: "1:902388942151:web:68c8a9e069aae7150cb862"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("🔥 Firebase Convención Sahagún conectado");

// ===== LOGIN =====
window.login = function () {
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("⚠️ Ingrese correo y contraseña");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch((err) => {
      console.error("Error login:", err);
      let msg = "Correo o contraseña incorrectos.";
      if (err.code === "auth/too-many-requests") {
        msg = "Demasiados intentos fallidos. Intente más tarde.";
      }
      alert("❌ Error: " + msg);
    });
};

// ===== CREAR USUARIO (máximo 3) =====
window.crearUsuario = async function () {
  const email    = document.getElementById("newEmail").value.trim();
  const password = document.getElementById("newPassword").value;

  if (!email || !password) {
    alert("⚠️ Ingrese correo y contraseña");
    return;
  }

  if (password.length < 6) {
    alert("⚠️ La contraseña debe tener mínimo 6 caracteres");
    return;
  }

  try {
    // Verificar cuántos usuarios hay
    const col = collection(db, "usuarios");
    const snap = await getDocs(col);

    // Máximo 3 usuarios
  if (snap.size >= 3) {
      alert("⚠️ Ya existen 3 usuarios. No se pueden crear más.\n\nElimine uno para poder crear otro.");
      return;
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await addDoc(col, {
      uid:       cred.user.uid,
      email:     email,
      creadoEn:  new Date().toISOString()
    });

    alert("✅ Usuario creado correctamente\n\n" + email);

    document.getElementById("newEmail").value    = "";
    document.getElementById("newPassword").value = "";
    toggleCrear();

  } catch (err) {
    console.error("Error creando usuario:", err);
    let msg = err.message;
    if (err.code === "auth/email-already-in-use") {
      msg = "Ese correo ya está registrado.";
    }
    alert("❌ Error: " + msg);
  }
};

// ===== TOGGLE FORMULARIO CREAR =====
window.toggleCrear = function () {
  const box = document.getElementById("createUserBox");
  if (!box) return;
  box.style.display = (box.style.display === "none" || box.style.display === "") ? "block" : "none";
};

export { app, auth, db };
