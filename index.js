var setting = require('./setting.js');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

var LINE_CHANNEL_ACCESS_TOKEN = setting.LINE_CHANNEL_ACCESS_TOKEN;
var TWILIO_CALL_URL = setting.TWILIO_CALL_URL;
var TWILIO_CALL_BODY = setting.TWILIO_CALL_BODY;
var TWILIO_FLOW_URL = setting.TWILIO_FLOW_URL;
var TWILIO_ACCOUNT_SID = setting.TWILIO_ACCOUNT_SID;
var TWILIO_AUTH_TOKEN = setting.TWILIO_AUTH_TOKEN;
var ML_URI = setting.ML_URI;
var ML_APIKEY = setting.ML_APIKEY;
var GOOGLESHEET_URL = setting.GOOGLESHEET_URL;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('img'));
app.use(express.static('public'));

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

function select(id, hwid) {
  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
  }
//    console.log(headers);
  var body = {
    to: id,
    messages: [{
      type: 'template',
      altText: 'チャックを開けている人を発見',
      template: {
        type: "buttons",
        thumbnailImageUrl: 'https://shakainomado.azurewebsites.net/chuck.png',
        title: '近くにチャックを開けている人がいます ' + hwid,
        text: '探して、伝えてもらえませんか？\n恥ずかしいのであれば、こちらが電話で通知します\nどうします？',
        actions: [
          {
            type: 'postback',
            label: '私が伝えます',
            data: 'none'
          },
          {
            type: 'postback',
            label: '電話で教えてあげて',
            data: 'tel'
          }
        ]
      }
    }]
  }
  //console.log(body);
  var url = 'https://api.line.me/v2/bot/message/push';
  request({
    url: url,
    method: 'POST',
    headers: headers,
    body: body,
    json: true
  }, function(error, response, body){
    if (!error && response.statusCode == 200) {
      //console.log(body.name);
    } else {
      console.log('error: '+ response.statusCode);
    }
  });
}

app.post('/', function(request, response) {
  console.log('post');
  console.log(request.body);
  response.sendStatus(200);

  for (var event of request.body.events) {
    console.log('event.type : ' + event.type);
//    console.log('event.source.type : ' + event.source.type);
    console.log('event.source : ' + event.source);
    if (event.source.type == 'user') {
      console.log('event.source.userId : ' + event.source.userId);
    }
    if (event.type == 'message') {
      console.log('message : ' + event.message.text);
    } else if (event.type == 'beacon') {
      console.log('*event.beacon.type : ' + event.beacon.type);
      console.log('*event.beacon.hwid : ' + event.beacon.hwid);
      console.log('*event.beacon.dm : ' + event.beacon.dm);
      console.log('*event.source.userId : ' + event.source.userId);
      if (event.beacon.type == 'enter') {
        select(event.source.userId, event.beacon.hwid);
      } else {
        reply(event, 'チャックを閉めたか、あるいは離れていきました ' + event.beacon.hwid);
      }
    }
    if (event.type == 'postback') {
      console.log('postback: '+ event.postback.data);
      if (event.postback.data == 'tel') {
        twilio();
      }
    }
  }
});

app.post('/gunma', function(request, response) {
  console.log('post - gunma');
  console.log(request.body);
  console.log(request.body.data);
  response.sendStatus(200);

  var id = request.body.device;
  var strVlt = request.body.data.substr(0,4);
  var strCnt = request.body.data.substr(4,2);
  var vlt = parseInt(strVlt, 16);
  var cnt = parseInt(strCnt, 16);
  console.log(strVlt + ' ' + vlt + '   ' + strCnt + ' ' + cnt);
//  aiapi("" + cnt);
  var json = JSON.parse(fs.readFileSync(id + '.json', 'utf8'));
  if (json.enable && json.phone != '') {
//  twilio();
    twilio2(json.phone);
  }
  var now = new Date(Date.now() + 9*60*60*1000);
  var hour = now.getUTCHours();
  var day = now.getUTCDay();
  fs.appendFile('data.csv', day + ',' + hour + ',' + cnt + '\n', function (err) {
  });
  google(cnt, vlt);
});

app.get('/gunma', function(request, response) {
  console.log('get - gunma');
  console.log(request.body);
  response.sendStatus(200);
  google(33);
});

// 設定ファイルの読み込み
app.get('/gunma/setting', function(req, res) {
  console.log('<>GET /gunma/setting');
//  console.log(req);
  var id = req.url.split('?')[1];
  console.log(' ' + id);
  var json = JSON.parse(fs.readFileSync(id + '.json', 'utf8'));
  res.header('Content-Type', 'application/json; charset=utf-8');
  //res.sendStatus(200);
  res.send(json);
});

// 設定ファイルの書き込み
app.post('/gunma/setting', function(req, res) {
  console.log('<>POST /gunma/setting');
//  console.log(req.body);
  res.sendStatus(200);
  fs.writeFile(req.body.id + '.json', JSON.stringify(req.body, null, '  '));
  console.log(' ' + req.body.id + ' ' + req.body.phone + ' ' + req.body.enable);
});

app.post('/test2', function(request, response) {
  console.log('post - test2');
  console.log(request);
  response.sendStatus(200);
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});

function google(count, vlt) {
  var now = new Date(Date.now() + 9*60*60*1000);
  var hour = now.getUTCHours();
  var day = now.getUTCDay();
  var data = {"day": day, "hour": hour, "count": count, "vlt": vlt};

  var options = {
    uri: GOOGLESHEET_URL,
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }

  request(options, (err, res, body) => {
    if (!err && res.statusCode == 200) {
      console.log(body);
    } else {
      console.log("The request failed with status code: " + res.statusCode);
    }
  });
}

function twilio() {
  var headers = {
    'Accept': '*/*',
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  var body = TWILIO_CALL_BODY;
  var url = TWILIO_CALL_URL;
  request({
    url: url,
    method: 'POST',
    headers: headers,
    body: body,
    json: false
  });
}

function twilio2(phone) {
  var headers = {
    'Accept': '*/*',
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  var body = 'To=+81' + phone.substr(1) + '&From=+815031844729';
  console.log(body);
  var url = TWILIO_FLOW_URL;
  request({
    url: url,
    method: 'POST',
    headers: headers,
    auth: {
      user: TWILIO_ACCOUNT_SID,
      password: TWILIO_AUTH_TOKEN
    },
    body: body
  }
  , function(error, response, body){
    if (!error && response.statusCode == 200) {
      console.log(' twilio api sccess');
    } else {
      console.log(' twilio api error: '+ response.statusCode);
      console.log(body);
    }
  });
  console.log(" called " + phone);
}

function aiapi(str_cnt) {
  var data = {
    "Inputs": {
      "input1": {
        "ColumnNames": [
          "time",
          "count",
          "ans"
        ],
        "Values": [
          [
            "0",
            "0",
            str_cnt
          ]
        ]
      }
    },
    "GlobalParameters": {}
  }

  var options = {
    uri: ML_URI,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + ML_APIKEY,
    },
    body: JSON.stringify(data)
  }

  request(options, (err, res, body) => {
    if (!err && res.statusCode == 200) {
      console.log(body);
      var obj = JSON.parse(body);
      console.log(obj.Results.output1.value.Values[0][6]);
    } else {
      console.log("The request failed with status code: " + res.statusCode);
    }
  });
}
