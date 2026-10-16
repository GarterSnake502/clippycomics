// --- Manage Comments --- //
// displays comments in comment history according to the desired page
let commentGenerationId = 0; // increments each time it calls a firstLoad -> stops new comic pinging
let commentLoadId = 0;
let highestCommentId = 0; // highest and lowest comment ids used to cheaply and quickly find new comments--spread outward as new comments discovered
let lowestCommentId;
// displays comemnts in history; wipes comments if first page; positions More button if more comments; starts pinging
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

// --- Load Comment Block --- //
ee('commentname').value = getCookie('commentname');
ee('commentname').addEventListener('input', () => {
  setCookie('commentname', encodeURIComponent(ee('commentname').value.trim()), 365);
});
ee('commentinput').addEventListener('submit', submitComment);
