const express = require('express');
const app = express();
const request = require('request');
const auth = process.env.ZULTYSKBS_LOGIN; //put your authentication token in this env variable for basic login in a base64 encoded string
const token = process.env.SLACK_INBOUND_TOKEN || ' '; //put the Slack token being sent to this webapp for verification.
const jsdom = require('jsdom');

app.get('/', function (req, res) {
//if (req.query.token === token || req.query.token !== '' ) { 
	var str = req.query.text;
	str = [str.split(' ', 1)[0], str.substr(str.split(' ', 1)[0].length+1)];
	var command = new RegExp(str[0])
	var query = str[1]
	switch (true) {
		case (command.test("patches")):
			request('http://kbs.zultys.com/patches.php', callbackPatches); 
			break;
		case (command.test("search")):
			var options = {
				url: `http://kbs.zultys.com/issues.php?sstr=${query}&search=>&snm=Search+Results&sid=src`,
				headers: {
			'		Authorization': "Basic " + auth
				}
			};
			request(options, callbackSearch);
			break;
		case (command.test("testing")):
			var obj = {
				 "text": "<http://www.kbs.zultys.com|MX 12.0.7>",
				 "attachments": [{ "title": "Fax Server Patch 1", "title_link": "http://kbs.zultys.com/login.php?dir=patches.php?pid=12072" }]
			}
			res.send(obj)
			break;
		default:
			res.send("I'm sorry, I'm not programmed to respond to: " + command + " yet.")
			break;
	}
			function callbackSearch(error, response, body){
				if (!error && response.statusCode == 200) {
				var msg = ''
				var results = []
					jsdom.env(body,function(err, window){
						var table = window.document.getElementsByClassName('issues-text')
						var arr = [].slice.call(table);
						var cleanArr = arr.filter((item) => {return item.style.background !== ""});
						console.log(cleanArr)
						var links = []
						for (let i = 0, l = cleanArr.length; i<l; i++) {
							links.push(results[i].getElementsByTagName('a'))
							results.push({"author_name": results[i].getElementsByTagName('td')[0].innerHTML,
							"title": links[i][0].innerHTML,
							"id": i, 
							"title_link": "http://kbs.zultys.com/login.php?dir=" + links[i][0].href})
						}
						if (query) {
							var search =  new RegExp('query');
							var searchResults = []
							for (let i = 0,l = results.length; i<l;i++){
								if (search.test(results[i].author_name)) {
									searchResults.push(results[i])
									}}
										if (searchResults.length < 1) {
											searchResults.push({"title": "No article match with that filter, please try again"})
										}
								msg = {"text": "Article " + query, "attachments": searchResults}
									} 
							else { msg = {"text": "Articles", "attachments": results} }
						res.send(msg)
					})
				}
				else {console.log(response.statusCode + " " + error);res.send(`<h1>${error} and ${response.statusCode}</h1>`)}
			}

			function callbackPatches(error, response, body){
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
							var searchResults = []
							for (let i = 0,l = attachments.length; i<l;i++){
								if (search.test(attachments[i].author_name)) {
									searchResults.push(attachments[i])
									}}
										if (searchResults.length < 1) {
											searchResults.push({"title": "No patch matches with that filter, please try again"})
										}
								msg = {"text": "Patches " + query, "attachments": searchResults}
									} 
							else { msg = {"text": "Patches", "attachments": attachments} }
						res.send(msg)
					})
				}
				else {console.log(response.statusCode + " " + error);res.send(`<h1>${error} and ${response.statusCode}</h1>`)}
			}
	//}
	})


app.get('/kbs/search', function (req, res) {
	var query = 'sip'
	var options = {
		url: `http://kbs.zultys.com/issues.php?sstr=${query}&search=>&snm=Search+Results&sid=src`,
		headers: {
			'Authorization': "Basic " + auth
		}
	};

			function callbackSearch(error, response, body){
				if (!error && response.statusCode == 200) {
				var msg = ''
				var results = []
					jsdom.env(body,function(err, window){
						var table = window.document.getElementsByClassName('issues-text')
						var arr = [].slice.call(table);
						var patches = arr.filter((item) => {return item.style.background !== ""});
						var links = []
						for (let i = 0, l = patches.length; i<l; i++) {
							links.push(patches[i].getElementsByTagName('a'))
							results.push({"author_name": patches[i].getElementsByTagName('td')[0].innerHTML,
							"title": links[i][0].innerHTML,
							"id": i, 
							"title_link": "http://kbs.zultys.com/login.php?dir=" + links[i][0].href})
						}
						if (query) {
							var search =  new RegExp('query');
							var searchResults = []
							for (let i = 0,l = results.length; i<l;i++){
								if (search.test(results[i].author_name)) {
									searchResults.push(results[i])
									}}
										if (searchResults.length < 1) {
											searchResults.push({"title": "No article match with that filter, please try again"})
										}
								msg = {"text": "Article " + query, "attachments": searchResults}
									} 
							else { msg = {"text": "Articles", "attachments": results} }
						res.send(msg)
					})
				}
				else {console.log(response.statusCode + " " + error);res.send(`<h1>${error} and ${response.statusCode}</h1>`)}
			}
	//}

	request(options, callbackSearch);

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
