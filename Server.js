var app     =     require("express")();
var mysql   =     require("mysql");
var http    =     require('http').Server(app);
var io      =     require("socket.io")(http);
var basicAuth =   require("basic-auth");

var auth = function(req, res, next){
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  if (user.name === 'user' && user.pass === 'pass') {
    return next();
  } else {
    return unauthorized(res);
  };
};

var pool    =    mysql.createPool({
      connectionLimit   :   1000,
      host              :   'localhost',
      user              :   'user',
      password          :   'pass',
      database          :   'db',
      debug             :   false
});


app.get("/",function(req,res){
    res.sendFile(__dirname + '/index.html');
});

app.get("/add",auth,function(req,res){
    res.sendFile(__dirname + '/add.html');
});


io.on('connection',function(socket){
    socket.on('notification added',function(text,img,sound,duration){
      add_notification(text, img, sound,duration,function(res){
        if(res){
            io.emit('notification added','Notification pushed and in queue: "'+text+'"');
            io.emit('refresh feed',text,img,sound,duration);
        } else {
            io.emit('error');
        }
      });
    });
});

var add_notification = function (text,img,sound,duration,callback) {
    pool.getConnection(function(err,connection){
        if (err) {
          //connection.release();
          callback(false);
          return;
        }
    connection.query("INSERT INTO `notification` (`text`, `image`, `sound`, `duration`) VALUES ('"+text+"', '"+img+"', '"+sound+"', '"+duration+"')",function(err,rows){
            connection.release();
            if(!err) {
              callback(true);
            }
        });
     connection.on('error', function(err) {
              callback(false);
              console.log(err);
              return;
        });
    });
}

http.listen(3000,function(){
    // console.log("Listening on 3000");
});
