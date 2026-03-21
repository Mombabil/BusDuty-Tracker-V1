// DOWNLOAD APP ON MOBILE
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("Service Worker enregistré"))
      .catch((err) => console.log("Erreur SW:", err));
  });
}

const timeline = document.querySelector(".timeline");

// initialisation du state
let state = JSON.parse(localStorage.getItem("busTrackerState")) || [];

// on crée une fonction qui transforme une durée d'activité en % pour créer une timeline sur 24h
const timeToPercent = (hours, minutes) => {
  const totalMinutes = hours * 60 + minutes;

  return (totalMinutes / (24 * 60)) * 100;
};

const convertStrToNum = (str) => {
  const result = str.split(":").map(Number);
  const hours = result[0];
  const minutes = result[1];

  timeToPercent(hours, minutes);
};

const createSegment = (type, startTime, endTime) => {
  const segment = document.createElement("div");
  segment.classList.add("segment", type);

  const start = startTime;
  const end = endTime;

  segment.style.left = start + "%";
  segment.style.width = end - start + "%";

  return segment;
};

const render = () => {
  state.forEach((st) => {
    st.datas.forEach((data) => {
      timeline.appendChild(
        createSegment(
          data.type,
          convertStrToNum(data.start, convertStrToNum(data.end)),
        ),
      );
    });
  });
};

// INITIALISE APP
render();
