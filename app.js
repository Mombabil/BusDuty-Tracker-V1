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
// btn waiting
// btn rest
// btn finish
const finish = document.querySelector(".finish");

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

// création d'un nouvel objet au clic sur btn "Prise de service"
const startOfDay = () => {
  const today = new Date();
  // on cré un objet qui representera une journée de travail (la journée actuelle jusqu'a que l'on clique sur "Fin de journée")
  const workDay = {
    date: today.toLocaleDateString("fr-FR"),
    start: getTime(),
    waiting: "",
    rest: "",
    finish: "",
    amplitude: "",
    isFinished: false,
    week: getCurrentWeek(today),
  };

  // une fois l'objet du jour créer, on ne peut plus cliquer sur le bouton jusqu'au lendemain
  start.disabled = true;
  start.classList.add("disabled");

  // on ajoute le nouvel objet au state
  state.push(workDay);

  // on envoi le nouveau state au localStorage
  saveState();

  // on fait appel a render() pour actualiser l'affichage
  render();
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

  // on envoi le nouveau state au localStorage
  saveState();

  // on fait appel a render() pour actualiser l'affichage
  render();
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
  currentdate = date;
  let oneJan = new Date(currentdate.getFullYear(), 0, 1);
  let numberOfDays = Math.floor((currentdate - oneJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((currentdate.getDay() + 1 + numberOfDays) / 7);
};

// RENDER
const render = () => {
  state.forEach((st) => {
    // si il y a une journée en cours
    if (!st.isFinished) {
      startTime.textContent = st.start;

      if (!chronoInterval) {
        chronoInterval = setInterval(() => {
          updateChrono(getStartOfDay(st.start));
        }, 1000);
      }

      updateChrono(getStartOfDay(st.start));
    } else {
      // on met fin au chronometre
      clearInterval(chronoInterval);

      // reinitialisation de startTime et currentlyWorked
      startTime.textContent = "00:00:00";
      currentlyWorked.textContent = "00:00:00";

      // on réactive le btn "Prise de service" et on lui rend sa couleur
      start.disabled = false;
      start.classList.remove("disabled");
    }
  });
};

// EVENTS
// btn start
start.addEventListener("click", () => {
  // iniatialisation de la journée
  startOfDay();
});

// btn finish
finish.addEventListener("click", () => {
  state.forEach((st) => {
    // le forEach repere dans le state la journée en cours (celle qui n'est pas isFinished), cela permet d'agir uniquement sur cette journée au moment du clic
    if (!st.isFinished) {
      endOfDay(st);
    }
  });
});

// INITIALISE APP
currentDate.textContent = displayDate();
render();
