const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const open = require('open');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// --- Argument Parsing ---
const argv = yargs(hideBin(process.argv))
    .usage('Usage: node server.js [options] <directory>')
    .option('port', {
        alias: 'p',
        type: 'string',
        default: '8080',
        description: 'Port to serve files on'
    })
    .option('ignore', {
        type: 'string',
        default: 'node_modules',
        description: 'Comma-separated list of patterns/directories to ignore (supports glob patterns)'
    })
    .option('watch', {
        alias: 'w',
        type: 'string',
        default: '.html,.css,.js',
        description: 'Comma-separated list of file extensions to watch (e.g., .html,.css,.js)'
    })
    .option('open', {
        alias: 'o',
        type: 'boolean',
        default: true,
        description: 'Automatically open browser'
    })
    .demandCommand(1, 'You must provide a directory to serve.')
    .help()
    .alias('help', 'h')
    .argv;

const directory = argv._[0];
const port = argv.port;
const watchExtsRaw = argv.watch;
const autoOpen = argv.open;
const ignorePatterns = argv.ignore.split(',').map(s => s.trim()).filter(s => s);


// --- Directory Validation ---
if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    console.error(`Error: Directory does not exist or is not a directory: ${directory}`);
    process.exit(1);
}
const absoluteDirectory = path.resolve(directory);

// --- Watched Extensions Set ---
const watchExtensions = new Set(watchExtsRaw.split(',').map(ext => ext.trim().toLowerCase()));

// --- WebSocket Server Setup ---
const app = express();
const server = http.createServer(app); // Express app handles HTTP requests
const wss = new WebSocketServer({ server, path: '/ws' }); // Attach WebSocket server to HTTP server on /ws path

const clients = new Set(); // Store connected WebSocket clients

wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    clients.add(ws);

    ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws); // Remove on error as well
    });
});

// --- File Watcher Setup (Chokidar) ---
// Chokidar watches recursively by default, which is usually desired.
// The Go version with fsnotify.Add(directory) is less recursive by default for file events within subdirs.
const watcher = chokidar.watch(absoluteDirectory, {
    ignored: [
        /(^|[\/\\])\../, // ignore dotfiles
        ...ignorePatterns.map(pattern => path.join(absoluteDirectory, pattern)), // full path for ignored dirs
        ...ignorePatterns.map(pattern => `**/${pattern}/**`), // glob for subdirectories
    ],
    persistent: true,
    ignoreInitial: true, // Don't fire 'add' events on startup
});

console.log(`Watching directory: ${absoluteDirectory}`);
console.log(`Ignoring patterns: ${ignorePatterns.join(', ')}`);
console.log(`Watching extensions: ${Array.from(watchExtensions).join(', ')}`);


watcher
    .on('add', filePath => handleChange(filePath, 'added'))
    .on('change', filePath => handleChange(filePath, 'changed'))
    .on('unlink', filePath => handleChange(filePath, 'removed')); // You might want to reload on unlink too

function handleChange(filePath, eventType) {
    const ext = path.extname(filePath).toLowerCase();
    if (watchExtensions.has(ext)) {
        console.log(`File ${eventType}: ${filePath}`);
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send('reload');
            }
        });
    }
}

watcher.on('error', error => console.error(`Watcher error: ${error}`));

// --- HTTP Server for Static Files ---
app.use(express.static(absoluteDirectory)); // Serve files from the specified directory

// --- Start Server ---
server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`Serving files from: ${absoluteDirectory}`);
    console.log(`Server running at ${url}`);
    console.log(`WebSocket endpoint at ws://localhost:${port}/ws`);

    if (autoOpen) {
        console.log('Opening browser...');
        open(url).catch(err => console.error("Failed to open browser:", err));
    }
});

process.on('SIGINT', () => {
    console.log('Shutting down server...');
    watcher.close();
    wss.close();
    server.close(() => {
        process.exit(0);
    });
});
