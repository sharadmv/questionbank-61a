/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , question = require('./routes/question')
  , admin = require('./routes/admin')
  , user = require('./routes/user')
  , http = require('http')
  , dao = require('./util/dao.js')
  , model = require('./util/model.js')
  , auth = require('./util/auth.js')
  , md = require('node-markdown').Markdown
  , path = require('path');

var app = express();

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('this is my secret'));
  app.use(express.cookieSession());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.static(path.join(__dirname, 'databases')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/questions', question.list);
app.get('/question/:id', question.single);
app.get('/admin', admin.home);
app.get('/admin/:action', function(req, res) {
  admin[req.params.action](req, res);
});

var session = {
};

/* User Settings */
app.get('/settings', function(req, res) {
  var sections = ['1', '2', '3'];

  var user = dao.user.getByLogin(req.signedCookies.login, function(err, result) {
    res.render('settings', {
      login: result.login,
      username: result.username,
      userSection: result.section,
      sections: sections,
    });
  });
});

app.post('/api/session', function(req, res) {
  var login = req.param('login');
  var password = req.param('password');
  auth.authenticate(login, password, function(result) {
    if (result) {
      dao.user.getByLogin(login, function(err, user) {
        res.cookie('login', login, {signed : true});
        console.log(user);
        if (user.username == "") {
          res.send(201);
        } else {
          res.send(200);
        }
      });
    } else {
      res.send(501);
    }
  });
});

app.del('/api/session', function(req, res) {
  res.clearCookie('login');
});

app.get('/api/users', function(req, res) {
  dao.user.find({}, function(err, result) {
    res.json(result);
  });
});

app.post('/settings', user.update);

//API functions
app.get('/api/question/:id', function(req, res) {
  var start = new Date().getTime();
  dao.question.getById(req.params.id, function(err, result) {
    res.json({ data : result, elapsed : (new Date().getTime() - start)});
  })
});

app.get('/api/question', function(req, res) {
  var start = new Date().getTime();
  dao.question.find({}, function(err, result) {
    res.json({ data : result, elapsed : (new Date().getTime() - start)});
  })
});

app.post('/api/question', admin.save);


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
