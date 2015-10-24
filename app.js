var s3 = require('s3');
var mkdirp = require('mkdirp');
var AWS = require('aws-sdk');
var express = require('express');
var bodyParser = require('body-parser');
var schedule = require('node-schedule');
var cors = require('cors');
var fs = require('fs');

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


var client = s3.createClient({
  maxAsyncS3: 20,     // this is the default
  s3RetryCount: 3,    // this is the default
  s3RetryDelay: 1000, // this is the default
  multipartUploadThreshold: 20971520, // this is the default (20 MB)
  multipartUploadSize: 15728640, // this is the default (15 MB)
  s3Options: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY
    // any other options are passed to new AWS.S3()
    // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
  },
});


app.set('view engine', 'ejs');
app.use('/static', express.static(__dirname + '/static'));
app.use('/', express.static(__dirname + '/static'));
//app.use(express.static('static'));
app.set('views', __dirname + '/views');

app.use(cors());
app.use(bodyParser.urlencoded({extended:false}));

// app.get('/', function(req, res) {
//     res.render('index', {
//         static_path: 'static',
//         theme: process.env.THEME || 'flatly',
//         flask_debug: process.env.FLASK_DEBUG || 'false'
//     });
// });

app.get('/', function(req, res) {
    res.setHeader('content-type', 'text/xml');
    var q = require('url').parse(req.url,true).query;
    
    var date = new Date();
    var epoch = date.getTime();
    var localLog = __dirname + '/logs/' + epoch + ".json"
    mkdirp.sync(__dirname + '/logs')
    fs.writeFileSync(localLog, JSON.stringify(q), "utf8");

    var logParams = {
    	localFile: localLog,
    	s3Params: {
    		Bucket: "vast-test-logs",
    		Key: epoch +".json"
    	}
    }
    
    var logger = client.uploadFile(logParams);

    logger.on('error', function(err) {
      console.error("unable to download:", err.stack);
    });
    logger.on('progress', function() {
      console.log("progress", downloader.progressAmount, downloader.progressTotal);
    });
    logger.on('end', function() {
    	console.log('done uploading log file')
    });

    //https://6elmite4o0.execute-api.us-east-1.amazonaws.com/v1/
    mkdirp.sync(__dirname + '/vids')

    var file = __dirname + '/vids/'+q.vid +".json"
    // 1. go to s3 and get file
    var params = {
      localFile: file,
      s3Params: {
        // https://s3-us-west-2.amazonaws.com/vidroll-reportal/vids/entity-vidroll-NJisK89ge.json
        Bucket: "vidroll-reportal",
        Key: "vids/"+q.vid+".json"
        // other options supported by getObject
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property
      },
    };
    var downloader = client.downloadFile(params);
    downloader.on('error', function(err) {
      console.error("unable to download:", err.stack);
    });
    downloader.on('progress', function() {
      //console.log("progress", downloader.progressAmount, downloader.progressTotal);
    });
    // 2. parse file for first url in entities array
    downloader.on('end', function() {
      // 3. based on url, create redirect
      var url = JSON.parse(fs.readFileSync(file),"utf8").entities[0];
      var macrosArray = url.split("=_")
      //console.log('macrosArray', macrosArray)
      for (var i=1; i<macrosArray.length; i++) {
        var macro = macrosArray[i].split("_&")[0].toLowerCase()
        //console.log('macro', macro)
        macrosArray[i] = "="+q[macro]+"&"+macrosArray[i].split("_&")[1]  
      }
      //console.log('macrosArray', macrosArray)
      // 4. redirect
      res.redirect(macrosArray.join(""))
    });

});


app.get('/wrapper', function(req, res) {
    res.setHeader('content-type', 'text/xml');
    var q = require('url').parse(req.url,true).query;
    res.render('wrapper',{q:q});
});


app.get('/vast', function(req, res) {
    res.setHeader('content-type', 'text/xml');
    var query = require('url').parse(req.url,true).query;
    res.render('vast',{query:query});
});

app.get('/slvpaid', function(req, res) {
    res.setHeader('content-type', 'text/xml');
    var q = require('url').parse(req.url,true).query;
    res.redirect('http://search.spotxchange.com/vast/2.00/'+q.id+'?VPAID=1&content_page_url='+q.url+'&cb='+q.cb+'&player_width='+q.w+'&player_height=q.h');
/*
http://search.spotxchange.com/vast/2.00/<%= query.id %>?VPAID=1&content_page_url=<%= query.url %>&cb=<%= query.cb %>&player_width=<%= query.w %>&player_height=<%= query.h %>
*/
    
});

app.get('/slvast', function(req, res) {
    res.setHeader('content-type', 'text/xml');
    var q = require('url').parse(req.url,true).query;
    res.redirect('http://search.spotxchange.com/vast/2.00/'+q.id+"?VPI=MP4&content_page_url="+q.url+"&site[cat]="+q.cat+"&device[dnt]=0&ip_addr="+q.ip+"&device[ua]="+q.ua+"&cb="+q.cb+"&player_width="+q.w+"&player_height="+q.h);
/*
http://search.spotxchange.com/vast/2.00/101663?VPI=MP4&content_page_url=[LR_URL]&site[cat]=[LR_CATEGORIES]&device[dnt]=0&ip_addr=[LR_IP]&device[ua]=[LR_USERAGENT]&cb=[TIMESTAMP]&player_width=[LR_WIDTH]&player_height=[LR_WIDTH]
*/    


});

app.get('/vid', function(req, res) {
    res.setHeader('content-type', 'text/xml');
    var q = require('url').parse(req.url,true).query;
    res.redirect('http://search.spotxchange.com/vast/2.00/'+q.id+"?VPI=MP4&content_page_url="+q.url+"&site[cat]="+q.cat+"&device[dnt]=0&ip_addr="+q.ip+"&device[ua]="+q.ua+"&cb="+q.cb+"&player_width="+q.w+"&player_height="+q.h);
/*
http://search.spotxchange.com/vast/2.00/101663?VPI=MP4&content_page_url=[LR_URL]&site[cat]=[LR_CATEGORIES]&device[dnt]=0&ip_addr=[LR_IP]&device[ua]=[LR_USERAGENT]&cb=[TIMESTAMP]&player_width=[LR_WIDTH]&player_height=[LR_WIDTH]
*/    


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
