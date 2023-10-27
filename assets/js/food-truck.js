const CONFIG = {
  SHEET_ID: "1eNSh7TkObRNm_jlP_-7CSs9nQMcPElrZFMrfeC9R-ow",
  SHEET_NAME: "events",
  API_KEY: "AIzaSyDolzT1yWJuPi6y3tP85fuh3JbPJfJnWeM",
  get URL() {
    return `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.SHEET_NAME}?key=${this.API_KEY}`;
  },
  SHOW_PASSED_EVENTS: false,
};

const convertSheetDataToListOfDicts = (sheetData) => {
  const headers = sheetData.values?.[0] || [];
  const rows = sheetData.values?.slice(1) || [];
  return rows.map((row) =>
    Object.fromEntries(row.map((cell, index) => [headers[index], cell]))
  );
};

const parseDate = (dateStr) => {
  const [month, day, year] = dateStr.split("/").map(Number);
  return { month, day, year };
};

const eventToEpoch = (event) => new Date(event.date).getTime();

const isValidDate = (dateStr) => {
  const parsed = parseDate(dateStr);
  const date = new Date(parsed.year, parsed.month - 1, parsed.day);
  return (
    date.getFullYear() === parsed.year &&
    date.getMonth() === parsed.month - 1 &&
    date.getDate() === parsed.day
  );
};

const isValidURL = (str) => {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
};

const getMonthNameFromNumber = (monthNumber) =>
  new Date(0, monthNumber - 1).toLocaleString("default", { month: "long" });

const ordinalSuffix = (num) => {
  const j = num % 10,
    k = num % 100;
  if (j === 1 && k !== 11) return `${num}<sup>st</sup>`;
  if (j === 2 && k !== 12) return `${num}<sup>nd</sup>`;
  if (j === 3 && k !== 13) return `${num}<sup>rd</sup>`;
  return `${num}<sup>th</sup>`;
};

const generateEventName = (event) => {
  if (event.url?.trim() && isValidURL(event.url)) {
    return `<a href="${event.url}" target="_blank">${event.name}</a>${
      event.truck_info ? ` (${event.truck_info})` : ""
    }`;
  } else {
    return event.truck_info
      ? `${event.name} (${event.truck_info})`
      : event.name;
  }
};

const displayEventsByMonth = (events) => {
  const currentEpoch = Date.now();
  const currentYear = new Date().getFullYear();
  const validEvents = events.filter(
    (event) =>
      event.date &&
      event.name &&
      isValidDate(event.date.trim()) &&
      event.name.trim()
  );

  validEvents.sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    return (
      dateA.year - dateB.year ||
      dateA.month - dateB.month ||
      dateA.day - dateB.day
    );
  });

  const groupedEvents = validEvents.reduce((acc, event) => {
    if (!CONFIG.SHOW_PASSED_EVENTS && eventToEpoch(event) < currentEpoch)
      return acc;
    const { month, year } = parseDate(event.date);
    const key = `${month} - ${year}`;
    acc[key] = acc[key] || [];
    acc[key].push(event);
    return acc;
  }, {});

  const eventGroups = document.getElementById("eventGroups");

  Object.keys(groupedEvents).forEach((monthYearKey) => {
    const [month, , year] = monthYearKey.split(" ");
    const monthDiv = document.createElement("div");
    const monthHeading = document.createElement("h2");
    monthHeading.textContent = `${getMonthNameFromNumber(month)} ${
      year > currentYear ? `- ${year}` : ""
    }`;
    monthDiv.appendChild(monthHeading);

    const daysOl = document.createElement("ol");
    daysOl.className = "circle-bullets";
    let previousEventDay = null;
    let processedInfoDays = new Set();

    groupedEvents[monthYearKey].forEach((event) => {
      const { day } = parseDate(event.date);
      const info = event.event_info?.trim() ? ` (${event.event_info})` : "";
      const eventName = generateEventName(event);

      if (previousEventDay !== day) {
        const dayLi = document.createElement("li");
        dayLi.innerHTML =
          !processedInfoDays.has(day) && info
            ? `${ordinalSuffix(day)} - ${info}`
            : ordinalSuffix(day);
        processedInfoDays.add(day);
        daysOl.appendChild(dayLi);

        const eventsOl = document.createElement("ol");
        eventsOl.className = "circle-bullets-inner";
        dayLi.appendChild(eventsOl);
        const eventLi = document.createElement("li");
        eventLi.innerHTML = eventName;
        eventsOl.appendChild(eventLi);
      } else {
        const eventsOl = daysOl.lastChild.lastChild;
        const eventLi = document.createElement("li");
        eventLi.innerHTML = eventName;
        eventsOl.appendChild(eventLi);
      }

      previousEventDay = day;
    });

    monthDiv.appendChild(daysOl);
    eventGroups.appendChild(monthDiv);
  });
};

fetch(CONFIG.URL)
  .then((response) => response.json())
  .then((data) => {
    const events = convertSheetDataToListOfDicts(data);
    displayEventsByMonth(events);
  })
  .catch((error) => console.error("Error fetching data:", error));
