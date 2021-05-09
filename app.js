const pexels = require('pexels')
const fs = require("fs");
const path = require('path');
const url = require('url');
const https = require('https');
const client = pexels.createClient(process.env.API_KEY)
const COLLECTION_NAME = 'I\'m Moving But I\'m Not Going Anywhere'
const PER_PAGE = 80
const OUTPUT_ROOT = "./output"
let saved = 0;

function write_downloaded_file(localPath, res) {
    const filePath = fs.createWriteStream(localPath);
    res.pipe(filePath);
    filePath.on('finish', () => {
        filePath.close();
        console.log('Downloaded: ' + localPath + " " + filePath.bytesWritten.toString() + " bytes");
    })
    saved += 1
}

function download(file_url, localPath) {
    https.get(file_url, (res) => {
        // Detect a redirect
        if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
            let redirect = new url.URL(res.headers.location)
            if (redirect.hostname) {
                download(res.headers.location, localPath)
            } else {
                console.log(res)
            }
        } else {
            write_downloaded_file(localPath, res);
        }
    })
}

function save_to_disk(file_url, folder, localPath) {
    fs.mkdir(folder, {recursive: true}, (err) => {
        if (err) {
            throw err;
        }
    });
    download(file_url, localPath);
}

function save_video(item) {
    let user_name = item.user.name
    let title = item.url.split("/")[4]
    let largest_video_file = item.video_files.sort((a, b) => parseInt(b.width) - parseInt(a.width))[0]
    let folder = path.join(OUTPUT_ROOT, user_name, title)
    let extension = ".unknown"
    if (largest_video_file.file_type === "video/mp4") {
        extension = ".mp4"
    }
    let filename = path.join(folder, largest_video_file.id.toString() + extension)
    save_to_disk(largest_video_file.link, folder, filename)
}

function save_videos(media) {
    for (const item of media.media) {
        save_video(item);
    }
}

function save_page(target_collection, page_num) {
    client.collections.media({id: target_collection['id'], page: page_num, per_page: PER_PAGE}).then(media => {
        save_videos(media);
        console.log("Saved: " + saved.toString())
    })
}

function save_collection(target_collection) {
    for (let page_num = 1; page_num <= Math.ceil(target_collection.videos_count / PER_PAGE); page_num++) {
        save_page(target_collection, page_num);
    }
}

client.collections.all({per_page: 1}).then(collections => {
    console.log(collections.error)
    let target_collection = collections.collections.find(o => o.title === COLLECTION_NAME)
    save_collection(target_collection);
})

// URL = "https://player.vimeo.com/external/464155294.hd.mp4?s=029f020296b2170c5ec708aed35fbad44afe6080&profile_id=172&oauth2_token_id=57447761"
// FOLDER = "output/Anastasia  Shuraeva/a-happy-family-dancing-with-their-white-dog-5500750"
// FILE = "output/Anastasia  Shuraeva/a-happy-family-dancing-with-their-white-dog-5500750/1439184.mp4"
// save_to_disk(URL, FOLDER, FILE)