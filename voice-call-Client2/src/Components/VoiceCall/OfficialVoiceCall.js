import AgoraRTC from "agora-rtc-sdk-ng"
import {useEffect} from 'react'
import axios from 'axios'
import io from "socket.io-client";


const appId = '78396c152c624a65b212ca2922a1fa6c'
const channelName = 'demoChannel'
const tokenServerURL = 'http://127.0.0.1:8090/rtc-token'
const socketURL = 'http://127.0.0.1:9080'

let rtc = {
    localAudioTrack: null,
    client: null
};

let options = {
    appId: appId,
    channel: channelName,
    uid: 12345,    // use the userId of official. // it will not match with any of the user's ID
    role: 'publisher',
    tokenType: 'uid'
};



const socket = io( socketURL, { upgrade: false, transports: ['websocket'] });

let socketId;
let data = {
    uid: 98765, // pass the userId of user whom the official want to call
    officialId: options.uid
}

socket.on('connect', () => {
    socketId = socket.id
    console.log(socketId)
    socket.emit('officialId', data)

    socket.on('userEndedCall', () => {
        handleUserEndedcall()
    })
})



const handleSocketConnection = async () => { 
    console.log(' official initiated call')
    
    socket.emit('callUser', data)

    // initiate the voice call
    handeVoiceCallStart()
}


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
}

const handleUserEndedcall = async () => {
    rtc.localAudioTrack.close();
    await rtc.client.leave();
    window.alert('User has ended the call !')
}

const handleVoiceCallEnd = async () => {
    rtc.localAudioTrack.close();
    await rtc.client.leave();
    window.alert('you (official) has disconnected the call !')
    // notify user that official has cut the call
    socket.emit('endCallByOfficial', data)
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
            <button onClick={()=>handleSocketConnection()} >
                Call
            </button>
            <button onClick={()=>handleVoiceCallEnd() } >
                End
            </button>
        
        </div>
    )
}

export default VoiceCall;