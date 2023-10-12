const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 8000 })
const A_MAC = 'uspy'

let clients = {}

function heartbeat() {
  this.isAlive = true
}

wss.on('connection', (ws, req) => {
  const params = req.url.split('/')
  let mac
  if (params[1] === 'a' && params[2] === '2001623'){
    mac = A_MAC
    clients[mac] = ws
  }
  else if (params[1] === 'b'){
    mac = params[2]
    clients[mac] = ws
  }
  else{
    ws.close()
  }
  console.log(`Client [${mac}] connected`)
  
  ws.isAlive = true
  ws.on('pong', heartbeat)
  const heartbeatInterval = setInterval(() => {
    if (ws.isAlive === false) {
      console.log(`Client [${mac}] disconnected (heartbeat timeout)`)
      return ws.terminate()
    }
    ws.isAlive = false
    ws.ping()
  }, 3000)

  ws.on('message', (message) => {
    const regex = /^from(.*)to(.*)type(.*)data((?:.|[\r\n])*?)$/;
    try {
      const matches = message.toString().match(regex);
      if (matches) {
        const [ origin, from, to, type, data ] = matches
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
    console.log(`Client [${mac}] disconnected (onclose)`)
    clearInterval(heartbeatInterval)
    delete(clients[mac])
  })
})