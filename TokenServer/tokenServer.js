const express = require('express');
const bodyParser = require('body-parser');  
const cors = require('cors')
const {RtcTokenBuilder, RtcRole} = require('agora-access-token');


const app = express();
app.use(cors())
app.use(bodyParser.json());
const PORT =  8080;
const APP_ID = '78396c152c624a65b212ca2922a1fa6c';
const APP_CERTIFICATE = '65a61c96cf52419793892ecfb053b41a';

// const nocache = (_, resp, next) => {
//   resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
//   resp.header('Expires', '-1');
//   resp.header('Pragma', 'no-cache');
//   next();
// }

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
app.post('/rtc-token/', generateRTCToken);

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});