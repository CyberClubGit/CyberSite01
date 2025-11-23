// A simple generic event emitter
class EventEmitter<T extends Record<string, any>> {
  private listeners: { [K in keyof T]?: ((data: T[K]) => void)[] } = {};

  on<K extends keyof T>(event: K, listener: (data: T[K]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  off<K extends keyof T>(event: K, listener: (data: T[K]) => void) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]!.filter(l => l !== listener);
  }

  emit<K extends keyof T>(event: K, data: T[K]) {
    if (!this.listeners[event]) return;
    this.listeners[event]!.forEach(listener => listener(data));
  }
}

// Define the shape of our errors
interface ErrorEvents {
  'permission-error': any; 
}

// Create and export a singleton instance
export const errorEmitter = new EventEmitter<ErrorEvents>();
