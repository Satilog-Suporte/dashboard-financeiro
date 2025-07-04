const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const port = 3000;

// --- Configurações do Servidor ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload());

// --- "Banco de Dados" Simples de Usuários ---
const users = {
    'admin': 'senha123'
};

// --- Rotas Públicas ---
app.use(express.static('public')); // Serve os arquivos da pasta 'public'

// Rota para a página de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Rota para processar o login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        // Se o login estiver correto, cria um "cookie" para lembrar que o usuário está logado
        res.cookie('auth', 'true', { maxAge: 900000, httpOnly: true });
        res.redirect('/upload');
    } else {
        res.send('Usuário ou senha inválidos!');
    }
});

// --- Rotas Protegidas ---

// Middleware para verificar se o usuário está logado
function checkAuth(req, res, next) {
    if (req.cookies.auth === 'true') {
        next(); // Se estiver logado, continua
    } else {
        res.redirect('/login'); // Se não, redireciona para a página de login
    }
}

// Rota para a página de upload (protegida)
app.get('/upload', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'upload.html'));
});

// Rota para fazer o upload do novo CSV (protegida)
app.post('/upload', checkAuth, (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('Nenhum arquivo foi enviado.');
    }

    const csvFile = req.files.csvFile;
    const uploadPath = path.join(__dirname, 'public/data', 'BRUDAM (2).csv');

    // Move o novo arquivo para a pasta 'data', substituindo o antigo
    csvFile.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send('Arquivo CSV atualizado com sucesso! <a href="/">Voltar para o Dashboard</a>');
    });
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});