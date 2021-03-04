const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
require('dotenv').config();
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');
const request = require('superagent');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // http logging

const { formatResults } = require('./utils.js');


const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
// app.get('/api/test', (req, res) => {
//   res.json({
//     message: `in this proctected route, we get the user's id like so: ${req.userId}`
//   });
// });

app.get('/videos', async(req, res) => {
  try {
    const search = req.query.search;
    //const quoteData = await request.get(`https://breaking-bad-quotes.herokuapp.com/v1/quotes`);
    const quoteData = await request.get(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${search}&key=AIzaSyAkAjhrL94y2uy-PCiGYBJzF4xx7Rw-kVk`);
    //const quoteData = await request.get(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=health&key=AIzaSyAkAjhrL94y2uy-PCiGYBJzF4xx7Rw-kVk`);
    const formattedResponse = formatResults(quoteData.body);
    res.json(formattedResponse);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/favorites', async(req, res) => {
  try {
    const data = await client.query(
      'SELECT * from favorites where owner_id=$1', 
      [req.userId],
    );
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});


app.delete('/api/favorites/:id', async(req, res) => {
  try {
    const data = await client.query(
      'DELETE from favorites where owner_id=$1 AND id=$2', 
      [req.userId, req.params.id],
    );
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/favorites', async(req, res) => {
  try {
    const data = await client.query(`
      INSERT INTO favorites (title, description, channel_title, youtube_db_id, owner_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `, 
    [
      req.body.title, 
      req.body.description,
      req.body.channel_title,
      req.body.youtube_db_id,
      req.userId]);
    
    res.json(data.rows[0]);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
