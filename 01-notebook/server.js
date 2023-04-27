var http = require('http');
var querystring = require('querystring');
var escape_html = require('escape-html');
var serveStatic = require('serve-static');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('notes.sqlite');


// Serve up public folder 
var servePublic = serveStatic('public', {
  'index': false
});
 
function renderNotes(req, res) {
    db.all("SELECT rowid AS id, text FROM notes", function(err, rows) {
        if (err) {
            res.end('<h1>Error: ' + err + '</h1>');
            return;
        }
        res.write('<link rel="stylesheet" href="style.css">' +
                  '<h1>AAF Notebook</h1>' +
                  '<form method="POST" action="/add/">' +
                  '<label>Note: <input name="note" value=""></label>' +
                  '<button>Add</button><br>' +
                  '</form>');
        res.write('<ul class="notes">');
        rows.forEach(function (row) {
            res.write('<li>' + escape_html(row.text) + '<br>' + "<label class=\"notes_id\">" + row.id + '</label>');
            res.write('<form method="POST" action="/delete/' + row.id + '"><button class=\"notes_button\">Delete</button></form>')
            res.write('</li>')
        });
        res.end('</ul>');
    });
}

function deleteid(id) {
	let sql = 'DELETE FROM notes WHERE rowid=?';
    db.run(sql, [id], function (err, result) {
    if (err) {
    	console.error(err);
    	}
    });
} 

var server = http.createServer(function (req, res) {
    servePublic(req, res, function () {
        if (req.method == 'GET') {
            res.writeHead(200, {'Content-Type': 'text/html'});
            renderNotes(req, res);
        }
        else if (req.method == 'POST') {
            if (req.url.startsWith("/delete")) {
                let id = req.url.split("/")[2];
                deleteid(id);
                res.writeHead(302, {
                    location: "/",
                }).end();
            }
            var body = '';
            req.on('data', function (data) {
                body += data;
            });

            req.on('end', function () {
                if (req.url.startsWith("/add")) {
                    var form = querystring.parse(body);
                    let sql = 'INSERT INTO notes VALUES (?)';
                    db.run(sql, [form.note], function (err, result) {
                        if (err) {
                            console.error(err);
                        }
                    });
                    res.writeHead(201, {'Content-Type': 'text/html'});
                    renderNotes(req, res);

                    res.writeHead(302, {
                        location: "/",
                    }).end();
                }
            });
        }
    });
});

// initialize database and start the server
db.on('open', function () {
    db.run("CREATE TABLE notes (text TEXT)", function (err) {
        console.log('Server running at http://127.0.0.1:80/');
        server.listen(80);
    });
});
