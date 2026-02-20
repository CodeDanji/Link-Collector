const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream("public/icon-512x512.png");
https.get("https://dummyimage.com/512x512/7AA2F7/ffffff.png&text=LC", function (response) {
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log("Download complete.");

        // Copy to 192x192 as well for safety
        fs.copyFileSync("public/icon-512x512.png", "public/icon-192x192.png");
        // Also overwrite the base icon
        fs.copyFileSync("public/icon-512x512.png", "public/icon.png");
    });
}).on('error', (err) => {
    fs.unlink("public/icon-512x512.png");
    console.error(err.message);
});
