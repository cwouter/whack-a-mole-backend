import { WebSocketServer, WebSocket } from "ws";

export default class Connection {
    constructor(
        protected ws: WebSocket,
        protected wss: WebSocketServer
    ) {
    }

    public sendEvent<E, P>(event: E, payload: P) {
        const msg = { event, payload };
        this.ws.send(JSON.stringify(msg));
    }

    public broadcast<E, P>(event: E, payload: P, exclude?: WebSocket) {
        for (const client of this.wss.clients) {
            if (client.readyState === WebSocket.OPEN && client !== exclude) {
                const msg = { event, payload };
                client.send(JSON.stringify(msg));
            }
        }
    }

}
