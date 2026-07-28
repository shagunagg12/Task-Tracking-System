import * as signalR from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.listeners = [];
  }

  startConnection() {
    if (this.connection) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5024/chathub', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReceiveMessage', (message) => {
      console.log('SignalRService ReceiveMessage:', message);
      this.listeners.forEach(listener => listener(message));
    });

    this.connection.start()
      .then(() => {
        console.log('SignalRService Connected');
      })
      .catch(err => {
        console.error('SignalRService Connection Error: ', err);
        this.connection = null;
      });
  }

  onReceiveMessage(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  async joinChat(chatId) {
    if (this.connection && this.connection.state === 'Connected') {
      try {
        await this.connection.invoke('JoinChat', chatId.toString());
        console.log('SignalRService joined chat', chatId);
      } catch (err) {
        console.error('Error joining chat:', err);
      }
    }
  }

  async leaveChat(chatId) {
    if (this.connection && this.connection.state === 'Connected') {
      try {
        await this.connection.invoke('LeaveChat', chatId.toString());
      } catch (err) {}
    }
  }

  async sendMessage(chatId, text) {
    if (this.connection && this.connection.state === 'Connected') {
      await this.connection.invoke('SendMessage', chatId.toString(), text);
    }
  }

  disconnect() {
    if (this.connection) {
      this.connection.stop();
      this.connection = null;
    }
    this.listeners = [];
  }
}

const signalRService = new SignalRService();
export default signalRService;
