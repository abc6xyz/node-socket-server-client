const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8000 });
const A_MAC = '00:00:00:00:00:00'

let clients = {}

wss.on('connection', (ws, req) => {
  const data = req.url.split('/');
  let mac;
  if (data[1] === 'a' && data[2] === '2001623'){
    mac = A_MAC
    clients[mac] = ws;
  }
  else if (data[1] === 'b'){
    if(clients.hasOwnProperty(data[2])){
      ws.send('double connection');
      return
    }
    mac = data[2];
    clients[mac] = ws;
  }
  else{
    ws.close();
  }
  
  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());
    if(data['to'] === "server"){
      if(data['command'] === 'clients'){
        let macs = []
        for (const key in clients) {
          macs.push(key)
        }
        ws.send(JSON.stringify(macs))
      } else {
        ws.send("unknown command")
      }
    } else if(data['from'] === A_MAC) {
      if(data['to'] === A_MAC){
        for (const key in clients) {
          if (key === A_MAC) continue
          clients[key].send(message)
        }
      } else {
        try {
          clients[data['to']].send(message)
        } catch (error) {
          ws.send('send error')          
        }
      }
    } else {
      try {
        clients[A_MAC].send(message)
      } catch (error) {
        ws.send('send error')
      }
    }
  });

  ws.on('close', () => {
    delete(clients[mac])
    console.log(`Client disconnected ${mac}`);
  });
});