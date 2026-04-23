export function initNotifications() {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      console.log("Notification permission:", permission);
    });
  }
}

export function notify(msg) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(msg);
    } catch (e) {
      console.error("Notification error:", e);
    }
  }
}
