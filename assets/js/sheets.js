const SHEET_ID = "1eNSh7TkObRNm_jlP_-7CSs9nQMcPElrZFMrfeC9R-ow";
const SHEET_NAME = "events"; // Or whatever your sheet's name is
const API_KEY = "AIzaSyDolzT1yWJuPi6y3tP85fuh3JbPJfJnWeM"; // If using an API key. Optional and not recommended for frontend-only usage due to exposure risk.

const URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
function renderDataAsTable(data) {
    const container = document.getElementById("dataContainer");

    // Create a table element
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    // Add headers to the table
    const headers = Object.keys(data[0]);
    const headerRow = document.createElement("tr");
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Add data rows to the table
    data.forEach(row => {
        const tr = document.createElement("tr");
        headers.forEach(header => {
            const td = document.createElement("td");
            td.textContent = row[header];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    // Append everything to the table
    table.appendChild(thead);
    table.appendChild(tbody);

    // Append the table to the container
    container.appendChild(table);
}

function convertSheetDataToListOfDicts(sheetData) {
    if (!sheetData.values || sheetData.values.length === 0) {
        return [];
    }

    const headers = sheetData.values[0];
    const rows = sheetData.values.slice(1);

    return rows.map(row => {
        let obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index];
        });
        return obj;
    });
}


var events = [
    {
        id: "4",
        name: "Event Four",
        month: "March",
        day: 12,
        year: 2024
    },
    {
        id: "2",
        name: "Event Two <em>(Special)</em>",
        month: "January",
        day: 10,
        year: 2024
    },
    {
        id: "3",
        name: "Event <a href='#'>Three</a>",
        month: "February",
        day: 1,
        year: 2023
    },
    {
        id: "1",
        name: "<strong>Event One</strong>",
        month: "January",
        day: 22,
        year: 2023
    },
    {
        id: "1",
        name: "<strong>Event One</strong>",
        month: "October",
        day: 6,
        year: 2023
    },
    {
        id: "1",
        name: "<strong>Event One</strong>",
        month: "October",
        day: 12,
        year: 2023
    }
];

const ORIGINAL_MONTH_ORDER = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function displayEventsByMonth(events) {
    var monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var currentEpoch = new Date().getTime();
    var currentDate = new Date();
    var currentMonth = monthOrder[currentDate.getMonth()];
    var currentYear = currentDate.getFullYear();
    var currentDay = currentDate.getDate();
// Rearrange the monthOrder array to have the current month at the beginning
    monthOrder = [currentMonth].concat(monthOrder.filter(month => month !== currentMonth));

    // Function to sort events by year, then by month, and then by day
    events.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year; // Oldest year first
        if (ORIGINAL_MONTH_ORDER.indexOf(a.month) !== ORIGINAL_MONTH_ORDER.indexOf(b.month)) return ORIGINAL_MONTH_ORDER.indexOf(a.month) - ORIGINAL_MONTH_ORDER.indexOf(b.month);
        return a.day - b.day;
    });
    var eventGroups = document.getElementById('eventGroups');

    // Group by month and year
    var groupedEvents = {};
    events.forEach(event => {
        if (eventToEpoch(event) <= currentEpoch) {
            return; // Don't display past events
        }

        var monthYearKey = `${event.month} - ${event.year}`;
        if (!groupedEvents[monthYearKey]) {
            groupedEvents[monthYearKey] = [];
        }
        groupedEvents[monthYearKey].push(event);
    });

    // Display events grouped by their respective months and years
    for (var monthYearKey of Object.keys(groupedEvents).sort(sortMonthYearKeys)) {
        var monthDiv = document.createElement('div');
        var monthHeading = document.createElement('h2');
        monthHeading.textContent = monthYearKey;
        monthDiv.appendChild(monthHeading);

        var ul = document.createElement('ul');
        groupedEvents[monthYearKey].forEach(event => {
            var li = document.createElement('li');
            li.innerHTML = event.day + " - " + event.name;
            ul.appendChild(li);
        });
        monthDiv.appendChild(ul);

        eventGroups.appendChild(monthDiv);
    }
}

function sortMonthYearKeys(a, b) {
    // Extract years from the keys
    let yearA = parseInt(a.split(' ')[1]);
    let yearB = parseInt(b.split(' ')[1]);

    // If years are different, compare by year
    if (yearA !== yearB) {
        return yearA - yearB;
    }

    // If years are the same, compare by month
    let monthA = a.split(' ')[0];
    let monthB = b.split(' ')[0];

    return ORIGINAL_MONTH_ORDER.indexOf(monthA) - ORIGINAL_MONTH_ORDER.indexOf(monthB);
}

function eventToEpoch(event) {
    return new Date(event.year, ORIGINAL_MONTH_ORDER.indexOf(event.month), event.day).getTime();
}

fetch(URL)
    .then(response => response.json())
    .then(data => {
        const listOfDicts = convertSheetDataToListOfDicts(data);
        console.log(listOfDicts);
        // renderDataAsTable(listOfDicts);
        displayEventsByMonth(listOfDicts);
    })
    .catch(error => console.error('Error fetching data:', error));