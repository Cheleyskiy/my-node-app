// Челей Максим 401

const { EventEmitter } = require('events');

class UserTracker extends EventEmitter {

  trackAction(userId, action, metadata = {}) {
    const event = {
      userId: userId,
      action: action,
      timestamp: new Date().toISOString(),
      metadata: metadata,
      id: Math.random().toString(36).substr(2, 9),
    };

    this.emit('user:action', event);
  }
}

const tracker = new UserTracker();

tracker.on('user:action', ({ userId, action, timestamp, metadata, id }) => {
  console.log(`Пользователь ${userId} совершил действие "${action}"`);
  console.log(`Время: ${timestamp}`);
  console.log(`ID события: ${id}`);
  console.log(`Доп. данные: ${JSON.stringify(metadata)}`);
});

tracker.trackAction(1, 'login', { ip: '192.168.0.10', browser: 'Chrome' });
tracker.trackAction(42, 'purchase', { item: 'Книга', price: 750 });
tracker.trackAction(7, 'logout', { reason: 'timeout' });

module.exports = UserTracker;