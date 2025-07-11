// --- Firebase konfigurieren und initialisieren ---
// Ersetze die Werte mit deinen Firebase-Projektangaben
const firebaseConfig = {
  apiKey: "AIzaSyD43TYRuIZxI1pS_noOzlKCIEzUm8Q7FiQ",
  authDomain: "promille-b4bd3.firebaseapp.com",
  databaseURL: "https://promille-b4bd3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "promille-b4bd3",
  storageBucket: "promille-b4bd3.firebasestorage.app",
  messagingSenderId: "627353030877",
  appId: "1:627353030877:web:18285915baa3744ebbcb34",
};

// Firebase App initialisieren (nur einmal!)
firebase.initializeApp(firebaseConfig);

// Realtime Database Referenz initialisieren
const db = firebase.database();

// Firebase Messaging initialisieren (compat)
const messaging = firebase.messaging();


// --- App-Variablen ---
let userData = {};
let drinks = [];

const drinksData = [
  { type: "bier", name: "Bier", img: "images/bier.png", amount: 0.33, alc: 5.3 },
  { type: "wein", name: "Wein", img: "images/wein.png", amount: 0.2, alc: 14.0 },
  { type: "kabull", name: "Kabull", img: "images/kabull.png", amount: 0.3, alc: 12.0 },
  { type: "monte", name: "Monte", img: "images/monte.png", amount: 0.1, alc: 23.0 },
  { type: "shot", name: "Shot", img: "images/shot.png", amount: 0.04, alc: 30.0 },
  { type: "veneziano", name: "Veneziano", img: "images/veneziano.png", amount: 0.4, alc: 10.0 }
];

let currentDrinkIndex = 0;


// --- Hilfsfunktion: Benutzernamen für Firebase-Key "säubern" ---
function sanitizeKey(name) {
  return name.replace(/[^a-zA-Z0-9-_]/g, "_");
}


// --- Push-Berechtigung anfragen und Token speichern ---
function requestPushPermissionAndToken() {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      messaging.getToken({
        vapidKey: 'BLXKIJi31DHoEr083zJkotuGDcPQFmBiM5KHwXHahGpIbcLliw0pyEinaPbIg64gaM2KxIZhwH0JTxis4RDDfZs' // VAPID-Key von Firebase Console einfügen
      }).then(token => {
        console.log('Push Token erhalten:', token);
        const user = JSON.parse(localStorage.getItem("userData") || "{}");
        if (user.username) {
          const safeName = sanitizeKey(user.username);
          db.ref('fcmTokens/' + safeName).set(token)
            .then(() => console.log('Token gespeichert in DB'))
            .catch(err => console.error('Fehler DB speichern:', err));
        }
      }).catch(err => console.error('Fehler Token holen:', err));
    } else {
      console.log('Push-Berechtigung nicht erteilt');
    }
  });
}


// --- Update Anzeige der Trinkmenge und Alkoholgehalt ---
function updateDrinkLabels() {
  document.getElementById("amountLabel").innerText = parseFloat(document.getElementById("amount").value).toFixed(2);
  document.getElementById("alcLabel").innerText = parseFloat(document.getElementById("alcohol").value).toFixed(1);
}


// --- Update Drink Bild und Eingabewerte ---
function updateDrinkUI() {
  const drink = drinksData[currentDrinkIndex];
  const img = document.getElementById("drinkImage");
  img.src = drink.img;
  img.alt = drink.name;

  document.getElementById("amount").value = drink.amount;
  document.getElementById("alcohol").value = drink.alc;

  updateDrinkLabels();
}


// --- Trinkzeit in ms berechnen ---
function getTrinkzeitByMenge(menge) {
  return menge * 30 * 60 * 1000; // Menge * 30 Minuten in ms
}


// --- Promille berechnen ---
function calculatePromille() {
  if (!userData.weight || !userData.gender) return 0;

  const r = userData.gender === "male" ? 0.68 : 0.55;
  const now = Date.now();

  const abbauRate = userData.gender === "male" ? 0.12 : 0.10; // g/kg/h
  const abbauGrammProStd = abbauRate * userData.weight * r;

  let aufgenommen = 0;
  let abgebaut = 0;

  for (const drink of drinks) {
    const dauer = drink.timeEnd - drink.timeStart;
    const absorbiert = Math.min(1, Math.max(0, (now - drink.timeStart) / dauer));
    const alk = drink.grams * absorbiert;

    aufgenommen += alk;

    if (absorbiert > 0.2) {
      const abbauStart = drink.timeStart + dauer * 0.2;
      const abbauZeit = Math.max(0, now - abbauStart) / 3600000;
      abgebaut += Math.min(alk, abbauGrammProStd * abbauZeit);
    }
  }

  const netto = Math.max(0, aufgenommen - abgebaut);
  return (netto / (userData.weight * r)).toFixed(2);
}


// --- Promillewert im UI aktualisieren ---
function updatePromille() {
  const promille = calculatePromille();
  const promilleSpan = document.getElementById("promille");
  promilleSpan.innerText = promille;
  const val = parseFloat(promille);
  promilleSpan.style.color = val >= 1.5 ? "green" : val <= 0.1 ? "red" : "orange";
  if (promille >= 1) {
    notifyWithSound("Du hast 1 Promille erreicht!");
  }
}


// --- Drink hinzufügen ---
function addDrink() {
  const now = Date.now();
  const amount = parseFloat(document.getElementById("amount").value);
  const alcVol = parseFloat(document.getElementById("alcohol").value);
  const type = drinksData[currentDrinkIndex].type;

  const ml = amount * 1000 * (alcVol / 100);
  const grams = ml * 0.789;

  drinks.push({
    type,
    grams,
    timeStart: now,
    timeEnd: now + getTrinkzeitByMenge(amount)
  });

  localStorage.setItem("drinks", JSON.stringify(drinks));
  updatePromille();

  const btn = document.getElementById("addDrinkBtn");
  btn.disabled = true;

  // Animation neu starten
  btn.classList.remove("shake-bottom");
  void btn.offsetWidth; // Erzwingt Reflow
  btn.classList.add("shake-bottom");

  setTimeout(() => btn.disabled = false, 1000);
}


// --- Benutzer-Login und speichern ---
function loginAndSaveUser() {
  const username = document.getElementById("username").value.trim();
  const weight = parseFloat(document.getElementById("weight").value);
  const gender = document.getElementById("gender").value;

  if (!username || isNaN(weight) || weight <= 0) {
    alert("Bitte gültigen Namen und Gewicht eingeben.");
    return;
  }

  userData = { username, weight, gender };
  localStorage.setItem("userData", JSON.stringify(userData));

  document.getElementById("setup").style.display = "none";
  document.getElementById("drinks").style.display = "block";
  document.getElementById("status").style.display = "block";

  drinks = JSON.parse(localStorage.getItem("drinks") || "[]");
  updatePromille();
  updateDrinkUI();
  const img = document.getElementById("drinkImage");
  img.classList.add("swipe");

  setTimeout(() => {
    img.classList.remove("swipe");
  }, 3200);

  // Push-Permission & Token holen nach Login
  requestPushPermissionAndToken();
}


// --- Benutzername prüfen ob schon vergeben ---
function checkUsernameExists(username) {
  const safeName = sanitizeKey(username);
  return db.ref("scores/" + safeName).once("value")
    .then(snapshot => snapshot.exists());
}


// --- Start der Promille-Berechnung (Login) ---
function startPromilleBerechnung() {
  const username = document.getElementById("username").value.trim();
  if (!username) {
    alert("Bitte Namen eingeben.");
    return;
  }

  checkUsernameExists(username).then(exists => {
    if (exists) {
      alert("Name ist bereits vergeben. Bitte anderen wählen.");
      return;
    } else {
      // App starten
      loginAndSaveUser();
    }
  });
}


// --- App zurücksetzen ---
function resetApp() {
  if (confirm("Zurücksetzen?")) {
    const user = JSON.parse(localStorage.getItem("userData") || "{}");
    const username = user.username;

    if (username) {
      const safeName = sanitizeKey(username);
      db.ref("scores/" + safeName).remove()
        .then(() => {
          console.log("Score gelöscht für:", username);
        })
        .catch(err => console.error("Fehler beim Löschen:", err));
    }

    localStorage.clear();
    location.reload();
  }
}


// --- Animation beim Klick auf Status-Button + Push senden ---
function animatePromilleButton() {
  const status = document.getElementById("status");
  if (!status) return;

  // Animation starten
  status.classList.add("animate");
  setTimeout(() => status.classList.remove("animate"), 300);

  // Push-Nachricht senden
  const user = JSON.parse(localStorage.getItem("userData") || "{}");
  if (!user.username) return;

  fetch("https://us-central1-promille-b4bd3.cloudfunctions.net/sendDrinkNotification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name: user.username }) // Wichtig: POST senden mit "name"
  })
    .then(res => {
      if (!res.ok) throw new Error("Netzwerkantwort war nicht ok");
      return res.json();
    })
    .then(data => {
      console.log("Antwort von Cloud Function:", data);
      // Optional: Du kannst alert() durch eine sanfte UI-Nachricht ersetzen
      alert("Benachrichtigung gesendet!");
    })
    .catch(err => {
      console.error("Fehler beim Senden der Nachricht:", err);
      alert("Fehler beim Senden der Benachrichtigung.");
    });
}

// --- Swipe-Handling für Drink-Bild ---
let startX = 0, isDragging = false;
const img = document.getElementById("drinkImage");

img.addEventListener("pointerdown", (e) => {
  isDragging = true;
  startX = e.clientX;
  img.style.transition = "none";
});

img.addEventListener("pointermove", (e) => {
  if (!isDragging) return;
  const dx = e.clientX - startX;
  img.style.transform = `translateX(${dx}px)`;
});

img.addEventListener("pointerup", (e) => {
  if (!isDragging) return;
  isDragging = false;
  img.style.transition = "transform 0.3s ease";

  const dx = e.clientX - startX;
  if (dx > 50) currentDrinkIndex = (currentDrinkIndex - 1 + drinksData.length) % drinksData.length;
  else if (dx < -50) currentDrinkIndex = (currentDrinkIndex + 1) % drinksData.length;

  updateDrinkUI();
  img.style.transform = "translateX(0)";
});

img.addEventListener("pointercancel", () => {
  isDragging = false;
  img.style.transform = "translateX(0)";
});


// --- Window onload: Initialisierung ---
window.onload = () => {
  const saved = localStorage.getItem("userData");
  if (saved) {
    userData = JSON.parse(saved);
    document.getElementById("username").value = userData.username;
    document.getElementById("weight").value = userData.weight;
    document.getElementById("gender").value = userData.gender;

    document.getElementById("setup").style.display = "none";
    document.getElementById("drinks").style.display = "block";
    document.getElementById("status").style.display = "block";
  }

  drinks = JSON.parse(localStorage.getItem("drinks") || "[]");

  updateDrinkUI();
  updatePromille();

  // Promille alle 5 Sekunden aktualisieren
  setInterval(updatePromille, 5000);

  const img = document.getElementById("drinkImage");
  img.classList.add("swipe");

  setTimeout(() => {
    img.classList.remove("swipe");
  }, 3200);
};


// --- Benachrichtigung mit Sound ---
function notifyWithSound(title, body, soundUrl) {
  if (!("Notification" in window)) {
    console.warn("Browser unterstützt keine Benachrichtigungen.");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, { body });

    if (soundUrl) {
      const audio = new Audio(soundUrl);
      audio.play().catch((err) => {
        console.warn("Sound konnte nicht abgespielt werden:", err);
      });
    }
  } else {
    console.log("Keine Berechtigung für Notifications.");
  }
}


// --- Button-Shake Animation (für Buttons mit Klasse shake-btn) ---
const buttons = document.querySelectorAll('.shake-btn');

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.remove('shake-bottom'); // alte Animation entfernen
    void btn.offsetWidth;                 // Reflow erzwingen
    btn.classList.add('shake-bottom');   // neue Animation starten
  });
});
// --- Score speichern ---
function autoSubmitScore() {
  const user = JSON.parse(localStorage.getItem("userData") || "{}");
  const name = user.username;
  const promilleText = document.getElementById("promille")?.innerText || "0";
  const promille = parseFloat(promilleText);

  if (!name || isNaN(promille)) return;

  const safeName = sanitizeKey(name);
  const userScoreRef = db.ref("scores/" + safeName);

  userScoreRef.set({ name, score: Number(promille) });
  console.log("Gespeichert:", name, promille);
}

// --- Leaderboard aktualisieren ---
function updateLeaderboard() {
  const scoresRef = db.ref("scores");

  scoresRef.once("value", snapshot => {
    const scores = [];

    snapshot.forEach(child => {
      const val = child.val();
      if (typeof val.score === 'number' && typeof val.name === 'string') {
        scores.push(val);
      }
    });

    scores.sort((a, b) => b.score - a.score);
    const top4 = scores.slice(0, 4);

    const tbody = document.getElementById("leaderboardBody");
    if (tbody) {
      tbody.innerHTML = "";
      top4.forEach((entry, i) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${i + 1}</td><td>${entry.name}</td><td>${entry.score.toFixed(2)}‰</td>`;
        tbody.appendChild(row);
      });
    }

    const top4Section = document.getElementById("top4Section");
    if (top4Section) {
      top4Section.innerHTML = top4.map((e, i) =>
        `${i + 1}. ${e.name}: ${e.score.toFixed(2)}‰`
      ).join("<br>");
    }
  });
}

// --- Intervall für Leaderboard + Speichern ---
setInterval(() => {
  autoSubmitScore();
  updateLeaderboard();
}, 10000);
