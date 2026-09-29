class SocketMock {
  private ws: WebSocket | null = null;
  private listeners: { [event: string]: Function[] } = {};

  connect() {
    if (this.ws) return;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const url = baseUrl.replace(/^http/, 'ws') + '/socket';
    console.log('Connecting to WebSocket at:', url);
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      console.log('Connected to Spring WebSocket Server');
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { event: eventName, data } = payload;
        if (this.listeners[eventName]) {
          this.listeners[eventName].forEach(cb => cb(data));
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
    
    this.ws.onclose = () => {
      console.log('Disconnected from Spring WebSocket Server');
      this.ws = null;
    };
  }
  
  emit(event: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event: string) {
    delete this.listeners[event];
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const socket = new SocketMock();
export default socket;
