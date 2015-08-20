var AWS = require('aws-sdk');
var express = require('express');
var bodyParser = require('body-parser');
var schedule = require('node-schedule');

AWS.config.region = process.env.REGION;

var sns = new AWS.SNS({region:"us-east-1"});
var snsTopic =  process.env.TRACK_INV_TOPIC;
var app = express();

app.set('view engine', 'ejs');
app.use('/static', express.static(__dirname + '/static'));
//app.use(express.static('static'));
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({extended:false}));

app.get('/', function(req, res) {
    res.render('index', {
        static_path: 'static',
        theme: process.env.THEME || 'flatly',
        flask_debug: process.env.FLASK_DEBUG || 'false'
    });
});

var port = process.env.PORT || 8080;
var counter = 0;

var j = schedule.scheduleJob('*/59 * * * * *', function(){
    console.log('Every 10 seconds: ', counter++);
    sns.publish({
        'Message': 'Track Inventory',
        'Subject': 'Track Inventory',
        'TopicArn': snsTopic
    }, function(err, data) {
        if (err) {
            console.log('SNS Error: ' + err);
        } else {
            console.log('SNS Success: ' + err);
        }
    });

});

var server = app.listen(port, function () {
    console.log('Server running on port' + port + '/');
});
