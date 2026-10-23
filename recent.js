// BANDAGE FUNCTION THAT DUPLICATES CODE, BUT GETS THE JOB DONE
// Displays first 10 of all comments
// TODO: separate Home logic from comments-ui logic, using callback functions to ping and load more
//  This would allow one function to display comments anywhere using only a few lines of code
// TODO: make "Load More Comments" button
let highestCommentId = 0; // highest and lowest comment ids used to cheaply and quickly find new comments--spread outward as new comments discovered
let lowestCommentId;
async function getRecentComments() {
  const history = ee('commenthistorydiv');
  const response = await getAllComments();
  const comments = response.comments;
  for (const comment of comments) {
    history.append(createCommentBubble(comment));
    highestCommentId = Math.max(comment.id, highestCommentId);

    if (lowestCommentId === null)
      lowestCommentId = comment.id;
    else
      lowestCommentId = Math.min(comment.id, lowestCommentId);
  }
}
// Duplicates of functions in comment-ui, as comments-ui currently depends on some ids and variables from index.js
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
  timestamp.innerText += ' - '; // spacer for comicLink

  const comicLink = document.createElement('a');
  comicLink.className = 'commenttimestamp';
  comicLink.href = `index.html?comic=${encodeURIComponent(comment.comic)}`;
  comicLink.innerText = `Comic ${comment.comic}`;

  bubble.append(author, message, timestamp, comicLink);
  return bubble;
}
getRecentComments();
