const SHEET_ID = "1eNSh7TkObRNm_jlP_-7CSs9nQMcPElrZFMrfeC9R-ow";
const SHEET_NAME = "events";
const API_KEY = "AIzaSyDolzT1yWJuPi6y3tP85fuh3JbPJfJnWeM";
const URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
const ORIGINAL_MONTH_ORDER = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const convertSheetDataToListOfDicts = sheetData => {
    const { values = [] } = sheetData;
    const headers = values[0];
    return values.slice(1).map(row => headers.reduce((acc, header, index) => ({ ...acc, [header]: row[index] }), {}));
};

const displayEventsByMonth = events => {
    console.log(events)
    const currentEpoch = Date.now();
    const currentYear = new Date().getFullYear();

    const validEvents = events.filter(event => {
        return event.date && event.name &&
            event.date.trim() !== "" && event.name.trim() !== "" &&
            isValidDate(event.date);
    });

    validEvents.sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);

        if (dateA.year !== dateB.year) return dateA.year - dateB.year;
        const monthIdxDiff = ORIGINAL_MONTH_ORDER.indexOf(dateA.month) - ORIGINAL_MONTH_ORDER.indexOf(dateB.month);
        return monthIdxDiff || dateA.day - dateB.day;
    });

    const groupedEvents = validEvents.reduce((acc, event) => {
        if (eventToEpoch(event) < currentEpoch) return acc;
        const key = `${parseDate(event.date).month} ${parseDate(event.date).year > currentYear ? `- ${parseDate(event.date).year}` : ''}`;
        acc[key] = acc[key] || [];
        acc[key].push(event);
        return acc;
    }, {});

    const eventGroups = document.getElementById('eventGroups');
    Object.keys(groupedEvents).sort(sortMonthYearKeys).forEach(monthYearKey => {
        const monthDiv = document.createElement('div');
        const monthHeading = document.createElement('h2');
        monthHeading.textContent = monthYearKey;
        monthDiv.appendChild(monthHeading);

        const ul = document.createElement('ul');
        let previousEventDay = null;

        groupedEvents[monthYearKey].forEach(event => {
            const { day } = parseDate(event.date);

            if (previousEventDay && (day - previousEventDay > 6)) {
                const pBefore = document.createElement('p');
                const hr = document.createElement('hr');
                hr.className = 'weeks-hr';
                const pAfter = document.createElement('p');
                ul.appendChild(pBefore);
                ul.appendChild(hr);
                ul.appendChild(pAfter);
            }

            const li = document.createElement('li');
            li.innerHTML = event.url?.trim() ? `${day} - <a href="${event.url}" target="_blank">${event.name}</a>` : `${day} - ${event.name}`;
            ul.appendChild(li);

            previousEventDay = day;
        });

        monthDiv.appendChild(ul);
        eventGroups.appendChild(monthDiv);
    });
};

const parseDate = dateStr => {
    if (!dateStr) {
        console.warn("Undefined date string provided to parseDate.");
        return { day: 0, month: "January", year: 0 };
    }
    const [month, day, year] = dateStr.split('/').map(num => parseInt(num, 10));
    return {
        day,
        month: ORIGINAL_MONTH_ORDER[month - 1], // Convert 1-based month to 0-based index
        year
    };
};

function isValidDate(dateStr) {
    if (typeof dateStr !== "string") return false;

    const [month, day, year] = dateStr.split('/').map(num => parseInt(num, 10));

    // Check the year, month, and day
    if (isNaN(year) || year < 1900 || year > 2100) return false;
    if (isNaN(month) || month < 1 || month > 12) return false;
    if (isNaN(day) || day < 1 || day > 31) return false;

    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

const sortMonthYearKeys = (a, b) => {
    const [monthA, yearA = null] = a.split(' - ');
    const [monthB, yearB = null] = b.split(' - ');
    if (yearA !== yearB) return (yearA || 0) - (yearB || 0);
    return ORIGINAL_MONTH_ORDER.indexOf(monthA) - ORIGINAL_MONTH_ORDER.indexOf(monthB);
};

const eventToEpoch = event => {
    const { day, month, year } = parseDate(event.date);
    return new Date(year, ORIGINAL_MONTH_ORDER.indexOf(month), day + 1).getTime();
};

fetch(URL)
    .then(response => response.json())
    .then(data => {
        const events = convertSheetDataToListOfDicts(data);
        displayEventsByMonth(events);
    })
    .catch(error => console.error('Error fetching data:', error));
