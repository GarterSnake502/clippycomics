const ee = (id) => document.getElementById(id);
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
// displays comments in comment history according to the desired page
let commentGenerationId = 0; // increments each time it calls a firstLoad -> stops new comic pinging
let commentLoadId = 0;
let highestCommentId = 0; // highest and lowest comment ids used to cheaply and quickly find new comments--spread outward as new comments discovered
let lowestCommentId;
async function displayComments(dayIndex, firstLoad = true) {
  if (dayIndex !== activeComicId) return false; // don't process if left page

  const loadId = ++commentLoadId;
  const history = ee('commenthistorydiv');
  const status = ee('commentstatus');

  try {
    if (firstLoad) { // wipe comments if loading first page
      history.replaceChildren();
      highestCommentId = 0;
      lowestCommentId = null;
      status.innerText = 'Loading comments...';
      commentGenerationId++;
    }
    const response = firstLoad
      ? await getComments(dayIndex) // get first ten comments if first load
      : await getComments(dayIndex, null, lowestCommentId - 1); // get next ten comments with ids < lowest found so far
    const comments = response.comments;
    const hasMore = response.hasMore;
    if (loadId !== commentLoadId || dayIndex !== activeComicId) return false; // don't process if left page or something else already got comment
    if (!Array.isArray(comments)) {
      throw new Error('The comments response was not a list.');
    }
    for (const comment of comments) {
      history.append(createCommentBubble(comment));
      highestCommentId = Math.max(comment.id, highestCommentId);

      if (lowestCommentId === null)
        lowestCommentId = comment.id;
      else
        lowestCommentId = Math.min(comment.id, lowestCommentId);
    }
    // delete more comments link; re-add if hasMore comments
    history.querySelector('.morecomments')?.remove();
    if (hasMore) {
      history.append(createMoreButton(dayIndex));
    }
    // start pinging for comments if first load
    if (firstLoad) {
      status.innerText = comments.length ? '' : 'No comments yet.';
      pingForNewComments(dayIndex, commentGenerationId);
    } else {
      status.innerText = '';
    }
    return true;
  } catch (error) {
    if (loadId === commentLoadId && dayIndex === activeComicId) { // only display errors if still on page
      console.error('Failed to load comments:', error);
      status.innerText = firstLoad
        ? 'Could not load comments. Please try again.'
        : 'Could not load more comments. Please try again.';
    }
    return false;
  }
}
// pings for new comments every 1500ms, posting them so the user can see realtime chat
async function pingForNewComments(dayIndex, generationId) {
  const pingNew = async function () {
    try {
      const response = await getComments(dayIndex, highestCommentId + 1); // minimum is highestCommentId -> only new comments
      if (dayIndex != activeComicId || generationId != commentGenerationId) return false;

      const comments = response.comments;
      if (!Array.isArray(comments)) {
        throw new Error('The comments response was not a list.');
      }

      for (const comment of comments.reverse()) {
        if (comment.id <= highestCommentId) return; // prevents polling from returning a comic that the user posted during the time it took to fetch new comics

        highestCommentId = Math.max(comment.id, highestCommentId);
        ee('commenthistorydiv').prepend(createCommentBubble(comment));
        ee('commentstatus').innerText = '';
      }
    }
    catch (error) {
      console.log("Failed to ping comments: " + error);
    }
    finally {
      if (dayIndex === activeComicId && generationId === commentGenerationId) {
        setTimeout(pingNew, 1500);
      }
    }
  }
  setTimeout(pingNew, 1500);
}
// creates more button and links it to displaying the next page
function createMoreButton(dayIndex) {
  const link = document.createElement('a');
  link.className = 'morecomments';
  link.href = '#commenthistorydiv';
  link.innerText = 'Load more comments';
  link.addEventListener('click', async event => {
    event.preventDefault();
    if (link.getAttribute('disabled') === 'true') return;

    link.innerText = 'Loading...'; // space to ensure link still takes up space
    link.setAttribute('disabled', 'true');
    ee('commentstatus').innerText = 'Loading more comments...';

    const loaded = await displayComments(dayIndex, false);
    if (!loaded && dayIndex === activeComicId) {
      link.innerText = 'Load more comments';
      link.removeAttribute('disabled');
    }
  });
  return link;
}
function formatCommentTime(timestamp) {
  const date = new Date(timestamp.replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return timestamp;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true
  }).format(date);
}
// creates history bubble for ui
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
  timestamp.innerText = comment.created_at
    ? formatCommentTime(comment.created_at)
    : '';

  bubble.append(author, message, timestamp);
  return bubble;
}
// Submit comment to post + update comment history
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
  try {
    const result = await postComment(comicId, name, message);
    messageInput.value = '';
    if (comicId === activeComicId && result.comment) {
      ee('commenthistorydiv').prepend(createCommentBubble({
        ...result.comment
      }));
      highestCommentId = Math.max(highestCommentId, result.comment.id);
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

    ee('commentstatus').innerText = "";
    return result;
}
// Retrieve comments
async function getComments(comic, minid = null, maxid = null) {
    let url = `${API_URL}/comments?comic=${encodeURIComponent(comic)}`;
    if (minid !== null) url += `&minid=${encodeURIComponent(minid)}`;
    if (maxid !== null) url += `&maxid=${encodeURIComponent(maxid)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Failed to load comments");
    }

    return await response.json();
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
