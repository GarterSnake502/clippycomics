const maxDate = new Date(2026, 7, 1); // how far the user can go right (by default, can't go past today (so the user can't look ahead))
maxDate.setHours(0, 0, 0, 0); // normalize hours to midnight for comparison
const minDate = new Date(2026, 7, 0); // TODO: January 1, 2027
const currDate = new Date(maxDate);
const maxIndex = 365; // ENTER COMIC COUNT HERE

var bookmark = 0;
let activeComicId = null;

const msPerDay = 1000 * 60 * 60 * 24;

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// --- Manage Comic Display --- //
function formatDate(date) {
  return new Intl.DateTimeFormat()
    .format(date)
    .replace(/\//g, '-'); // instead of 01/01/26, does 1-1-26
}
async function displayComicAtDate(date) {
  const dayIndex = Math.round((date - minDate) / msPerDay);
  const dateFormatted = formatDate(date);

  ee('datelabel').innerText = dateFormatted;
  ee('comicdiv').src = './img/' + dayIndex + '.jpg';

  activeComicId = dayIndex;

  displayComments(dayIndex);
  loadTranscript(activeComicId);

  ee('nextbtn').disabled = (currDate >= maxDate || dayIndex >= maxIndex);
  ee('prevbtn').disabled = (currDate <= minDate);
  ee('latestbtn').disabled = (currDate >= maxDate || dayIndex >= maxIndex);

  bookmark = dayIndex;
  setCookie('bookmark', bookmark, 365);
}


// --- Manage Transcripts --- //
async function loadTranscript(dayIndex) {
  try {
    const response = await fetch(`./transcript/${dayIndex}.txt`);

    if (!response.ok) {
        throw new Error(`Failed to load ${dayIndex}.txt`);
    }

    const transcript = await response.text();

    if (activeComicId == dayIndex) { // makes sure user hasn't switched tabs
      ee("transcriptdiv").innerText = transcript;
    }
  } catch {
    if (activeComicId === dayIndex) {
      ee("transcriptdiv").innerText = "";
    }
  }
}
// --- Manage Buttons --- //
function doNext() {
  if (currDate < maxDate) {
    currDate.setDate(currDate.getDate() + 1);
    displayComicAtDate(currDate);
  }
}
function doPrev() {
  if (currDate > minDate) {
    currDate.setDate(currDate.getDate() - 1);
    displayComicAtDate(currDate);
  }
}
function doLatest() {
  var maxIndexDate = addDays(minDate, maxIndex);
  // set at maxIndex or maxDate, depending on if we've gone past maxIndex
  if (maxDate <= maxIndexDate) currDate.setTime(maxDate.getTime());
  else currDate.setTime(maxIndexDate.getTime());
  displayComicAtDate(currDate);
}
function doJump() {
  var month = parseInt(prompt("Enter month (1-12): "), 10);
  var day = parseInt(prompt("Enter day: "), 10);
  var yearStr = prompt("Enter year (Default 2027): ");
  if (yearStr == '') yearStr = '2027'; // hardcoded default 2027
  var year = parseInt(yearStr, 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    alert("The inputted date was invalid.");
    return;
  }

  var jumpDate = new Date(year, month - 1, day);
  if (jumpDate > maxDate) jumpDate.setTime(maxDate.getTime());
  if (jumpDate < minDate) jumpDate.setTime(minDate.getTime());
  currDate.setTime(jumpDate);
  displayComicAtDate(currDate);
}

// --- Set Max Date --- //
const maxDateIndex = Math.round((maxDate - minDate) / msPerDay); // how many comics the current day covers
if (maxDateIndex >= maxIndex) { // comics have ended--set maxDate to last comic
  maxDate.setTime(addDays(minDate, maxIndex).getTime());
}

// --- Load Bookmarked Comic --- //
var loadedBookmark = getCookie('bookmark');
if (loadedBookmark != '') bookmark = parseInt(loadedBookmark);
currDate.setTime(addDays(minDate, bookmark).getTime());
displayComicAtDate(currDate);
