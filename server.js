const http = require('http');
const Koa = require('koa');
const cors = require('koa2-cors');
const WS = require('ws');

const app = new Koa();

// CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
    'Access-Control-Allow-Origin': true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);


const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());

const clients = [];
const wsServer = new WS.Server({ server });
wsServer.on('connection', (socket, req) => {
  socket.on('message', msg => {
    const data = JSON.parse(msg);
    if (data.event === 'login') {
      const findNickname = clients.findIndex((socket) => socket.nick.toLowerCase() === data.message.toLowerCase());
      if (findNickname === -1 && data.message != '') {

        socket.nick = data.message;
        const clientsNicknameList = clients.map((socket) => socket.nick);
        socket.send(JSON.stringify({ event: 'connect', message: clientsNicknameList }))
        clients.push(socket);

        for(let client of clients) {
          const chatMessage = JSON.stringify({ event: 'system', message: { action: 'login', nickname: socket.nick } });
          client.send(chatMessage);
        }

      } else {
        socket.close(1000, 'Такой логин уже есть в чате');
      }
    }

    if (data.event === 'chat') {
      for(let client of clients) {
        const chatMessage = JSON.stringify({ event: 'chat', message: { nickname: socket.nick, date: Date.now(), text: data.message } });
        client.send(chatMessage);
      }
    }
  });

  socket.on('close', () => {
    const findNickname = clients.findIndex((client) => client.nick === socket.nick);
    if (findNickname !== -1) {
      clients.splice(findNickname, 1);

      for(let client of clients) {
        const chatMessage = JSON.stringify({ event: 'system', message: { action: 'logout', nickname: socket.nick } });
            client.send(chatMessage);
      }
    }
  });
});


server.listen(port, () => console.log('Server started'));