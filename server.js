const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// --- Rotas Públicas ---
// Serve todos os arquivos estáticos (HTML, CSS, JS, imagens, e o CSV) da pasta 'public'
app.use(express.static('public'));

// Rota principal que serve o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

// Exporta o app para a Vercel
module.exports = app;
