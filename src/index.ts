import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import Connection from "./connection.js";
import GameService from "./features/game/services/gameService.js";
import GameStore from "./features/game/stores/gameStore.js";
import GameController from "./features/game/controllers/gameController.js";

const PORT = Number(process.env.PORT) || 8080;

type EventMap = {
    ping: { hello?: string };
    echo: unknown;
    broadcast: { msg: string };
    "game/start": { durationMs?: number } | undefined;
    "game/end": unknown;
    "game/whack": { id: number };
};

type InboundMessage =
    { [K in keyof EventMap]: { event: K; payload: EventMap[K] } }[keyof EventMap];

const server = createServer((req, res) => {
    if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
        return;
    }
    res.writeHead(404);
    res.end();
});

const wss = new WebSocketServer({ noServer: true });

function heartbeat(this: WebSocket) {
    this.isAlive = true;
}

wss.on("connection", (ws: WebSocket) => {
    console.log("Client connected");
    ws.isAlive = true;
    ws.on("pong", heartbeat);

    const connection = new Connection(ws, wss);
    const gameStore = new GameStore();
    const gameService = new GameService(gameStore);
    const gameController = new GameController(gameService, connection);

    connection.sendEvent("welcome", { msg: "Connected", time: Date.now() });

    ws.on("message", (raw: string) => {
        let msg: InboundMessage | null = null;
        try {
            msg = JSON.parse(raw.toString()) as InboundMessage;
        } catch {
            connection.sendEvent("error", { message: "Invalid JSON" });
            return;
        }

        if (!msg || typeof msg !== "object" || !("event" in msg)) {
            connection.sendEvent("error", { message: "Invalid message shape" });
            return;
        }

        try {
            switch (msg.event) {
                case "ping":
                    connection.sendEvent("pong", { time: Date.now(), payload: msg.payload });
                    break;
                case "echo":
                    connection.sendEvent("echo", msg.payload);
                    break;
                case "game/start": {
                    gameController.gameStart();
                    break;
                }
                case "game/end": {
                    gameController.gameEnd();
                    break;
                }
                case "game/whack": {
                    gameController.whackMole(msg.payload.id);
                    break;
                }
                case "broadcast": {
                    const text = typeof msg.payload?.msg === "string" ? msg.payload.msg : String(msg.payload);
                    connection.broadcast("message", { msg: text }, ws);
                    connection.sendEvent("broadcast_ack", { delivered: true });
                    break;
                }
                default: {
                    const unknownEvent = String((msg as any)?.event);
                    connection.sendEvent("error", { message: `Unknown event: ${unknownEvent}` });
                }
            }
        } catch (e) {
            connection.sendEvent("error", { message: "Handler failed", detail: String(e) });
        }
    });
});

server.on("upgrade", (req, socket, head) => {
    console.log("Upgrade");
    if (req.url !== "/ws") {
        socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
        socket.destroy();
        return;
    }
    wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
        wss.emit("connection", ws, req);
    });
});

const interval = setInterval(() => {
    for (const ws of wss.clients) {
        if (ws.isAlive === false) {
            ws.terminate();
            continue;
        }
        ws.isAlive = false;
        ws.ping();
    }
}, 30_000);

wss.on("close", () => clearInterval(interval));

server.listen(PORT, () => {
    console.log(`HTTP on :${PORT}, WS path /ws`);
});
