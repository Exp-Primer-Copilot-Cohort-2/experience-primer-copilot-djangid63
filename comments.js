// Create web server
var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');
var comments = [];
var mimeTypes = {
	'.js': 'text/javascript',
	'.html': 'text/html',
	'.css': 'text/css'
};
var server = http.createServer(function(req, res) {
	var uri = url.parse(req.url).pathname;
	var filename = path.join(process.cwd(), uri);
	fs.exists(filename, function(exists) {
		if(!exists) {
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.write('404 Not Found\n');
			res.end();
			return;
		}
		if(fs.statSync(filename).isDirectory()) {
			filename += '/index.html';
		}
		fs.readFile(filename, 'binary', function(err, file) {
			if(err) {
				res.writeHead(500, {'Content-Type': 'text/plain'});
				res.write(err + '\n');
				res.end();
				return;
			}
			var headers = {};
			var mimeType = mimeTypes[path.extname(filename)];
			if(mimeType) {
				headers['Content-Type'] = mimeType;
			}
			res.writeHead(200, headers);
			res.write(file, 'binary');
			res.end();
		});
	});
});
server.listen(8000);
// Create WebSocket server
var WebSocketServer = require('websocket').server;
var wsServer = new WebSocketServer({
	httpServer: server
});
wsServer.on('request', function(req) {
	var connection = req.accept(null, req.origin);
	connection.on('message', function(msg) {
		if(msg.type === 'utf8') {
			var comment = JSON.parse(msg.utf8Data);
			comment.timestamp = new Date();
			comments.push(comment);
			connection.sendUTF(JSON.stringify(comment));
		}
	});
	connection.on('close', function(reasonCode, description) {
		console.log('Client has disconnected.');
	});
});
console.log('Server running at http://localhost:8000/');