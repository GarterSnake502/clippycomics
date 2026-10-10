const ee = (id) => document.getElementById(id);
const maxDate = new Date(); // how far the user can go right (by default, can't go past today (so the user can't look ahead))
maxDate.setHours(0, 0, 0, 0); // normalize hours to midnight for comparison
const minDate = new Date(2026, 7, 0); // January 1, 2027
const currDate = new Date(maxDate);
const maxIndex = 365; // ENTER COMIC COUNT HERE

const giscusConfig = {
  repo: 'GarterSnake502/ClippyComics',
  repoId: 'R_kgDOTxNh2Q',
  category: 'Comments',
  categoryId: 'DIC_kwDOTxNh2c4DHhUp',
  theme: 'light',
  reactionsEnabled: "0"
};

var bookmark = 0;

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
  const dayIndex = Math.floor((date - minDate) / msPerDay);
  const dateFormatted = formatDate(date);
  ee('datelabel').innerText = dateFormatted;
  ee('comicdiv').src = './img/' + dayIndex + '.jpg';
  displayDiscussion(dayIndex);

  ee('nextbtn').disabled = (currDate >= maxDate || dayIndex >= maxIndex);
  ee('prevbtn').disabled = (currDate <= minDate);
  ee('latestbtn').disabled = (currDate >= maxDate || dayIndex >= maxIndex);

  try {
      const transcript = await loadTranscript(
          `./transcript/${dayIndex}.txt`
      );
      ee("transcriptdiv").innerText = transcript;
  } catch {
      ee("transcriptdiv").innerText = "";
  }

  bookmark = dayIndex;
  setCookie('bookmark', bookmark, 365);
}
function displayDiscussion(comicId) {
  // ai-assisted incorporation of Giscus for comment system
  const discussion = ee('discussiondiv');
  discussion.replaceChildren();

  const configValues = [
    giscusConfig.repoId,
    giscusConfig.category,
    giscusConfig.categoryId,
    giscusConfig.theme
  ];
  if (configValues.some(value => !value || value.startsWith('REPLACE_'))) {
    const notice = document.createElement('p');
    notice.innerText = 'Giscus comments are not configured yet.';
    discussion.append(notice);
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.dataset.repo = giscusConfig.repo;
  script.dataset.repoId = giscusConfig.repoId;
  script.dataset.category = giscusConfig.category;
  script.dataset.categoryId = giscusConfig.categoryId;
  script.dataset.mapping = 'specific';
  script.dataset.term = "Comic " + String(comicId);
  script.dataset.strict = '0';
  script.dataset.reactionsEnabled = giscusConfig.reactionsEnabled;
  script.dataset.emitMetadata = '0';
  script.dataset.inputPosition = 'top';
  script.dataset.theme = giscusConfig.theme;
  script.dataset.lang = 'en';
  discussion.append(script);
}
async function loadTranscript(filename) {
  const response = await fetch(filename);

  if (!response.ok) {
      throw new Error(`Failed to load ${filename}`);
  }

  return await response.text();
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
  if (jumpDate > maxDate) jumpDate.setTime(maxDate);
  if (jumpDate < minDate) jumpDate.setTime(minDate);
  currDate.setTime(jumpDate);
  displayComicAtDate(currDate);
}
// --- Manage Cookies --- //
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * msPerDay));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
// --- Set Max Date --- //
const maxDateIndex = Math.floor((maxDate - minDate) / msPerDay); // how many comics the current day covers
if (maxDateIndex >= maxIndex) { // comics have ended--set maxDate to last comic
  maxDate.setTime(addDays(minDate, maxIndex).getTime());
}

// --- Load Bookmarked Comic --- //
var loadedBookmark = getCookie('bookmark');
if (loadedBookmark != '') bookmark = parseInt(loadedBookmark);
currDate.setTime(addDays(minDate, bookmark).getTime());
displayComicAtDate(currDate);
