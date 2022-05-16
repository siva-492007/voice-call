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
    uid: 98765, // user's ID. It should not match with any of the official's ID
    role: 'audience',
    tokenType: 'uid'
};

const socket = io( socketURL, { upgrade: false, transports: ['websocket'] });

let socketId

let data = {
    uid: options.uid
}

let officialId

socket.on('connect', () => {
   
    socketId = socket.id
    console.log('user connected! ', socketId)

    socket.emit('uid', data)

    socket.on('officialOnCall', (data) => {
        officialId = data.officialId

        console.log('official on call: ', officialId)

        window.alert('official on call')
        // open the pop up with a button with ATTEND and END button
        // When ATTEND button is clicked, initialise voice call.
        handeVoiceCallStart()

        // when END button is clicked, end voice call.
    })

    socket.on('officialEndedCall', () => {
        // official ended call
        handleOfficialEndCall()
    })
})



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

const handleOfficialEndCall = async () => {
    rtc.localAudioTrack.close();
    await rtc.client.leave();
    window.alert('official ended call !')
}

const handleVoiceCallEnd = async () => {
    rtc.localAudioTrack.close();
    await rtc.client.leave();
    window.alert('you (user) disconected the call !')

    // to notify the offical that user has cut the call
    let newData = {
        officialId: officialId
    }
    socket.emit('endCallByUser', newData)
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
            {/* <button >
                Call
            </button> */}
            <button onClick={()=>handleVoiceCallEnd() } >
                End
            </button>
        
        </div>
    )
}

export default VoiceCall;