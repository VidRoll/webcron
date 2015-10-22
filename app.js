var AWS = require('aws-sdk');
var express = require('express');
var bodyParser = require('body-parser');
var schedule = require('node-schedule');
cors = require('cors');

AWS.config.region = process.env.REGION;

var AWSAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
var AWSSecretKey = process.env.AWS_SECRET_KEY;
var sns = new AWS.SNS({region:"us-east-1",
        'accessKeyId': AWSAccessKeyId,
        'secretAccessKey': AWSSecretKey});
var snsInvTopic =  process.env.TRACK_INV_TOPIC || 'arn:aws:sns:us-east-1:419997458948:mmx-track-inv';
var snsImpTopic =  'arn:aws:sns:us-east-1:419997458948:mmx-track-imp';
var snsClickTopic =  'arn:aws:sns:us-east-1:419997458948:mmx-track-click';
var snsQuartileTopic =  'arn:aws:sns:us-east-1:419997458948:mmx-track-quartile';
var snsJutInvTopic = 'arn:aws:sns:us-east-1:419997458948:jut-track-inv';
var snsJutImpTopic = 'arn:aws:sns:us-east-1:419997458948:jut-track-imp';

var invScheduleTime = '*/1 * * * * *';
var impScheduleTime = '*/5 * * * * *';
var clickScheduleTime = '*/1 * * * *';
var quartileScheduleTime = '*/1 * * * * *';

var app = express();

app.set('view engine', 'ejs');
app.use('/static', express.static(__dirname + '/static'));
app.use('/', express.static(__dirname + '/static'));
//app.use(express.static('static'));
app.set('views', __dirname + '/views');

app.use(cors());
app.use(bodyParser.urlencoded({extended:false}));

app.get('/', function(req, res) {
    res.render('index', {
        static_path: 'static',
        theme: process.env.THEME || 'flatly',
        flask_debug: process.env.FLASK_DEBUG || 'false'
    });
});

app.get('/vast', function(req, res) {
    res.setHeader('content-type', 'text/xml');
    var query = require('url').parse(req.url,true).query;
    res.render('vast',{query:query});
});

var port = process.env.PORT || 3000;
var counter = 0;

function sendSNSTopic(msg, subj, topic) {
    sns.publish({
        'Message': msg,
        'Subject': subj,
        'TopicArn': topic
    }, function(err, data) {
        if (err) {
            // console.log(subj,' SNS Error: ' + err);
        } else {
            console.log(subj, ' SNS Success: ');
            console.log(data);
        }
    });
}

var invSchedule = schedule.scheduleJob(invScheduleTime, function(){
    sendSNSTopic('Track Inventory', 'Track Inventory', snsInvTopic);
    sendSNSTopic('Track Inventory', 'Track Inventory', snsInvTopic);
    sendSNSTopic('Track Inventory', 'Track Inventory', snsInvTopic);
    sendSNSTopic('Track Inventory', 'Track Inventory', snsInvTopic);
    sendSNSTopic('Track Inventory', 'Track Inventory', snsInvTopic);
    sendSNSTopic('Track Inventory', 'Track Inventory', snsInvTopic);
    sendSNSTopic('Track Inventory', 'Track Inventory', snsInvTopic);

    /*sendSNSTopic('Track Inventory', 'Track Inventory', snsJutInvTopic);
    sendSNSTopic('Track Inventory', 'Track Inventory', snsJutInvTopic);*/
});

var impSchedule = schedule.scheduleJob(impScheduleTime, function(){
    sendSNSTopic('Track Impression', 'Track Impression', snsImpTopic);
    sendSNSTopic('Track Impression', 'Track Impression', snsImpTopic);

    /*sendSNSTopic('Track Impression', 'Track Impression', snsJutImpTopic);*/
});

var clickSchedule = schedule.scheduleJob(clickScheduleTime, function(){
    sendSNSTopic('Track Click', 'Track Click', snsClickTopic);
});

var quartileSchedule = schedule.scheduleJob(quartileScheduleTime, function(){
    sendSNSTopic('Track Quartile', 'Track Quartile', snsQuartileTopic);
    sendSNSTopic('Track Quartile', 'Track Quartile', snsQuartileTopic);
});



var server = app.listen(port, function () {
    console.log('Server running on port' + port + '/');
});
