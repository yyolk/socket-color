var WebSocketServer = require('ws').Server
  , http = require('http')
  , express = require('express')
  , app = express()
  , port = process.env.PORT || 5000;
var participants=0;
var c = [];
var INTERVAL = 6853;
var REMAINING = 0;

var rotate = function() {
  for (var i=0;i<3;i++) {
    c[i] = Math.floor(Math.random()*255);
  }
}
rotate();

var remaining_time = (function() {
  var sync = INTERVAL / 6;
  var sr = 0;
  return setInterval(function(){
    sr = sr + sync < INTERVAL ? sr + sync : 0;
    sr = Math.floor(sr);
    REMAINING = INTERVAL - sr;
  }, sync);
})();

var sirot = function() {
  return setInterval(function() {
    rotate();
  }, INTERVAL);
}
sirot();

app.use(function(req,res,next){
  // sirot();
  next();
});

app.use(express.static(__dirname + '/'));

var server = http.createServer(app);
server.listen(port);

console.log('http server listening on %d', port);

var wss = new WebSocketServer({server: server});
console.log('websocket server created');

var crot = sirot();
var sc = function(ws){
  var r = c[0], g = c[1], b = c[2];
  ws.send(JSON.stringify({
    r: r,
    g: g,
    b: b,
    p: participants,
    ir: REMAINING,
    i: INTERVAL
  }));
}
var clients = [];
wss.on('connection', function(ws) {
    clients.push(ws);
    participants = clients.length;
    var ccrot = function(){
      clearInterval(crot);
      crot = sirot();      
    }
    ccrot();
    var id = setInterval(function() {
        sc(ws);
    }, INTERVAL/5);
    sc(ws);

    console.log('websocket connection open');

    ws.on('close', function() {
        console.log('websocket connection close');
        clearInterval(id);
        delete clients[ws];
    });
    ws.on('message', function(message){
        console.log('interrupt!');
        rotate();
        ccrot();
        sc(ws);
    });
});
