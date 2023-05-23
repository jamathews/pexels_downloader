const pexels = require('pexels')
const fs = require("fs");
const path = require('path');
const url = require('url');
const https = require('https');
const client = pexels.createClient(process.env.API_KEY)
const COLLECTION_NAME = 'UnderPenaltyOfDeath'
const PER_PAGE = 25
const OUTPUT_ROOT = "./output"
let saved = 0;

function write_downloaded_file(localPath, res) {
    const filePath = fs.createWriteStream(localPath);
    res.pipe(filePath);
    filePath.on('finish', () => {
        filePath.close();
        saved += 1
        console.log('Downloaded (' + saved.toString() + '): ' + localPath + " " + filePath.bytesWritten.toString() + " bytes");
    })
}

function download(file_url, localPath) {
    if (fs.existsSync(localPath)) {
        console.log(localPath + " exists, not overwriting it.")
    } else {
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
    let user_name = "unknown_user"
    if (item.user && item.user.name) {
        user_name = item.user.name
    } else if (item.username) {
        user_name = item.username
    }
    let title = item.url.split("/")[4]
    if (item && item.video_files) {
        let largest_video_file = item.video_files.sort((a, b) => parseInt(b.width) - parseInt(a.width))[0]
        let extension = ".unknown"
        if (largest_video_file.file_type === "video/mp4") {
            extension = ".mp4"
        }
        let filename = path.join(OUTPUT_ROOT, user_name + "__" + title + "__" + largest_video_file.id.toString() + extension)
        save_to_disk(largest_video_file.link, OUTPUT_ROOT, filename)
    } else {
        console.log("Item has no video files\n" + item.url)
    }
}

function save_videos(media) {
    for (const item of media.media) {
        save_video(item);
    }
}

function save_page(target_collection, page_num) {
    client.collections.media({id: target_collection['id'], page: page_num, per_page: PER_PAGE}).then(media => {
        save_videos(media);
    })
}

function save_collection(target_collection) {
    console.log("Collection contains " + target_collection.videos_count.toString() + " videos.")
    let first_page = 1
    let last_page = Math.ceil(target_collection.videos_count / PER_PAGE) + 10
    for (let page_num = first_page; page_num <= last_page; page_num++) {
        console.log("Saving page " + page_num.toString() + "/" + last_page.toString())
        save_page(target_collection, page_num);
    }
}

function main() {
    client.collections.all({per_page: 1}).then(collections => {
        if (collections.error) {
            console.log(collections.error)
        } else if (collections.collections) {
            let target_collection = collections.collections.find(o => o.title === COLLECTION_NAME)
            if (target_collection) {
                save_collection(target_collection);
            } else {
                console.log("Can't find collection " + COLLECTION_NAME)
            }
        } else {
            console.log("No collections")
        }
    })
}

function main_bypass_api() {
    URL = "https://player.vimeo.com/external/464155294.hd.mp4?s=029f020296b2170c5ec708aed35fbad44afe6080&profile_id=172&oauth2_token_id=57447761"
    FILE = os.path.join(OUTPUT_ROOT, "Anastasia  Shuraeva__a-happy-family-dancing-with-their-white-dog-5500750__1439184.mp4")
    save_to_disk(URL, OUTPUT_ROOT, FILE)
}

main();
// main_bypass_api();
