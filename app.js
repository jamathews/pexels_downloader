const pexels = require('pexels')
const client = pexels.createClient(process.env.API_KEY)

const COLLECTION_NAME = 'I\'m Moving But I\'m Not Going Anywhere'


client.collections.all({per_page: 1}).then(collections => {
    let target_collection = collections.collections.find(o => o.title === COLLECTION_NAME)
    client.collections.media({id: target_collection['id'], page: 1}).then(media => {
        for (const item of media.media) {
            let user_name = item.user.name
            let title = item.url.split("/")[4]
            let largest_video_file = item.video_files.sort((a, b) => parseInt(b.width) - parseInt(a.width))[0]
            console.log(user_name + "\t" + title + "\t" + largest_video_file.link)
        }
    })
})
