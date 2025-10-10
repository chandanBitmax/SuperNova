// import { WebSocketServer } from "ws";

// let wss;
// let twilioConnection = null;
// let androidConnection = null;
// let streamSid = null;

// export function initTwilioSocket(server) {
//   wss = new WebSocketServer({ noServer: true });

//   wss.on("connection", (ws, req) => {
//     console.log("🎧 New WebSocket connection from:", req.headers['user-agent'] || 'Unknown');

//     let isTwilioStream = false;

//     ws.on("message", (msg) => {
//       try {
//         // Try parsing as JSON first
//         let data;
//         try {
//           data = JSON.parse(msg.toString());
//         } catch (e) {
//           // Not JSON - probably binary audio from Android
//           console.log("📥 Binary audio from Android:", msg.length, "bytes");
          
//           // Forward to Twilio as base64
//           if (twilioConnection && twilioConnection.readyState === 1 && streamSid) {
//             const base64Audio = msg.toString('base64');
//             const twilioMsg = JSON.stringify({
//               event: 'media',
//               streamSid: streamSid,
//               media: {
//                 payload: base64Audio
//               }
//             });
//             twilioConnection.send(twilioMsg);
//             console.log("📤 Forwarded to Twilio");
//           }
//           return;
//         }

//         // Handle Twilio events
//         if (data.event === "connected") {
//           console.log("✅ Twilio connected");
//           isTwilioStream = true;
//           twilioConnection = ws;
//         }
//         else if (data.event === "start") {
//           streamSid = data.start.streamSid;
//           console.log("🎙️ Stream started - StreamSid:", streamSid);
//           isTwilioStream = true;
//           twilioConnection = ws;
//         }
//         else if (data.event === "media") {
//           if (isTwilioStream && data.media && data.media.payload) {
//             // Audio FROM Twilio → Send to Android
//             const audioChunk = Buffer.from(data.media.payload, "base64");
//             console.log("🎙️ Audio from Twilio:", audioChunk.length, "bytes");

//             // Send to Android app (as binary)
//             wss.clients.forEach(client => {
//               if (client !== ws && client.readyState === 1) {
//                 client.send(audioChunk);
//                 androidConnection = client;
//               }
//             });
//           } else {
//             // Audio FROM Android → Send to Twilio
//             androidConnection = ws;
            
//             if (twilioConnection && twilioConnection.readyState === 1 && streamSid) {
//               const twilioMsg = JSON.stringify({
//                 event: 'media',
//                 streamSid: streamSid,
//                 media: {
//                   payload: data.media.payload
//                 }
//               });
//               twilioConnection.send(twilioMsg);
//               console.log("📤 Audio from Android forwarded to Twilio");
//             }
//           }
//         }
//         else if (data.event === "stop") {
//           console.log("🛑 Stream stopped");
//           streamSid = null;
//           twilioConnection = null;
//         }

//       } catch (error) {
//         console.error("❌ Error processing message:", error);
//       }
//     });

//     ws.on("error", (error) => {
//       console.error("❌ WebSocket error:", error);
//     });

//     ws.on("close", () => {
//       console.log("🔌 WebSocket closed");
//       if (ws === twilioConnection) {
//         twilioConnection = null;
//         streamSid = null;
//       }
//       if (ws === androidConnection) {
//         androidConnection = null;
//       }
//     });
//   });

//   // HTTP Upgrade for WebSocket
//   server.on("upgrade", (req, socket, head) => {
//     if (req.url === "/audio-stream") {
//       wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
//     } else {
//       socket.destroy();
//     }
//   });

//   console.log("🚀 WebSocket server ready at /audio-stream");
// }

// src/sockets/twilioSocket.js
import { WebSocketServer } from "ws";

let wss;
let twilioConnection = null;
let androidConnection = null;
let streamSid = null;

export function initTwilioSocket(server) {
  wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws, req) => {
    console.log("🎧 New WebSocket connection from:", req.headers['user-agent'] || 'Unknown');

    let isTwilioStream = false;

    ws.on("message", (msg) => {
      try {
        // Try parsing as JSON first
        let data;
        try {
          data = JSON.parse(msg.toString());
        } catch (e) {
          // Not JSON - probably binary audio from Android
          console.log("📥 Binary audio from Android:", msg.length, "bytes");
          
          // Forward to Twilio as base64
          if (twilioConnection && twilioConnection.readyState === 1 && streamSid) {
            const base64Audio = msg.toString('base64');
            const twilioMsg = JSON.stringify({
              event: 'media',
              streamSid: streamSid,
              media: {
                payload: base64Audio
              }
            });
            twilioConnection.send(twilioMsg);
            console.log("📤 Forwarded to Twilio");
          }
          return;
        }

        // Handle Twilio events
        if (data.event === "connected") {
          console.log("✅ Twilio connected");
          isTwilioStream = true;
          twilioConnection = ws;
        }
        else if (data.event === "start") {
          streamSid = data.start.streamSid;
          console.log("🎙️ Stream started - StreamSid:", streamSid);
          isTwilioStream = true;
          twilioConnection = ws;
        }
        else if (data.event === "media") {
          if (isTwilioStream && data.media && data.media.payload) {
            // Audio FROM Twilio → Send to Android
            const audioChunk = Buffer.from(data.media.payload, "base64");
            console.log("🎙️ Audio from Twilio:", audioChunk.length, "bytes");

            // Send to Android app (as binary)
            wss.clients.forEach(client => {
              if (client !== ws && client.readyState === 1) {
                client.send(audioChunk);
                androidConnection = client;
              }
            });
          } else {
            // Audio FROM Android → Send to Twilio
            androidConnection = ws;
            
            if (twilioConnection && twilioConnection.readyState === 1 && streamSid) {
              const twilioMsg = JSON.stringify({
                event: 'media',
                streamSid: streamSid,
                media: {
                  payload: data.media.payload
                }
              });
              twilioConnection.send(twilioMsg);
              console.log("📤 Audio from Android forwarded to Twilio");
            }
          }
        }
        else if (data.event === "stop") {
          console.log("🛑 Stream stopped");
          streamSid = null;
          twilioConnection = null;
        }

      } catch (error) {
        console.error("❌ Error processing message:", error);
      }
    });

    ws.on("error", (error) => {
      console.error("❌ WebSocket error:", error);
    });

    ws.on("close", () => {
      console.log("🔌 WebSocket closed");
      if (ws === twilioConnection) {
        twilioConnection = null;
        streamSid = null;
      }
      if (ws === androidConnection) {
        androidConnection = null;
      }
    });
  });

  // HTTP Upgrade for WebSocket
  server.on("upgrade", (req, socket, head) => {
    if (req.url === "/audio-stream") {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    } else {
      socket.destroy();
    }
  });

  console.log("🚀 WebSocket server ready at /audio-stream");
}