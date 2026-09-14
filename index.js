const http = require('http'); 

function calculatePi(iterations) 
{
    let pi = 0;
    let sign = 1;
    for (let i =0; i < iterations; i++)
    {
        pi += sign / (2 * i + 1);
        sign *= -1;
    }
    return pi * 4;
}

function roundToDecimals(value, decimals) {
    return value.toFixed(decimals);
}

const studentInfo =
{
    fullName: 'Челей Максим Александрович',
    group: '401',
    pi: roundToDecimals(calculatePi(100000000), 18)
}

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
        <h1>Информация о студенте</h1>
        <p><strong>ФИО:</strong> ${studentInfo.fullName}</p>
        <p><strong>Группа:</strong> ${studentInfo.group}</p>
        <p><strong>Число Пи:</strong> ${studentInfo.pi}</p>
    `);
});

const PORT = 3000; 
server.listen(PORT, () => { 
console.log(`Сервер запущен на http://localhost:${PORT}`); 
});