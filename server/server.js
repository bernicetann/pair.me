require('dotenv').config();

const PORT        = process.env.PORT || 8080;
const S_PORT      = process.env.S_PORT || 5000;
const ENV         = process.env.ENV || "development";

const express     = require("express");

const app         = express();
// const server      = require('http').Server(app);

const https = require('https')
const fs = require('fs')


const session     = require('express-session');
const passport    = require('passport');

const bodyParser  = require("body-parser");
const sass        = require("node-sass-middleware");

const knexConfig  = require("./knexfile");
const knex        = require("knex")(knexConfig[ENV]);

const morgan      = require('morgan');
const knexLogger  = require('knex-logger');

// Modules
const Routes      = require("./routes/routes");
const githubAuth  = require('./passport')(knex,passport);


//Only use knexLogger and morgan in development.
//Load the logger first so all (static) HTTP requests are logged to STDOUT
//'dev' = Concise output colored by response status for development use.
//The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
if (ENV === 'development') {
  const morgan = require('morgan');
  app.use(morgan('dev'));
  const knexLogger = require('knex-logger');
  app.use(knexLogger(knex));
}

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static("public"));

//initialze passport, passport.session for persistent login
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use(ensureSecure);
function ensureSecure(req, res, next){
  if(req.secure){
    next();  // OK, continue to next middleware/handler/router/etc
  } else {
    // new protocol, old hostname, new port, old url
    res.redirect('https://' + req.hostname + ':' + S_PORT + req.url);
  }
}

// Mount all resource routes
app.use("/", Routes(knex));


const httpsOptions = {
  key: fs.readFileSync('keys/key.pem'),
  cert: fs.readFileSync('keys/cert.pem')
}
const server = https.createServer(httpsOptions, app).listen(S_PORT, () => {
  console.log('Secure server running at ' + S_PORT)
})
const redir = app.listen(PORT, () => {
  console.log(`redirecting on ${PORT}`);
});
const io = require('socket.io')(server);



//----------------socketIO ----------------------//
// let users = []
io.on('connection', (socket) => {
  console.log('connection to client established');

  //messages from chatbox
  socket.on('clientMessage', (message)=>{
    let clientMessage = JSON.parse(message);
    io.emit('serverMessage', clientMessage.message);
  })

  //messages from ace editor
  socket.on('liveCode', (code) => {
    let liveCode = JSON.parse(code);
    io.emit('serverLiveCode', liveCode.code);
  })

  socket.on('disconnect', () => {
    console.log('server disconnected');
  })

});

//-----------------------------------------------//
