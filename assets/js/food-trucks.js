const CONFIG = {
    SHEET_ID: "1eNSh7TkObRNm_jlP_-7CSs9nQMcPElrZFMrfeC9R-ow",
    SHEET_NAME: "events",
    API_KEY: "AIzaSyDolzT1yWJuPi6y3tP85fuh3JbPJfJnWeM",
    get URL() {
        return `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.SHEET_NAME}?key=${this.API_KEY}`;
    }
};

const convertSheetDataToListOfDicts = sheetData => {
    const headers = sheetData.values?.[0] || [];
    const rows = sheetData.values?.slice(1) || [];
    return rows.map(row =>
        Object.fromEntries(row.map((cell, index) => [headers[index], cell]))
    );
};

const isValidDate = dateStr => {
    const [month, day, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const parseDate = dateStr => {
    const [month, day, year] = dateStr.split('/').map(Number);
    return { day, month, year };
};

const eventToEpoch = event => new Date(parseDate(event.date)).getTime();

const sortMonthYearKeys = (a, b) => {
    const [monthA, yearA = 0] = a.split(' - ').map(Number);
    const [monthB, yearB = 0] = b.split(' - ').map(Number);
    return yearA - yearB || monthA - monthB;
};

const getMonthNameFromNumber = monthNumber =>
    new Date(0, monthNumber - 1).toLocaleString('default', { month: 'long' });

const createGroupedEvents = (validEvents, currentEpoch, currentYear) =>
    validEvents.reduce((acc, event) => {
        if (eventToEpoch(event) < currentEpoch) return acc;
        const { month, year } = parseDate(event.date);
        const key = `${month} - ${year}`;
        acc[key] = acc[key] || [];
        acc[key].push(event);
        return acc;
    }, {});

const displayEventsByMonth = events => {
    const currentEpoch = Date.now();
    const currentYear = new Date().getFullYear();
    const validEvents = events.filter(event =>
        event.date && event.name && isValidDate(event.date.trim()) && event.name.trim()
    );

    validEvents.sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        return dateA.year - dateB.year || dateA.month - dateB.month || dateA.day - dateB.day;
    });

    const groupedEvents = createGroupedEvents(validEvents, currentEpoch, currentYear);
    const eventGroups = document.getElementById('eventGroups');

    Object.keys(groupedEvents).sort(sortMonthYearKeys).forEach(monthYearKey => {
        let month = monthYearKey.split(' ')[0]
        let year = monthYearKey.split(' ')[2]
        const monthDiv = document.createElement('div');
        const monthHeading = document.createElement('h2');
        monthHeading.textContent = `${getMonthNameFromNumber(month)} ${year > currentYear ? `- ${year}` : ""}`;
        monthDiv.appendChild(monthHeading);

        const ul = document.createElement('ul');
        let previousEventDay = null;
        let processedInfoDays = new Set();

        groupedEvents[monthYearKey].forEach(event => {
            const { day, month, year } = parseDate(event.date);
            let info = event.info?.trim() ? ` (${event.info})` : '';
            const eventLink = event.url?.trim() ? `<a href="${event.url}" target="_blank">${event.name}</a>` : event.name;

            if (previousEventDay && (day - previousEventDay >= 1)) {
                const hr = document.createElement('hr')
                hr.className = 'weeks-hr';
                ul.appendChild(hr);
                if (!processedInfoDays.has(day) && info) {
                    ul.appendChild(document.createElement('div')).innerHTML = info;
                    processedInfoDays.add(day);
                }
            }

            ul.appendChild(document.createElement('li')).innerHTML = `${day} - ${eventLink}`;
            previousEventDay = day;
        });

        monthDiv.appendChild(ul);
        eventGroups.appendChild(monthDiv);
    });
};

fetch(CONFIG.URL)
    .then(response => response.json())
    .then(data => {
        const events = convertSheetDataToListOfDicts(data);
        displayEventsByMonth(events);
    })
    .catch(error => console.error('Error fetching data:', error));
