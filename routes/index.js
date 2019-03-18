var express = require('express');
var router = express.Router();
var multer = require("multer");
var path = require('path');
const stringrandom = require('string-random');
const { exec } = require('child_process');
var event = require('events').EventEmitter();
var expressWs = require('express-ws');

expressWs(router)
var socketuser;
var userlist = {};
var linkusernum = 0;

var modelDirect={"iv3":"InceptionV3","mv2":"MobileNetV2"};

const sleep = ms => new Promise(res => setTimeout(res, ms));

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads');
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

var upload = multer({ storage: storage });
var imgBaseUrl = '../'

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('ClothClassify.html');
});

router.get('/howto',function(req, res, next) {
  res.redirect('help.html');
});

router.get('/classify',function(req, res, next){
  var imgdir=req.query;
  console.log(imgdir);
  res.sendFile(path.resolve(__dirname,'../public/Classify.html'));
});

router.post('/classifystart',function(req, res, next){
  var imgdir=req.body.image;
  var model=req.body.model;
  var id =req.body.id;
  console.log("dir-model" , imgdir, model);
  try{
    execshell(model, imgdir, id);
  }
  catch(e){
    console.log(e)
  }

  res.json({success:"true"})
  // res.end();
});

async function execshell(model, imgdir, id){
  // await exec("python core/label_image.py --graph=../../core/" + modelDirect[model] + "/output_graph.pb --labels=../../core/" + modelDirect[model] + "/output_labels.txt --input_layer=Placeholder --output_layer=final_result --image=public/"+imgdir, (err, stdout, stderr) => {
  //   if (err) {
  //     console.log("child processes failed with error code: " + err.code);
  //     return;
  //   }
  
  //   // the *entire* stdout and stderr (buffered)
  //   console.log(`stdout: ${stdout}`);
  //   console.log(`stderr: ${stderr}`);
  // });
  // console.log("shell execte finish");
  console.log("Before Sleep");
  await sleep(1000);
  console.log("After Sleep");
  var options = {
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };
  var fileName = (imgdir.replace(/^ResImage\//,"")).replace(/.png$/,"")+".json";
  // console.log(path.resolve(__dirname,'../ResLabel/data.json'))
  var file = require(path.resolve(__dirname,'../ResLabel/data.json'))
  // console.log("jsonfile", file)
  // console.log("jsonfilestr",JSON.stringify(file))
  // socketuser.send(JSON.stringify(file))
  userlist[id].send(JSON.stringify(file))
  return;
}

router.post('/send',function(req, res, next){
  try{
    // console.log(JSON.stringify(req.body).slice(0,100));
    var base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
    var name = stringrandom(16);
    // console.log(name);
    var fileurl="public/ResImage/"+ name +".png";
    require("fs").writeFile(fileurl, base64Data, 'base64',function(err){});
    // console.log('write suc');
    res.json({success:"true", url:fileurl});
  }
  catch(e){
    console.log(e)
    res.json({success:"false"})
    res.end();
  }
});

router.ws('/echo', (ws, req) => {
  socketuser = ws;
  ws.on('message', msg => {
    if(msg = "connect"){
      console.log('linkuser', linkusernum)
      linkusernum++;
      userlist[linkusernum] = ws;
      ws.send(JSON.stringify({"id":linkusernum}))
    }
  })

  ws.on('connection', () => {
    console.log('linkuser', linkusernum)
    linkusernum++;
    userlist[linkusernum.toString()] = ws;
    ws.send(JSON.stringify({"id":linkusernum}))
  })

  ws.on('close', () => {
      console.log('WebSocket was closed')
  })
})

module.exports = router;
