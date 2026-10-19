/* ==========================================================================
   GabMad — Real-Time Multi-Screen Synchronization (Host & Judge Screen)
   Allows the non-guessing team to open a live private second screen via QR/link
   Uses WebSockets MQTT (with fallback to BroadcastChannel for same-device tabs)
   ========================================================================== */
"use strict";

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.GabSync = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {

  const BROKERS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt"
  ];

  function generateRoomId() {
    // 4 alphanumeric characters (easy to read and type if needed)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  class SyncManager {
    constructor() {
      this.roomId = null;
      this.role = null; // "host" | "judge"
      this.client = null;
      this.channel = null;
      this.connected = false;
      this.peerCount = 0;
      this.listeners = {
        state: [],
        command: [],
        connection: [],
        peers: []
      };
      this.lastSentState = null;
    }

    on(event, cb) {
      if (this.listeners[event]) this.listeners[event].push(cb);
    }

    emit(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(cb => {
          try { cb(data); } catch (e) { console.error("Sync callback error:", e); }
        });
      }
    }

    initHost(customRoomId) {
      this.role = "host";
      this.roomId = customRoomId || generateRoomId();
      this.connect();
      return this.roomId;
    }

    initJudge(roomId) {
      this.role = "judge";
      this.roomId = (roomId || "").trim().toUpperCase();
      this.connect();
      return this.roomId;
    }

    connect() {
      if (!this.roomId) return;

      // 1. Local BroadcastChannel (immediate intra-browser tab communication)
      try {
        if (typeof BroadcastChannel !== "undefined") {
          this.channel = new BroadcastChannel("gabmad_room_" + this.roomId);
          this.channel.onmessage = (e) => {
            this.handleIncoming(e.data, "broadcast");
          };
        }
      } catch (err) {
        console.warn("BroadcastChannel not supported:", err);
      }

      // 2. MQTT over WebSocket connection (cross-device on WiFi / cellular)
      if (typeof mqtt !== "undefined") {
        this.connectMqtt(0);
      } else {
        console.warn("MQTT library not loaded; relying on BroadcastChannel fallback.");
        this.emit("connection", { connected: true, broker: "local" });
      }
    }

    connectMqtt(brokerIndex) {
      const brokerUrl = BROKERS[brokerIndex % BROKERS.length];
      const clientId = "gab_" + this.role + "_" + Math.random().toString(16).slice(2, 8);

      try {
        const client = mqtt.connect(brokerUrl, {
          clientId: clientId,
          clean: true,
          connectTimeout: 7000,
          reconnectPeriod: 3000
        });

        this.client = client;

        client.on("connect", () => {
          this.connected = true;
          this.emit("connection", { connected: true, broker: brokerUrl });

          const topicState = `gabmad/room/${this.roomId}/state`;
          const topicCmd = `gabmad/room/${this.roomId}/cmd`;

          if (this.role === "host") {
            client.subscribe(topicCmd, { qos: 1 });
            // Announce host presence and broadcast last known state if available
            this.publishMqtt(topicCmd, { type: "HOST_HELLO" });
            if (this.lastSentState) {
              this.broadcastState(this.lastSentState);
            }
          } else {
            client.subscribe(topicState, { qos: 1 });
            // Ask host for immediate state sync
            this.sendCommand("REQUEST_SYNC");
          }
        });

        client.on("message", (topic, payload) => {
          try {
            const data = JSON.parse(payload.toString());
            this.handleIncoming(data, "mqtt");
          } catch (e) {
            console.error("Malformed MQTT payload", e);
          }
        });

        client.on("error", (err) => {
          console.warn("MQTT connection error:", err);
        });

        client.on("offline", () => {
          this.connected = false;
          this.emit("connection", { connected: false });
        });
      } catch (e) {
        console.error("Failed to connect MQTT:", e);
      }
    }

    publishMqtt(topic, payload) {
      if (this.client && this.client.connected) {
        try {
          this.client.publish(topic, JSON.stringify(payload), { qos: 1 });
        } catch (e) {
          console.warn("MQTT publish error:", e);
        }
      }
    }

    publishBroadcast(payload) {
      if (this.channel) {
        try {
          this.channel.postMessage(payload);
        } catch (e) {
          console.warn("BroadcastChannel post error:", e);
        }
      }
    }

    // Host sends live state to judge screen
    broadcastState(state) {
      if (this.role !== "host") return;
      this.lastSentState = state;
      const msg = {
        type: "SYNC_STATE",
        roomId: this.roomId,
        timestamp: Date.now(),
        state: state
      };
      this.publishBroadcast(msg);
      this.publishMqtt(`gabmad/room/${this.roomId}/state`, msg);
    }

    // Judge sends action command to host
    sendCommand(command, payload = {}) {
      const msg = {
        type: "CMD",
        roomId: this.roomId,
        command: command,
        payload: payload,
        timestamp: Date.now()
      };
      this.publishBroadcast(msg);
      this.publishMqtt(`gabmad/room/${this.roomId}/cmd`, msg);
    }

    handleIncoming(msg, source) {
      if (!msg || typeof msg !== "object") return;
      if (msg.roomId && msg.roomId !== this.roomId) return;

      if (this.role === "judge") {
        if (msg.type === "SYNC_STATE" && msg.state) {
          this.emit("state", msg.state);
        }
      } else if (this.role === "host") {
        if (msg.type === "CMD") {
          if (msg.command === "REQUEST_SYNC") {
            this.peerCount++;
            this.emit("peers", { count: this.peerCount });
            if (this.lastSentState) {
              this.broadcastState(this.lastSentState);
            }
          } else {
            this.emit("command", { command: msg.command, payload: msg.payload });
          }
        }
      }
    }

    getJudgeUrl() {
      if (typeof window === "undefined" || !this.roomId) return "";
      const url = new URL(window.location.href);
      url.searchParams.set("room", this.roomId);
      url.searchParams.set("role", "judge");
      return url.toString();
    }
  }

  return new SyncManager();
});
