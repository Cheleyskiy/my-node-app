exports.build = async () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ time: '2.3s', output: 'dist/my-app.js' }), 1000);
  });
};