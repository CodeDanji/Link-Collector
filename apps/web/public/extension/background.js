// background.js - Simple Link Clipper
// Runs when the user clicks the extension icon in the toolbar.

const TARGET_APP_URL = "http://localhost:3000"; // Update to production URL on deployment

chrome.action.onClicked.addListener((tab) => {
    if (tab && tab.url) {
        // We redirect the user to a dedicated saving route on our Next.js frontend
        // /save?url="..." is a common pattern. Our frontend can then trigger the API.
        const encodedUrl = encodeURIComponent(tab.url);
        const targetUrl = `${TARGET_APP_URL}/save?url=${encodedUrl}`;

        // Open the Next.js app in a new tab
        chrome.tabs.create({ url: targetUrl });
    }
});
