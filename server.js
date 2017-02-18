const express = require('express');
const app = express();
const request = require('request');
const auth = process.env.ZULTYSKBS_LOGIN; //put your authentication token in this env variable for basic login in a base64 encoded string
const token = process.env.SLACK_INBOUND_TOKEN || ' '; //put the Slack token being sent to this webapp for verification.
const jsdom = require('jsdom');

app.get('/', function (req, res) {
if (req.query.token === token || req.query.token !== '' ) { 
	var str = req.query.text;
	var slashcommand = splitString(str,0)
	var command = new RegExp(slashcommand)
	var query = splitString(str,1)
	//console.log("regex: " + command + " from: " + slashcommand + ".")
	switch (true) {
		case (slashcommand === 'patches'):
			request('http://kbs.zultys.com/patches.php', callbackPatches); 
			break;
		case (slashcommand === 'search' || slashcommand === 'find'):
			var options = {
				url: `http://kbs.zultys.com/issues.php?sstr=${query}&search=>&snm=Search+Results&sid=src`,
				headers: {
				'Authorization': "Basic " + auth
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
		case (slashcommand === 'help'):
			var obj = {
				"text": "Zultys KBS Slash Command Help",
				"attachments": [{
					"title": "/kbs patches <filter>",
					"text": "-Using `/KBS patches` will list the first page of the patches page on the KBS Site, using a filter will allow you to search for patch number from that first page. This will use RegEx to match so you can search for any part of the patch ID and it will find it if listed on the first page. (First 15 results)",
					"id": "1"},{
				"title": "/kbs search <search term>",
				"text": "-Using `/KBS search` with a search term will return back the results of a search as if you were signed into KBS and searching online. It will only return the first 15 results.",
				"id": "2"},{
				"title": "/kbs patch <patch_id> (still WIP)",
				"text": "-Using /KBS with patch and a Patch ID will display the information and download links for that specific patch.",
				"id": "3"},{
				"title": "/kbs article <article_id> (still WIP)",
				"text": "-Using `/KBS article` and supplying an article ID will display the article for that ID including any relevant links for you to click on.",
				"id": "4"},{
				"title": "/kbs software <software_id> (still WIP)",
				"text": "-Using `/KBS software` and a Software ID will display the information and download links for that specific software, including firmware or product software.",
				"id": "5"
				}]
				}
				res.send(obj)
			break;
		case (slashcommand === 'patch'):
			var id = splitString(str,1)
			var options = {
				url: `http://kbs.zultys.com/patches.php?pid=${id}`,
				headers: {
				'Authorization': "Basic " + auth
				}
			};
			request(options, callbackId);
			break;
		case (slashcommand === 'article'):
			var id = splitString(str,1)
			res.send("This command is a future enhancement that will be available shortly. Please check back later. \n\n " + id);
			break;
		case (slashcommand === 'software'):
			var id = splitString(str,1)
			res.send("This command is a future enhancement that will be available shortly. Please check back later. \n\n " + id);
			break;
		default:
			res.send("I'm sorry, I'm not programmed to respond to: " + slashcommand + " yet. Try using *'/kbs help'* to see what options are available")
			break;
	}


			function callbackId(error, response, body){
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
			function callbackSearch(error, response, body){
				if (!error && response.statusCode == 200) {
				var msg = ''
				var results = []
					jsdom.env(body,function(err, window){
						var table = window.document.getElementsByClassName('issues-text')
						var arr = [].slice.call(table);
						var cleanArr = arr.filter((item) => {return item.style.background !== ""});
						var links = []
						for (let i = 0, l = cleanArr.length; i<l; i++) {
							/*console.log("HTML Object by Class: issues-text:")
							console.log(cleanArr) */
							links.push(cleanArr[i].getElementsByTagName('a'))
							results.push({"author_name": cleanArr[i].getElementsByTagName('td')[0].innerHTML,
							"title": links[i][0].innerHTML,
							"id": i, 
							"title_link": "http://kbs.zultys.com/login.php?dir=" + links[i][0].href})
						}
						/* console.log(links)
						console.log(results) */
						if (results.length === 0) {
							results.push({"title": "0 Search results, please try a different search term."})
							}
						msg = {"text": "Search Results: " + query, "attachments": results}
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
	
			function splitString(str,index) {
				str = [str.split(' ', 1)[0], str.substr(str.split(' ', 1)[0].length+1)];
				return (index !== undefined) ? str[index] : str;
			}
	}
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
