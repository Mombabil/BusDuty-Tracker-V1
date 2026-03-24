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

// recuperation du jour de la semaine de la journée de travail en lettre
function getDayNameFromDate(dateStr) {
  const match = dateStr.split("/");
  if (!match) return null;

  const day = parseInt(match[0], 10);
  // Les mois commencent à 0
  const month = parseInt(match[1], 10) - 1;
  const year = parseInt(match[2], 10);

  // Création de l'objet Date
  const date = new Date(year, month, day);

  // Récupération du jour en toutes lettres (français)
  return date.toLocaleDateString("fr-FR", { weekday: "long" });
}

const render = () => {
  let html = "";
  state.forEach((st) => {
    if (currentWeek === st.week) {
      html += `
      <div class="shapeDayWork">
        <article class="dayWork">
          <div class="editSection">
            <button aria-label="editSection">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M505 122.9L517.1 135C526.5 144.4 526.5 159.6 517.1 168.9L488 198.1L441.9 152L471 122.9C480.4 113.5 495.6 113.5 504.9 122.9zM273.8 320.2L408 185.9L454.1 232L319.8 366.2C316.9 369.1 313.3 371.2 309.4 372.3L250.9 389L267.6 330.5C268.7 326.6 270.8 323 273.7 320.1zM437.1 89L239.8 286.2C231.1 294.9 224.8 305.6 221.5 317.3L192.9 417.3C190.5 425.7 192.8 434.7 199 440.9C205.2 447.1 214.2 449.4 222.6 447L322.6 418.4C334.4 415 345.1 408.7 353.7 400.1L551 202.9C579.1 174.8 579.1 129.2 551 101.1L538.9 89C510.8 60.9 465.2 60.9 437.1 89zM152 128C103.4 128 64 167.4 64 216L64 488C64 536.6 103.4 576 152 576L424 576C472.6 576 512 536.6 512 488L512 376C512 362.7 501.3 352 488 352C474.7 352 464 362.7 464 376L464 488C464 510.1 446.1 528 424 528L152 528C129.9 528 112 510.1 112 488L112 216C112 193.9 129.9 176 152 176L264 176C277.3 176 288 165.3 288 152C288 138.7 277.3 128 264 128L152 128z"/></svg>
            </button>
          </div>
          <h2>${getDayNameFromDate(st.date)} ${st.date.slice(0, 5)} :
          </h2> 
          <h3 class="startAndStop">${st.start.replace(":", "h").slice(0, 5)} - ${st.finish.replace(":", "h").slice(0, 5)}
          </h3>
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
                    <div class="type ${data.type}">
                    <div class="title">
                      <div class="color ${data.type}"></div>
                      <h3>${data.type}</h3>
                      </div>
                      <p>
                        <span>${data.detail} :</span>
                      </p>
                      <p class="time" data-id="${data.id}">
                        <span>
                          ${data.start.slice(0, 5).replace(":", "h")} - ${data.end.slice(0, 5).replace(":", "h")}
                        </span>
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
                      <div class="timeline">
                        <div class="tte" style="width: ${convertStrToNum(st.totals.TTE)}%"></div>
                      </div>
                    </li>
                    <li>
                      <h3><span>Travail : </span>${st.totals.TRA.replace(":", "h")}</h3>
                      <div class="timeline">
                        <div class="tra" style="width: ${convertStrToNum(st.totals.TRA)}%"></div>
                      </div>
                    </li>
                    <li>
                      <h3><span>Attente : </span>${st.totals.PAU.replace(":", "h")}</h3>
                      <div class="timeline">
                        <div class="pau" style="width: ${convertStrToNum(st.totals.PAU)}%"></div>
                      </div>
                    </li>
                    <li>
                      <h3><span>Repos : </span>${st.totals.RPS.replace(":", "h")}</h3>
                      <div class="timeline">
                        <div class="rps" style="width: ${convertStrToNum(st.totals.RPS)}%"></div>
                      </div>
                    </li>
                    <li>
                      <h3><span>Amplitude : </span>${st.amplitude.replace(":", "h")}</h3>
                      <div class="timeline">
                        <div class="amp" style="width: ${convertStrToNum(st.amplitude)}%"></div>
                      </div>
                    </li>
                  </ul>
          </div>
        </article>
      </div>
      `;
    }
  });
  daysContainer.innerHTML = html;
};

const editSection = document.querySelector(".editSection");
console.log(editSection);

// INITIALISE APP
render();
