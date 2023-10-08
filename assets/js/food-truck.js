const CONFIG = {
    SHEET_ID: "1eNSh7TkObRNm_jlP_-7CSs9nQMcPElrZFMrfeC9R-ow",
    SHEET_NAME: "events",
    API_KEY: "AIzaSyDolzT1yWJuPi6y3tP85fuh3JbPJfJnWeM",
    URL() {
        return `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.SHEET_NAME}?key=${this.API_KEY}`;
    }
};

const convertSheetDataToListOfDicts = sheetData => {
    const headers = sheetData.values?.[0] || [];
    return sheetData.values?.slice(1).map(row =>
        headers.reduce((acc, header, index) => ({ ...acc, [header]: row[index] }), {})
    ) || [];
};

const isValidDate = dateStr => {
    const [month, day, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const parseDate = dateStr => {
    const [month, day, year] = dateStr.split('/').map(Number);
    return { day, month, year };
};

const eventToEpoch = event => {
    const { day, month, year } = parseDate(event.date);
    return new Date(year, month - 1, day + 1).getTime();
};

const sortMonthYearKeys = (a, b) => {
    const [monthYearA, yearA = 0] = a.split(' - ').map(Number);
    const [monthYearB, yearB = 0] = b.split(' - ').map(Number);
    return yearA - yearB || monthYearA - monthYearB;
};

const getMonthNameFromNumber = monthNumber => {
    const date = new Date(new Date().getFullYear(), monthNumber - 1);
    return date.toLocaleString('default', { month: 'long' });
}

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
        monthHeading.textContent = getMonthNameFromNumber(monthYearKey);
        monthDiv.appendChild(monthHeading);

        const ul = document.createElement('ul');
        let previousEventDay = null;
        let processedInfoDays = new Set();

        groupedEvents[monthYearKey].forEach(event => {
            const { day } = parseDate(event.date);
            let info = event.info?.trim() ? ` (${event.info})` : ''

            if (previousEventDay && (day - previousEventDay >= 1    )) {
                const hr = document.createElement('hr');
                const div = document.createElement('div');
                hr.className = 'weeks-hr';
                ul.appendChild(hr);
                if (!processedInfoDays.has(day) && event.info && event.info.trim() !== "") {
                    div.innerHTML = info;
                    processedInfoDays.add(day);
                }
                ul.appendChild(div);
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

fetch(CONFIG.URL())
    .then(response => response.json())
    .then(data => {
        const events = convertSheetDataToListOfDicts(data);
        displayEventsByMonth(events);
    })
    .catch(error => console.error('Error fetching data:', error));
