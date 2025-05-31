---
title: "Live Server for Node Js"
description: "A simple live-reloading static file server built in Node Js."
---

# 🚀 Live Server for Node Js

A lightweight, fast, and feature-rich live server built with *Node.js* and *Express.js*. It serves static files, watches for changes, and reloads the browser automatically.

## ✨ Features
- 📂 *Serve static files* from any directory
- 🔄 *Live reload* when files change
- ⚡ *Customizable port* (--port=3000 or -p 3000)
- 🔍 *Directory listing* (if index.html is missing, provided by Express.js static middleware)
- 🌐 *Auto-open browser* (--open or --no-open)
- 🛑 *Ignore specific directories/patterns* (--ignore=node_modules,*.log)
- 🎯 *Filter file types* to watch (--watch=.html,.css,.js)
- 🔀 *Watches the specified directory recursively* for changes
- 🔒 *SSL support* (to be added later)

## 📦 Installation
### *1. Clone the repository (or create your project)*
If you have this as a project:

git clone [https://github.com/your-username/node-live-server](https://github.com/sahilsethi003/Live-File-Server).git
cd node-live-server

If you are integrating server.js into an existing project, ensure index.js and package.json are in your project root.

### *2. Install Dependencies*
You'll need Node.js and npm installed.

### *Available Flags*

| Flag                 | Alias | Default             | Description                                     |
|----------------------|-------|---------------------|-------------------------------------------------|
| --port <port>      | -p  | 8080              | Set the port for the server                     |
| --ignore <patterns>|       | node_modules      | Comma-separated list of patterns to ignore (supports glob) |
| --watch <exts>     | -w  | .html,.css,.js    | Comma-separated file extensions to watch       |
| --open / --no-open| -o | true (enables)    | Automatically open browser (--no-open to disable) |
| <directory>        |       | Required          | The directory to serve                          |

### *Example*
Serve the dist folder on port 3000, ignoring logs and temp directories, and only watch .html and .css files:
