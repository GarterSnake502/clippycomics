const API_URL = "https://cc-comments-api.trouttrifle.workers.dev";
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
// Retrieve all comments, regardless of comic (recent.html)
async function getAllComments(minid = null, maxid = null) {
    let url = `${API_URL}/comments?`;
    if (minid !== null) url += `&minid=${encodeURIComponent(minid)}`;
    if (maxid !== null) url += `&maxid=${encodeURIComponent(maxid)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Failed to load comments");
    }

    return await response.json();
}
