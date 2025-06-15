   
    const WebSocket = require('ws');
    const http = require('http');
    const fs = require('fs');
    const path = require('path');

    const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    let extname = path.extname(filePath);
    let contentType = 'text/html';

    // Determine the correct content type
    switch (extname) {
        case '.css':
            contentType = 'text/css';
            break;
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
        case '.jpeg':
            contentType = 'image/jpeg';
            break;
        case '.svg':
            contentType = 'image/svg+xml';
            break;
        case '.ico':
            contentType = 'image/x-icon';
            break;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

    const wss = new WebSocket.Server({ server });
    const clients = new Map();

    wss.on('connection', (ws) => {
        console.log('Neuer Client verbunden');
        
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                
                if (data.type === 'cursor_update') {
                    clients.set(ws, { 
                        id: data.userId, 
                        x: data.x, 
                        y: data.y, 
                        name: data.name 
                    });
                    
                    // Sende Update an alle anderen Clients
                    wss.clients.forEach((client) => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'cursor_update',
                                userId: data.userId,
                                x: data.x,
                                y: data.y,
                                name: data.name
                            }));
                        }
                    });
                } else if (data.type === 'user_disconnect') {
                    // Teile anderen mit, dass User disconnected ist
                    wss.clients.forEach((client) => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'user_disconnect',
                                userId: data.userId
                            }));
                        }
                    });
                } else if (data.type === 'token_update') {
                    // Teile anderen mit, dass User disconnected ist
                    wss.clients.forEach((client) => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'token_update',
                                userId: data.userId,
								id: data.id,
								x: data.x,
								y: data.y,
								rot: data.rot,
								scale: data.scale,
								tokenText: data.text,
		                        color: data.color,
                                size: data.size,
                                length: data.length,
                                centerX: data.centerX,
                                centerY: data.centerY,
                                image: data.image
                            }));
                        }
                    });
                } else if (data.type === 'token_del') {
                    // Teile anderen mit, dass User disconnected ist
                    wss.clients.forEach((client) => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'token_del',
                                userId: data.userId,
								id: data.id
                            }));
                        }
                    });
                }
            } catch (error) {
                console.error('Fehler beim Parsen der Nachricht:', error);
            }
        });

        ws.on('close', () => {
            const clientData = clients.get(ws);
            if (clientData) {
                // Teile anderen mit, dass User disconnected ist
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'user_disconnect',
                            userId: clientData.id
                        }));
                    }
                });
            }
            clients.delete(ws);
            console.log('Client getrennt');
        });

        ws.on('error', (error) => {
            console.error('WebSocket Fehler:', error);
        });
    });

    const port = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server läuft auf http://0.0.0.0:${PORT}`);
        console.log('Für lokales Netzwerk: http://[DEINE-IP]:3000');
    });