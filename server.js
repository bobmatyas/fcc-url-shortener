'use strict';

var express = require('express');

var cors = require('cors');

var app = express();

var port = process.env.PORT || 3000;

var mongoose = require('mongoose');
var autoIncrement = require('mongoose-plugin-autoinc-fix');
var Schema = mongoose.Schema;

var mongodb = require('mongodb');
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;

const UrlSchema = new mongoose.Schema({
    original_url: String
});


UrlSchema.plugin(autoIncrement.plugin, 'Url');
const Url = db.model('Url', UrlSchema);


app.use(cors());

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});


// URL Shortener Endpoint 
app.post("/api/shorturl/new", function (req, res) {
  if (checkUrl(req.body.url)) {
    if (req.body.url.substring(0, 7) !== 'http://' || req.body.url.substring(0, 8) !== 'https://' )
      req.body.url = 'http://' + req.body.url;
    var newUrl = new Url({original_url:req.body.url});
    newUrl.save(function(err, data) {
      res.json({'shortened_url': data._id});
    });   
  } else {
    res.json({'error': 'invalid url'});
  }
});

// URL Redirect Endpoint
app.get("/api/shorturl/:number", function (req,res) {
  Url.findOne({"_id":req.params.number}, function(err, result) {
    if (result !== null) {
      res.redirect(result.original_url);
    } else 
      res.json({'error': 'invalid request'});  
})});

app.listen(port, function () {
  console.log('Node.js listening ...');
});


function checkUrl(str) {
  var regexp =  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    if (regexp.test(str))
      return true;
    else
      return false;
}