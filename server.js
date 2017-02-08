const express = require('express');
const app = express();
const request = require('request');
const auth = process.env.ZULTYSKBS_LOGIN; //put your authentication token in this env variable for basic login in a base64 encoded string
const token = process.env.SLACK_INBOUND_TOKEN || ' '; //put the Slack token being sent to this webapp for verification.
const jsdom = require('jsdom');

app.get('/', function (req, res) {
if (req.query.token === token) { 
	var str = req.query.text;
	str = [str.split(' ', 1)[0], str.substr(str.split(' ', 1)[0].length+1)];
	var command = str[0]
	var query = str[1]
	switch (command) {
		case "patches":
			request('http://kbs.zultys.com/patches.php', function(error, response, body){
				if (!error && response.statusCode == 200) {
				var msg = ''
				var attachments = []
					jsdom.env(body,function(err, window){
						var table = window.document.getElementsByClassName('issues-text')
						var arr = [].slice.call(table);
						var patches = arr.filter((item) => {return item.style.background !== ""});
						var links = []
						for (let i = 0, l = patches.length; i<l; i++) {
							links.push(patches[i].getElementsByTagName('a'))
							attachments.push({"author_name": patches[i].getElementsByTagName('td')[0].innerHTML,
							"title": links[i][0].innerHTML,
							"id": i, 
							"title_link": "http://kbs.zultys.com/login.php?dir=" + links[i][0].href})
						}
						if (query) {
							var search =  new RegExp(query);
							for (let i = 0,l = attachments.length; i<l;i++){
								if (search.test(attachments[i].author_name)) {
									msg = {"text": "Patches " + query, "attachments": [attachments[i]]}
									}}} 
							else { msg = {"text": "Patches", "attachments": attachments} }
						res.send(msg)
					})
				;}
				else {console.log(response.statusCode + " " + error);res.send(`<h1>${error} and ${response.statusCode}</h1>`)}
			})
			break;
		case "testing":
			var obj = {
				 "text": "<http://www.kbs.zultys.com|MX 12.0.7>",
				 "attachments": [{ "title": "Fax Server Patch 1", "title_link": "http://kbs.zultys.com/patches.php?pid=12072" }]
			}
			res.send(obj)
			break;

		default:
			res.send("I'm sorry, I'm not programmed to respond to: " + command + " yet.")
			break;
	}
	
	
	}})


app.get('/kbs/search', function (req, res) {
	var options = {
		url: 'http://kbs.zultys.com/issues.php',
		headers: {
			'Authorization': "Basic " + auth
		}
	};

	function callback(error, response, body) {
		if (!error && response.statusCode == 200) {
			res.send(body)
			console.log("Ok " + body)
		}
		else {console.log(response);res.send(`<h1>${error} and ${response.statusCode}</h1>`)}
	}

	request(options, callback);

})

app.get('/kbs/patches', function (req, res) {
	request('http://kbs.zultys.com/patches.php', function(error, response, body){
			if (!error && response.statusCode == 200) {
			res.send(body)
			console.log("Ok " + body)
		}
		else {console.log(response);res.send(`<h1>${error} and ${response.statusCode}</h1>`)}
	})
})

app.listen(3000, function() {console.log('Listening on port 3000')})
