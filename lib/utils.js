function formatResults(someData) {
// console.log(someData, 'HELLO')
  return someData.items.map(item => ({
    title: item.snippet.title,
    description: item.snippet.description,
    channel_title: item.snippet.channelTitle,
    youtube_db_id: item.id.videoId,
  }));
}
    
module.exports = {
  formatResults
};