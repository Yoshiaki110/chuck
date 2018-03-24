var setting = require('./setting.js');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

var LINE_CHANNEL_ACCESS_TOKEN = setting.LINE_CHANNEL_ACCESS_TOKEN;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));

function reply(event, text) {
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
function reply(req) {
    var headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
    }
//    console.log(headers);
    var body = {
        to: req.body.id,
        messages: [{
            type: 'template',
            altText: '人を発見',
            template: {
                type: "buttons",
                thumbnailImageUrl: 'https://shakainomado.azurewebsites.net/chuck.png',
                title: '人を発見',
                text: 'どうします？',
                actions: [
                    {
                      type: 'postback',
                      label: 'あいさつする',
                      data: 'こんにちは'
                    },
                    {
                      type: 'postback',
                      label: '警告する',
                      data: 'このくるまは、かんししています'
                    }
                ]
            }
        }]
    }
    console.log(body);
    var url = 'https://api.line.me/v2/bot/message/push';
    request({
        url: url,
        method: 'POST',
        headers: headers,
        body: body,
        json: true
    }, function(error, response, body){
        if (!error && response.statusCode == 200) {
            console.log(body.name);
        } else {
            console.log('error: '+ response.statusCode);
        }
    });

}
app.post('/', function(request, response) {
  console.log('post');
  console.log(request.body);
  response.sendStatus(200);

  for (var event of request.body.events){
    console.log('event.type : ' + event.type);
//    console.log('event.source.type : ' + event.source.type);
    console.log('event.source : ' + event.source);
    if (event.source.type == 'user') {
      console.log('event.source.userId : ' + event.source.userId);
    }
    if (event.type == 'message') {
      console.log('message : ' + event.message.text);
    } else if (event.type == 'beacon') {
        console.log('event.beacon.type : ' + event.beacon.type);
        console.log('event.beacon.hwid : ' + event.beacon.hwid);
        console.log('event.beacon.dm : ' + event.beacon.dm);
        if (event.beacon.type == 'enter') {
          reply(event, ' ' + event.beacon.dm + ' ' + event.beacon.type);
        }
    }
    if (event.type == 'postback'){
      console.log('postback: '+ event.postback.data);
    }
  }
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});
