// DOWNLOAD APP ON MOBILE
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("Service Worker enregistré"))
      .catch((err) => console.log("Erreur SW:", err));
  });
}

// Date du jour
const currentDate = document.querySelector(".currentDate");
// Début de service
const startTime = document.querySelector(".startTime");
// Amplitude actuelle
const currentlyWorked = document.querySelector(".currentlyWorked");
// btn start
const start = document.querySelector(".start");
// btn drive
const drive = document.querySelector(".drive");
// btn waiting
const waiting = document.querySelector(".waiting");
// btn rest
const rest = document.querySelector(".rest");
// btn finish
const finish = document.querySelector(".finish");
// tableau de btn
const buttons = [drive, waiting, rest, finish];
// message fin de journée
const endOfDayMsg = document.querySelector(".endOfDay");
// journal de la journée
const listOfActivitites = document.querySelector(".listOfActivities");
// resumé de la journée
const resumeOfActivities = document.querySelector(".resumeOfActivities");

// initialisation du state
let state = JSON.parse(localStorage.getItem("busTrackerState")) || [];

let chronoInterval = null;

// enregistre les changements de state dans le localStorage
const saveState = () => {
  localStorage.setItem("busTrackerState", JSON.stringify(state));
};

// // affichage de la date du jour en francais
const displayDate = () => {
  const today = new Date();

  const options = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };

  const todayToLocaleStr = today.toLocaleDateString("fr-FR", options);

  return todayToLocaleStr;
};

const calcDuration = (currentStatut, type, detail) => {
  const activeDay = state.find((st) => !st.isFinished);
  if (!activeDay) {
    return;
  }

  // on calcule la durée de l'activité qui vient de se terminer
  activeDay.datas.forEach((data) => {
    if (!data.isFinished) {
      const start = data.start;
      data.end = getTime();
      const end = data.end;

      // on convertit les chaines de charactère de start et end en tableau, et on les passe au format Number
      const [startH, startM, startS] = start.split(":").map(Number);
      const [endH, endM, endS] = end.split(":").map(Number);

      // on convertit le total heures et minutes en minutes totales depuis minuit (on ignore les secondes dans cette fonction)
      let startMinutes = startH * 60 + startM;
      let endMinutes = endH * 60 + endM;

      const diffMinutes = endMinutes - startMinutes;
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      data.duration = `${pad(hours)}:${pad(minutes)}`;
      data.isFinished = true;
    }
  });

  if (
    currentStatut != "finish" &&
    type != "FNS" &&
    detail != "Fin de journée"
  ) {
    // on crée une nouvelle activité selon le bouton sur lequel on a cliqué
    activeDay.currentStatut = currentStatut;
    activeDay.datas.push({
      type: type,
      start: getTime(),
      end: "",
      duration: "",
      isFinished: false,
      detail: detail,
    });
  }

  saveState();
  render();
};

// création d'un nouvel objet au clic sur btn "Prise de service"
const startOfDay = () => {
  const today = new Date();
  // on cré un objet qui representera une journée de travail (la journée actuelle jusqu'a que l'on clique sur "Fin de journée")
  const workDay = {
    date: today.toLocaleDateString("fr-FR"),
    start: getTime(),
    drive: "",
    waiting: "",
    rest: "",
    finish: "",
    amplitude: "",
    datas: [
      {
        type: "TTE",
        start: getTime(),
        end: "",
        duration: "",
        isFinished: false,
        detail: "Prise de service",
      },
    ],
    isFinished: false,
    currentStatut: "drive",
    week: getCurrentWeek(today),
  };

  // on ajoute le nouvel objet au state
  state.push(workDay);

  // on envoi le nouveau state au localStorage
  saveState();

  // on fait appel a render() pour actualiser l'affichage
  render();
};

// par default, seul le btn prise de service est activé
const defaultButtons = () => {
  // le bouton start est activé
  start.disabled = false;
  start.classList.remove("disabled");
  // tout les autres sont desactivés
  buttons.forEach((btn) => {
    btn.disabled = true;
    btn.classList.add("disabled");
  });
};

// quand la journée est commencé, on désactive btn start, et on active les autres btns
const whenDayIsStartedButtons = () => {
  // le bouton start est désactivé
  start.disabled = true;
  start.classList.add("disabled");
  // le bouton reprendre conduite est desactivé tant qu'on a pas cliqué une premiere fois sur attente sur place ou sur repos
  drive.disabled = true;
  drive.classList.add("disabled");
  // tout les autres sont activés
  buttons.forEach((btn, index) => {
    // on ignore le premier btn du tableau
    if (index === 0) {
      return;
    }
    btn.disabled = false;
    btn.classList.remove("disabled");
  });
};

const whenWeAreWaiting = () => {
  // le bouton start est désactivé
  start.disabled = true;
  start.classList.add("disabled");
  buttons.forEach((btn, index) => {
    // on ignore le premier btn du tableau
    if (index === 1 || index === 2) {
      btn.disabled = true;
      btn.classList.add("disabled");
    } else {
      btn.disabled = false;
      btn.classList.remove("disabled");
    }
  });
};

// renvoi l'heure/minutes/secondes a laquelle on a cliqué sur "Prise de Service" (représente le début de la journée de travail)
const getTime = () => {
  const time = new Date();

  let hours = time.getHours();
  let minutes = time.getMinutes();
  let seconds = time.getSeconds();

  // Ajoute 0 si les heures/minutes < 10
  hours = pad(hours);
  minutes = pad(minutes);
  seconds = pad(seconds);

  const startOfDay = `${hours}:${minutes}:${seconds}`;

  return startOfDay;
};

// au clic sur "Fin de Service",
// - on actualise l'objet créé en début de journée avec les données "finish", "isFinished", "amplitude",
// - on remet l'affichage de "Début de service" et "Amplitude" a zero
// - on reactive le btn "Prise de Service" et on lui rend sa couleur
const endOfDay = (finish) => {
  // actualisation du state actif
  finish.amplitude = currentlyWorked.textContent;
  finish.finish = getTime();
  finish.isFinished = true;
  finish.currentStatut = "finish";

  const totals = getTotalsByType(finish.datas);

  finish.totals = totals;

  // on envoi le nouveau state au localStorage
  saveState();

  // on fait appel a render() pour actualiser l'affichage
  render();
};

// triple fonctions pour calculer le total des activités de la journée
const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad(h)}:${pad(m)}`;
};
const getTotalsByType = (datas) => {
  const totals = {};

  datas.forEach((data) => {
    if (!data.duration) return;

    const minutes = toMinutes(data.duration);

    if (!totals[data.type]) {
      totals[data.type] = 0;
    }

    totals[data.type] += minutes;
  });

  // conversion finale en HH:MM
  Object.keys(totals).forEach((type) => {
    totals[type] = toHHMM(totals[type]);
  });

  return totals;
};

// transforme la chaine de caractère de state.start en tableau
const getStartOfDay = (startTime) => {
  let arrayStart = startTime.split(":");

  return arrayStart;
};

// formater les nb sur 2 chiffres
const pad = (num) => {
  return num.toString().padStart(2, "0");
};

// mettre a jour le chrono
const updateChrono = (array) => {
  // chronometre
  const arrayStart = array;
  const startHour = Number(arrayStart[0]);
  const startMinute = Number(arrayStart[1]);
  const startSecond = Number(arrayStart[2]);

  // config heure de départ
  let startDateTime = new Date();
  startDateTime.setHours(startHour, startMinute, startSecond, 0);
  const now = new Date();

  let diffMs = now - startDateTime;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  currentlyWorked.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

// calcule le numéro de la semaine en cours
const getCurrentWeek = (date) => {
  let currentdate = date;
  let oneJan = new Date(currentdate.getFullYear(), 0, 1);
  let numberOfDays = Math.floor((currentdate - oneJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((currentdate.getDay() + 1 + numberOfDays) / 7);
};

// RENDER
const render = () => {
  // par default, seul le btn prise de service est activé
  defaultButtons();

  // AMELIORATION POSSIBLE POUR REMPLACER state.forEach(())
  const activeDay = state.find((day) => !day.isFinished)
    ? state.find((day) => !day.isFinished)
    : "Pas de journée active";

  // on verifie si il y a une journée en cours
  if (activeDay === state.find((day) => !day.isFinished)) {
    startTime.textContent = activeDay.start;

    // on change l'état des boutons selon le type d'activité en cours
    switch (activeDay.currentStatut) {
      case "drive":
        whenDayIsStartedButtons();
        break;
      case "waiting":
        whenWeAreWaiting();
        break;
      case "rest":
        whenWeAreWaiting();
        break;
      default:
        break;
    }

    // si oui, le chronometre se lance pour calculer l'amplitude de la journée
    if (!chronoInterval) {
      chronoInterval = setInterval(() => {
        updateChrono(getStartOfDay(activeDay.start));
      }, 1000);
    }
    updateChrono(getStartOfDay(activeDay.start));

    // on affiche le journal d'activité de la journée en cours
    listOfActivitites.innerHTML = "";
    let html = "";

    activeDay.datas.forEach((data) => {
      html += `
          <li>
            <span class="hours">${data.start} : </span>
            <div class="displayDetails">
              <span class="detail"> ${data.detail} </span>
              <span class="title"> ${data.type}</span>
            </div>
          </li>
        `;
    });

    listOfActivitites.innerHTML = html;
    // sinon
  } else {
    // on met fin au chronometre
    clearInterval(chronoInterval);

    // reinitialisation de startTime et currentlyWorked
    startTime.textContent = "00:00:00";
    currentlyWorked.textContent = "00:00:00";

    // on réactive le btn "Prise de service" et on lui rend sa couleur
    defaultButtons();
  }

  // si la journée est terminée, on désactive tout les btns jusqu'a la journée suivante (pour ne pas créer deux services dans la même journée)
  const today = new Date();
  state.forEach((st) => {
    if (st.date === today.toLocaleDateString("fr-FR") && st.isFinished) {
      start.disabled = true;
      start.classList.add("disabled");
      endOfDayMsg.classList.add("showEndOfDay");

      // on affiche le journal d'activité de la journée en cours
      listOfActivitites.innerHTML = "";
      let html = "";

      st.datas.forEach((data) => {
        html += `
          <li>
            <span class="hours">${data.start} : </span>
            <div class="displayDetails">
              <span class="detail"> ${data.detail} </span>
              <span class="title"> ${data.type}</span>
            </div>
          </li>
        `;
      });
      listOfActivitites.innerHTML = html;

      resumeOfActivities.innerHTML += `
        <li>
          <span class="hours">${st.finish} :</span>
          <span class="detail"> FIN DE JOURNEE </span>
        </li>
        <li>
          <span>TTE</span>
          <span>${st.totals.TTE + " + " + st.totals.PAU}</span>
        </li>
        <li>
          <span>Travail</span>
          <span>${st.totals.TTE}</span>
        </li>
        <li>
          <span>Pause</span>
          <span>${st.totals.PAU}</span>
        </li>
        <li>
          <span>Amplitude</span>
          <span>${st.amplitude}</span>
      `;
    }
  });
};

// EVENTS
// btn start
start.addEventListener("click", () => {
  // iniatialisation de la journée
  startOfDay();
});
// btn drive
drive.addEventListener("click", () => {
  calcDuration("drive", "TRA", "Reprise conduite/travail");
});
// btn waiting
waiting.addEventListener("click", () => {
  calcDuration("waiting", "PAU", "Attente sur place");
});
rest.addEventListener("click", () => {
  calcDuration("waiting", "RPS", "Repos interservices");
});
// btn finish
finish.addEventListener("click", () => {
  calcDuration("finish", "FNS", "Fin de journée");
  // on recupere la journée en cours, (celle qui n'est pas isFinished), et on agit uniquement sur cette journée
  const activeDay = state.find((day) => !day.isFinished);
  endOfDay(activeDay);
});

// INITIALISE APP
currentDate.textContent = displayDate();
render();
