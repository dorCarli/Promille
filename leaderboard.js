function checkUsernameExists(username) {
  return db.ref("scores/" + sanitizeKey(username)).once("value")
    .then(snapshot => snapshot.exists());
}

// Hilfsfunktion: ungültige Zeichen in Firebase-Schlüssel ersetzen
function sanitizeKey(name) {
  return name.replace(/[.#$/\[\]]/g, "_");
}

// Score speichern/überschreiben
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


// Leaderboard aktualisieren
function updateLeaderboard() {
  const scoresRef = db.ref("scores");

  scoresRef.once("value", snapshot => {
    const scores = [];

    snapshot.forEach(child => {
      const val = child.val();
      // Nur Scores pushen, die wirklich gültige Werte enthalten
      if (typeof val.score === 'number' && typeof val.name === 'string') {
        scores.push(val);
      }
    });

    // Sortiere absteigend
    scores.sort((a, b) => b.score - a.score);

    // Top 4 extrahieren
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

    // Optional: cleane Top-4-Zusatzanzeige
    const top4Section = document.getElementById("top4Section");
    if (top4Section) {
      top4Section.innerHTML = top4.map((e, i) =>
        `${i + 1}. ${e.name}: ${e.score.toFixed(2)}‰`
      ).join("<br>");
    }
  });
}


// Initiales Laden
updateLeaderboard();

// Automatisches Aktualisieren alle 10 Sekunden
setInterval(() => {
  autoSubmitScore();
  updateLeaderboard();
}, 10000);
