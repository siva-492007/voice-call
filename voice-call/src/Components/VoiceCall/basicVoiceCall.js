import AgoraRTC from "agora-rtc-sdk-ng"
import {useEffect} from 'react'
import axios from 'axios'

const appId = '78396c152c624a65b212ca2922a1fa6c'
const channelName = 'demoChannel'
const tokenServerURL = 'http://127.0.0.1:8080/rtc-token'

let rtc = {
    localAudioTrack: null,
    client: null
};

let options = {
    appId: appId,
    channel: channelName,
    uid: 123457,
    role: 'publisher',
    tokenType: 'uid'
};


const handeVoiceCallStart = async () => {
    const body = {
        channelName: options.channel,
        uid: options.uid,
        role: options.role,
        tokenType: options.tokenType
    }    
    let token;
    await axios.post(tokenServerURL, body, {
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Access-Control-Allow-Origin': '*'
    }})
        .then(res => {
            token = res.data.rtcToken
            console.log('token: ', token)
        })
        .catch(err => {
            console.log('fetch token error: ', err)
        })

    await rtc.client.join(options.appId, options.channel, token, options.uid);
    rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    await rtc.client.publish([rtc.localAudioTrack]);
    console.log("publish success!");

    //notify the user and pop up a modal with a button 'connect' to join the voice call channel
}

const handleVoiceCallEnd = async () => {
    rtc.localAudioTrack.close();
    await rtc.client.leave();
}

const VoiceCall = () => {

    useEffect(() => {
        rtc.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        rtc.client.on("user-published", async (user, mediaType) => {
            await rtc.client.subscribe(user, mediaType);
            console.log("subscribe success");

            if (mediaType === "audio") {
                const remoteAudioTrack = user.audioTrack;
                remoteAudioTrack.play();
            }

            rtc.client.on("user-unpublished", async (user) => {
                console.log('unsubscribed user: ', user.uid)
                await rtc.client.unsubscribe(user);                
            });
        })
    }, [])

    return(
        <div>
            <button onClick={()=>handeVoiceCallStart()} >
                Call
            </button>
            <button onClick={()=>handleVoiceCallEnd() } >
                End
            </button>
        
        </div>
    )
}

export default VoiceCall;