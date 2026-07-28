class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.isIntentionalDisconnect = false;
  }

  startConnection() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    this.isIntentionalDisconnect = false;

    // Use ws:// for http, wss:// for https
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // The backend is running on port 5024
    const url = `${protocol}//localhost:5024/ws/chat?access_token=${encodeURIComponent(token)}`;

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocketService Connected');
      this.reconnectAttempts = 0; // Reset attempts on success
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocketService ReceiveMessage:', message);
        this.listeners.forEach(listener => listener(message));
      } catch (err) {
        console.error('Error parsing WebSocket message', err);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocketService Disconnected');
      this.socket = null;
      if (!this.isIntentionalDisconnect) {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocketService Error: ', error);
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`WebSocketService reconnecting in ${timeout}ms...`);
      setTimeout(() => {
        this.startConnection();
      }, timeout);
    }
  }

  onReceiveMessage(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  joinChat(chatId) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'JoinChat', chatId: chatId.toString() }));
      console.log('WebSocketService joined chat', chatId);
    }
  }

  leaveChat(chatId) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'LeaveChat', chatId: chatId.toString() }));
    }
  }

  sendMessage(chatId, text) {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'SendMessage', chatId: chatId.toString(), text: text }));
        resolve();
      } else {
        reject(new Error('WebSocket is not connected'));
      }
    });
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners = [];
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
