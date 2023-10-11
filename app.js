const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 8000 })
const A_MAC = 'uspy'

let clients = {}

wss.on('connection', (ws, req) => {
  let data = req.url.split('/')
  let mac
  if (data[1] === 'a' && data[2] === '2001623'){
    mac = A_MAC
    clients[mac] = ws
  }
  else if (data[1] === 'b'){
    if(clients.hasOwnProperty(data[2])){
      return
    }
    mac = data[2]
    clients[mac] = ws
  }
  else{
    ws.close()
  }
  
  ws.on('message', (message) => {
    let regex = /from(.*)(?=to)to(.*)(?=type)type(.*)(?=data)data(.*)/;
    try {
      let matches = message.toString().match(regex);
      if (matches) {
        let [ origin, from, to, type, data ] = matches
        if ( from === A_MAC & to === 'server' ) {
          let dataToSend = 'fromservertouspytype'
          if(type === 'command'){
            if (data === 'clients') {
              dataToSend += data+'data'
              for (const key in clients) { dataToSend += key+',' }
            } else {
              dataToSend += 'messagedataunknown'
            }
          } else {
            dataToSend += 'messagedataunknown'
          }
          ws.send(dataToSend)
        } else if ( to === A_MAC ) {
          clients[to].send(message.toString())
        } else {
          clients[to].send(data)
        }
      } else {
        console.log("invalid packet")
      }
    } catch (error) {
      console.log(error)
    }
  })

  ws.on('close', () => {
    delete(clients[mac])
    console.log(`Client disconnected ${mac}`)
  })
})