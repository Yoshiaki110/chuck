var setting = require('./setting.js');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

var LINE_CHANNEL_ACCESS_TOKEN = setting.LINE_CHANNEL_ACCESS_TOKEN;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));

function reply(event, text){
    var headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
    }
    console.log(headers);
    var body = {
        replyToken: event.replyToken,
        messages: [{
            type: 'text',
            text: text
        }]
    }
    console.log(body);
    var url = 'https://api.line.me/v2/bot/message/reply';
    request({
        url: url,
        method: 'POST',
        headers: headers,
        body: body,
        json: true
    }, function(error, response, bdy){
        if (!error && response.statusCode == 200) {
            console.log(bdy);
        } else {
            console.log('error: '+ response.statusCode);
        }
    });
}

app.post('/', function(request, response) {
  console.log('post');
  console.log(request.body);
  console.log(request.body.events[0].beacon);
  console.log(request.body.events[0].beacon.hwid);
  console.log(request.body.events[0].beacon.dm);
  console.log(request.body.events[0].beacon.type);
  response.sendStatus(200);
  for (var event of request.body.events){
    console.log('event.type : ' + event.type);
    console.log('event.source.type : ' + event.source.type);
    if (event.source.type == 'user') {
      console.log('event.source.userId : ' + event.source.userId);
    }
    if (event.type == 'message') {
        if (event.message.text == 'id' || event.message.text == 'ID' || event.message.text == 'ｉｄ' || event.message.text == 'ＩＤ'){
            reply(event, 'あなたのIDは「' + event.source.userId + '」です');
        } else {
            hash_list[event.source.userId]  = event.message.text;
        }
    } else if (event.type == 'beacon') {
        var dt = new Date(event.timestamp);
        dt.setTime(dt.getTime() + 32400000); // 1000 * 60 * 60 * 9(hour)
        var month = dt.getMonth()+1;
        var day   = dt.getDate();
        var hour  = dt.getHours();
        var min   = dt.getMinutes();
        if (min   < 10) {
            min   = '0' + min;
        }
        console.log(month + '/' + day + ' ' + hour + ':' + min);
        console.log('event.beacon.type : ' + event.beacon.type);
        console.log('event.beacon.hwid : ' + event.beacon.hwid);
        console.log('event.beacon.dm : ' + event.beacon.dm);
        reply(event, month + '/' + day + ' ' + hour + ':' + min + ' ' + event.beacon.type);
    }
    if (event.type == 'postback'){
      console.log('postback: '+ event.postback.data);
      hash_list[event.source.userId]  = event.postback.data;
    }
  }
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});
