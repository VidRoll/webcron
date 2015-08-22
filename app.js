var AWS = require('aws-sdk');
var express = require('express');
var bodyParser = require('body-parser');
var schedule = require('node-schedule');

AWS.config.region = process.env.REGION;

var AWSAccessKeyId = 'AKIAIWGHZLU3QW3GIUTQ';
var AWSSecretKey = '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';
var sns = new AWS.SNS({region:"us-east-1",
        'accessKeyId': AWSAccessKeyId,
        'secretAccessKey': AWSSecretKey});
var snsInvTopic =  process.env.TRACK_INV_TOPIC || 'arn:aws:sns:us-east-1:419997458948:mmx-track-inv';
var snsImpTopic =  'arn:aws:sns:us-east-1:419997458948:mmx-track-imp';
var snsClickTopic =  'arn:aws:sns:us-east-1:419997458948:mmx-track-click';
var snsQuartileTopic =  'arn:aws:sns:us-east-1:419997458948:mmx-track-quartile';
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

var invSchedule = schedule.scheduleJob('*/30 * * * * *', function(){
    console.log('Track Inventory Every 30 seconds: ', counter++);
    sns.publish({
        'Message': 'Track Inventory',
        'Subject': 'Track Inventory',
        'TopicArn': snsInvTopic
    }, function(err, data) {
        if (err) {
            console.log('SNS Error: ' + err);
        } else {
            console.log('SNS Success: ');
            console.log(data);
        }
    });
});

var impSchedule = schedule.scheduleJob('*/1 * * * *', function(){
    console.log('Track Impression Every 60 seconds: ', counter++);
    sns.publish({
        'Message': 'Track Impression',
        'Subject': 'Track Impression',
        'TopicArn': snsImpTopic
    }, function(err, data) {
        if (err) {
            console.log('SNS Error: ' + err);
        } else {
            console.log('SNS Success: ');
            console.log(data);
        }
    });
});

var clickSchedule = schedule.scheduleJob('*/5 * * * *', function(){
    console.log('Track Click Every 300 seconds: ', counter++);
    sns.publish({
        'Message': 'Track Click',
        'Subject': 'Track Click',
        'TopicArn': snsClickTopic
    }, function(err, data) {
        if (err) {
            console.log('SNS Error: ' + err);
        } else {
            console.log('SNS Success: ');
            console.log(data);
        }
    });
});

var quartileSchedule = schedule.scheduleJob('*/45 * * * * *', function(){
    console.log('Track Quartile Every 60 seconds: ', counter++);
    sns.publish({
        'Message': 'Track Quartile',
        'Subject': 'Track Quartile',
        'TopicArn': snsQuartileTopic
    }, function(err, data) {
        if (err) {
            console.log('SNS Error: ' + err);
        } else {
            console.log('SNS Success: ');
            console.log(data);
        }
    });
});



var server = app.listen(port, function () {
    console.log('Server running on port' + port + '/');
});
