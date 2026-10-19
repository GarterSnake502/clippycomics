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
getRecentComments();
