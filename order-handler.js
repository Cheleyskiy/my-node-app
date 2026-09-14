// Челей Максим 401

const { EventEmitter } = require('events');

function computePi() {
  let sum = 0;
  let sign = 1;
  const ITERATIONS = 5000000;

  for (let i = 0; i < ITERATIONS; i++) {
    sum += sign / (2 * i + 1);
    sign = -sign;
  }

  return Number((4 * sum).toFixed(7));
}

class OrderHandler extends EventEmitter {
  constructor() {
    super();

    this.on('order:start', (orderId) => {
      console.log(`[order:start] Заказ #${orderId} начат`);
    });

    this.on('order:processing', ({ orderId, message }) => {
      console.log(`[order:processing] Заказ #${orderId}: ${message}`);
    });

    this.on('order:complete', ({ orderId, sum }) => {
      const pi = computePi();
      console.log(
        `[order:complete] Заказ #${orderId} завершён на сумму ${sum} руб. PI = ${pi}`
      );
    });
  }

  processOrder(orderId) {
    this.emit('order:start', orderId);

    setTimeout(() => {
      this.emit('order:processing', { orderId, message: 'Идёт обработка...' });
    }, 2000);

    setTimeout(() => {
      const sum = Math.floor(100 + Math.random() * 901);
      this.emit('order:complete', { orderId, sum });
    }, 4000);
  }
}

module.exports = OrderHandler;