const ee = (id) => document.getElementById(id);
const maxDate = new Date(); // how far the user can go right (by default, can't go past today (so the user can't look ahead))
maxDate.setHours(0, 0, 0, 0); // normalize hours to midnight for comparison
const minDate = new Date(2026, 7, 0); // January 1, 2027
const currDate = new Date(maxDate);
const maxIndex = 365; // ENTER COMIC COUNT HERE

var bookmark = 0;
let activeComicId = null;
let commentLoadId = 0;

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
    const response = await fetch(`./transcript/${activeComicId}.txt`);

    if (!response.ok) {
        throw new Error(`Failed to load ${filename}`);
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
// --- Manage Comments --- //
const API_URL = "https://cc-comments-api.trouttrifle.workers.dev";

// displays previous comments in commenthistorydiv
async function displayComments(dayIndex, page = 1) {
  if (dayIndex !== activeComicId) return false;

  const loadId = ++commentLoadId;
  const history = ee('commenthistorydiv');
  const status = ee('commentstatus');
  if (page === 1) {
    history.replaceChildren();
    status.innerText = 'Loading comments...';
  }

  try {
    const response = await getComments(dayIndex, page);
    const comments = response.comments;
    const hasMore = response.hasMore;
    if (loadId !== commentLoadId || dayIndex !== activeComicId) return false;
    if (!Array.isArray(comments)) {
      throw new Error('The comments response was not a list.');
    }

    for (const comment of comments) {
      history.append(createCommentBubble(comment));
    }
    // has more comics?
    history.querySelector('.morecomments')?.remove();
    if (hasMore) {
      history.append(createMoreButton(dayIndex, page + 1));
    }
    if (page === 1) {
      status.innerText = comments.length ? '' : 'No comments yet.';
    } else {
      status.innerText = '';
    }
    return true;
  } catch (error) {
    if (loadId === commentLoadId && dayIndex === activeComicId) { // only display errors if still on page
      console.error('Failed to load comments:', error);
      status.innerText = page === 1
        ? 'Could not load comments. Please try again.'
        : 'Could not load more comments. Please try again.';
    }
    return false;
  }
}
function createMoreButton(dayIndex, page) {
  const link = document.createElement('a');
  link.className = 'morecomments';
  link.href = '#commenthistorydiv';
  link.innerText = 'Load more comments';
  link.addEventListener('click', async event => {
    event.preventDefault();
    link.remove();
    ee('commentstatus').innerText = 'Loading more comments...';
    const loaded = await displayComments(dayIndex, page);
    if (!loaded && dayIndex === activeComicId) {
      ee('commenthistorydiv').append(createMoreButton(dayIndex, page));
    }
  });
  return link;
}
function createCommentBubble(comment) {
  const bubble = document.createElement('article');
  bubble.className = 'commentbubble';

  const author = document.createElement('strong');
  author.className = 'commentauthor';
  author.innerText = comment.name || 'Anonymous';

  const message = document.createElement('p');
  message.className = 'commentmessage';
  message.innerText = comment.message || '';

  const timestamp = document.createElement('time');
  timestamp.className = 'commenttimestamp';
  timestamp.innerText = comment.created_at || '';

  bubble.append(author, message, timestamp);
  return bubble;
}
async function submitComment(event) {
  event.preventDefault();
  const comicId = activeComicId;
  if (comicId === null) return;

  const nameInput = ee('commentname');
  const messageInput = ee('commentmessage');
  const submitButton = ee('commentsubmit');
  const status = ee('commentstatus');
  const name = nameInput.value.trim() || 'Anonymous';
  const message = messageInput.value.trim();
  if (!message) {
    messageInput.focus();
    return;
  }
  setCookie('commentname', encodeURIComponent(nameInput.value.trim()), 365);

  submitButton.disabled = true;
  status.innerText = 'Sending comment...';
  try {
    await postComment(comicId, name, message);
    messageInput.value = '';
    const refreshed = await displayComments(comicId);
    if (comicId === activeComicId) {
      status.innerText = refreshed
        ? 'Comment posted.'
        : 'Comment posted, but the history could not be refreshed.';
    }
  } catch (error) {
    console.error('Failed to post comment:', error);
    if (comicId === activeComicId) {
      status.innerText = `Could not send comment: ${error.message}`;
    }
  } finally {
    submitButton.disabled = false;
  }
}

// Retrieve comments
async function getComments(comic, page = 1) {
    const response = await fetch(
        `${API_URL}/comments?comic=${encodeURIComponent(comic)}&page=${encodeURIComponent(page)}`
    );

    if (!response.ok) {
        throw new Error("Failed to load comments");
    }

    return await response.json();
}

// Post a comment
async function postComment(comic, name, message) {
    const response = await fetch(`${API_URL}/comments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ comic, name, message })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || "Failed to post comment");
    }

    return result;
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
ee('commentname').value = getCookie('commentname');
ee('commentname').addEventListener('input', () => {
  setCookie('commentname', encodeURIComponent(ee('commentname').value.trim()), 365);
});
ee('commentinput').addEventListener('submit', submitComment);
displayComicAtDate(currDate);
