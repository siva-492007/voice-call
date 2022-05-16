const express = require('express');
const { createServer } = require("http");
const { Server } = require("socket.io");
const bodyParser = require('body-parser');  
const cors = require('cors')
const {RtcTokenBuilder, RtcRole} = require('agora-access-token');


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
httpServer.listen(9080);

app.use(cors())
app.use(bodyParser.json());
const PORT =  8090;
const APP_ID = '78396c152c624a65b212ca2922a1fa6c';
const APP_CERTIFICATE = '65a61c96cf52419793892ecfb053b41a';

// const nocache = (_, resp, next) => {
//   resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
//   resp.header('Expires', '-1');
//   resp.header('Pragma', 'no-cache');
//   next();
// }

let db = {}
  


let uid = null
let officialId = null
io.on('connection', (soc) => {

  // user sends his uid to
  soc.on('uid', (data) => {
    uid = data.uid
    db[uid] = soc.id
    console.log('db: ', db)
  })

  // receive officals ID
  soc.on('officialId', (data) => {
    officialId = data.officialId
    db[officialId] = soc.id
    console.log('db: ', db)
  })

  // event emitted by official when we calls user
  soc.on('callUser', (data) => {

    // fetch socket id from db using this uid
    let socketId = db[data.uid]
    
    let officialId = data.officialId

    let newData = {
      officialId: officialId
    }
    // inform user that official is on call
    io.to(socketId).emit('officialOnCall', newData)
  })

  soc.on('endCallByOfficial', (data)=> {
    let socId = db[data.uid]
    io.to(socId).emit('officialEndedCall')
  })

  soc.on('endCallByUser', (data) => {
    let socId = db[data.officialId]
    io.to(socId).emit('userEndedCall')
  })
})




const ping = (req, resp) => {
  resp.send({message: 'pong'});
}

const generateRTCToken = async (req, resp) => {
    const {channelName, uid} = req.body
      resp.header('Access-Control-Allow-Origin', '*');

      if (!channelName) {
        return resp.status(500).json({ 'error': 'channel is required' });
      }
 
      if(!uid || uid === '') {
        return resp.status(500).json({ 'error': 'uid is required' });
      }

      if (req.body.role === 'publisher') {
        role = RtcRole.PUBLISHER;
      } 
      else if (req.body.role === 'audience') {
        role = RtcRole.SUBSCRIBER
      } 
      else {
        return resp.status(500).json({ 'error': 'role is incorrect' });
      }
      let expireTime = req.query.expiry;
      if (!expireTime || expireTime === '') {
        expireTime = 3600;
      }
      else {
        expireTime = parseInt(expireTime, 10);
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const privilegeExpireTime = currentTime + expireTime;
      let token = null;
      if (req.body.tokenType === 'userAccount') {
        token = RtcTokenBuilder.buildTokenWithAccount(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime)
      } 
      else if (req.body.tokenType === 'uid') {
        token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime)
      } 
      else {
        return resp.status(500).json({ 'error': 'token type is invalid' });
      }

      console.log('token: ', token)
      return resp.json({ 'rtcToken': token });
  }

app.get('/ping', ping)
app.post('/rtc-token', generateRTCToken);

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});