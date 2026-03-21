import { getCurrentWeek } from "./utils/getCurrentWeek.js";
import { displayDate } from "./utils/displayDate.js";

// DOWNLOAD APP ON MOBILE
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("Service Worker enregistré"))
      .catch((err) => console.log("Erreur SW:", err));
  });
}

const daysContainer = document.querySelector(".daysContainer");

const today = new Date();
const currentWeek = getCurrentWeek(today);

// initialisation du state
let state = JSON.parse(localStorage.getItem("busTrackerState")) || [];

// on crée une fonction qui transforme une durée d'activité en % pour créer une timeline sur 24h
const timeToPercent = (hours, minutes) => {
  const totalMinutes = hours * 60 + minutes;

  return Math.floor((totalMinutes / (24 * 60)) * 100);
};
const convertStrToNum = (str) => {
  const result = str.slice(0, 5).split(":").map(Number);

  const hours = result[0];
  const minutes = result[1];

  return timeToPercent(hours, minutes);
};
const createSegment = (type, startTime, endTime) => {
  const width = endTime - startTime;

  const html = `
    <div class="segment ${type}" style="left: ${startTime}%; width: ${width}%;"></div>
  `;
  return html;
};

const generateHours = () => {
  const html = [];
  for (let h = 0; h <= 24; h += 2) {
    const percent = (h / 24) * 100;

    html.push(
      `<span style="left: ${Math.floor(percent)}%;">${h.toString().padStart(2, "0") + "h"}</span>`,
    );
  }
  return html.join("");
};
const render = () => {
  state.forEach((st) => {
    if (currentWeek === st.week) {
      daysContainer.innerHTML = `
        <article class="dayWork">
          <h2>${displayDate()}</h2>
          <div class="timeline-wrapper">
            <div class="timeline">
              ${st.datas
                .map(
                  (data) =>
                    `
                  ${createSegment(data.type, convertStrToNum(data.start), convertStrToNum(data.end))}
                `,
                )
                .join("")}
            </div>
            <div class="timeline-hours">
              ${generateHours()}
            </div>
          </div>
          <div class="dayDetail">
                ${st.datas
                  .map(
                    (data) =>
                      `
                    <div class="type">
                      <div class="title">
                        <div class="color ${data.type}"></div>
                        <h3>${data.type}</h3>
                      </div>
                      <p>
                      <span>${data.detail} :</span>
                      <span>${data.start.slice(0, 5).replace(":", "h")} - ${data.end.slice(0, 5).replace(":", "h")}</span>
                      </p>
                    </div>
                  `,
                  )
                  .join("")}
          </div>
          <div class="dayRecap">
                  <ul>
                    <li>
                    <h3><span>TTE : </span>${st.totals.TTE.replace(":", "h")}</h3>
                    <div class="tte" style="width: ${convertStrToNum(st.totals.TTE)}"></div>
                    </li>
                    <li>
                    <h3><span>Travail : </span>${st.totals.TRA.replace(":", "h")}</h3>
                    <div class="tra" style="width: ${convertStrToNum(st.totals.TRA)}"></div>
                    </li>
                    <li>
                    <h3><span>Attente : </span>${st.totals.PAU.replace(":", "h")}</h3>
                    <div class="pau" style="width: ${convertStrToNum(st.totals.PAU)}"></div>
                    </li>
                    <li>
                    <h3><span>Repos : </span>${st.totals.RPS.replace(":", "h")}</h3>
                    <div class="rps" style="width: ${convertStrToNum(st.totals.RPS)}"></div>
                    </li>
                    <li>
                    <h3><span>Amplitude : </span>${st.amplitude.replace(":", "h")}</h3>
                    <div class="amp" style="width: ${convertStrToNum(st.amplitude)}"></div>
                    </li>
                  </ul>
          </div>
        </article>
      `;
    }
  });
};

// INITIALISE APP
render();
