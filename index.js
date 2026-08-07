const ee = (id) => document.getElementById(id);
const maxDate = new Date(); // how far the user can go right (by default, can't go past today (so the user can't look ahead))
maxDate.setHours(0, 0, 0, 0); // normalize hours to midnight for comparison
const minDate = new Date(2026, 7, 0); // January 1, 2027
const currDate = new Date(maxDate);
const maxIndex = 365; // ENTER COMIC COUNT HERE

var bookmark = 0;

const msPerDay = 1000 * 60 * 60 * 24;

// --- Manage Comic Display --- //
function formatDate(date) {
  return new Intl.DateTimeFormat()
    .format(date)
    .replace(/\//g, '-'); // instead of 01/01/26, does 1-1-26
}
async function displayComicAtDate(date) {
  const dayIndex = Math.floor((currDate - minDate) / msPerDay);
  const dateFormatted = formatDate(date);
  ee('datelabel').innerText = dateFormatted;
  ee('comicdiv').src = './img/' + dayIndex + '.jpg';

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
  var maxIndexDate = new Date(minDate.getDate() + maxIndex);
  // set at maxIndex or maxDate, depending on if we've gone past maxIndex
  console.log("MaxDate:");
  console.log(maxDate);
  console.log("maxIndexDate:");
  console.log(maxIndexDate);
  if (maxDate >= maxIndexDate) currDate.setTime(maxDate.getTime());
  else currDate.setTime(maxIndexDate.getTime());
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
  maxDate.setDate(minDate.getDate() + maxIndex);
}

// --- Load Bookmarked Comic --- //
var loadedBookmark = getCookie('bookmark');
if (loadedBookmark != '') bookmark = parseInt(loadedBookmark);
currDate.setDate(minDate.getDate() + bookmark);
displayComicAtDate(currDate);
