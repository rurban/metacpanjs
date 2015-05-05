var metacpan = {}
metacpan.size = function() {
	var page_size = parseInt(localStorage.getItem('page_size'));
	if (page_size == null || page_size == 'null') {
		page_size = 10;
	}
	return page_size;
};
metacpan.page = 1;
metacpan.total = 0;

metacpan.recent = function(count, callback) {
	metacpan.post('http://api.metacpan.org/v0/release/_search', {
		"query": {
			"match_all": {}
		},
		"fields" : [ "distribution", "name", "status", "date", "abstract" ],
		"sort" : [
			{ "date": {"order" : "desc"} }
		],
		"size" :  count
	}, count, callback, show_error);
};

metacpan.release = function(query, callback) {
	metacpan.get("http://api.metacpan.org/v0/release/" + query, query, callback, show_error);
};

metacpan.module = function(query, callback) {
	metacpan.get("http://api.metacpan.org/v0/module/" + query, query, callback, show_error);
};



metacpan.author = function(query, callback) {
	metacpan.get("http://api.metacpan.org/v0/author/" + query, query, callback, show_error);
};

metacpan.no_license = function(query, callback) {
	//var page_size = metacpan.size();
	//var page = metacpan.page;
	//var from = ( page - 1 ) * page_size;
	metacpan.post("http://api.metacpan.org/v0/release/_search", {
		"query": {
			"match_all": {}
		},
		"fields" : [ "metadata.license", "metadata.distribution", "date", "author", "license", "distribution", "name", "metadata.name" ],
		"size" : 1000,
		//"size" : metacpan.size(),
		//"from" : from
	}, query, callback, show_error)

}

metacpan.leaderboard = function(query, callback) {
	var page_size = metacpan.size();
	var page = metacpan.page;
	var from = ( page - 1 ) * page_size;
	metacpan.post("http://api.metacpan.org/v0/release/_search", {
		"query": {
			"match_all": {}
		},
		"facets": {
			"author": {
				"terms": {
					"field": "author",
					"from" : from,
					"size": page_size
				}
			}
		},
		"size": 0
	}, query, callback, show_error)
};

metacpan.profile = function(query, callback) {
	var page_size = metacpan.size();
	var page = metacpan.page;
	var from = ( page - 1 ) * page_size;
	metacpan.post("http://api.metacpan.org/v0/author/_search", {
		"query": {
			"match_all": {}
		},
		"filter" : {
			"term": { "author.profile.name" : query }
		},
		"fields" : ["name", "pauseid", "profile"],
		"size" : metacpan.size(),
		"from" : from
	}, query, callback, show_error);
};

metacpan.profiles = {
		'coderwall'         : 'http://www.coderwall.com/',
		'delicious'         : 'http://www.delicious.com/',
		'facebook'          : 'http://www.facebook.com/',
		'flickr'            : 'http://www.flickr.com/people/',
		'geeklist'          : 'http://geekli.st/',
		'github'            : 'https://github.com/',
		'github-meets-cpan' : 'http://gh.metacpan.org/user/',
		'gitorious'         : 'https://gitorious.org/~',
		'gittip'            : 'https://gratipay.com/',
		'googleplus'        : 'https://plus.google.com/',
		'hackernews'        : 'https://news.ycombinator.com/user?id=',
		'identica'          : 'http://identi.ca/',
		//'irc'               : '',
		'lastfm'            : 'http://www.last.fm/user/',
		'linkedin'          : 'https://www.linkedin.com/in/',
		'klout'             : 'http://klout.com/#/',
		'ohloh'             : 'https://www.openhub.net/accounts/',
		'openhub'           : 'https://www.openhub.net/accounts/',
		'perlmonks'         : 'http://www.perlmonks.org/?node=',
		//'perlresume'        : 'http://perlresume.org/',
		'reddit'            : 'http://www.reddit.com/user/',
		'stackoverflow'     : 'http://stackoverflow.com/users/',
		'twitter'           : 'https://twitter.com/',
		'vimeo'             : 'https://vimeo.com/',
		'xing'              : 'https://www.xing.com/profile/',
		'youtube'           : 'https://www.youtube.com/user/'
};


metacpan.post = function(url, data, query, callback, error) {
	xmlhttp = metacpan.prepare(query, callback, error);
	xmlhttp.open("POST", url, true);
	xmlhttp.send(JSON.stringify(data));
};


metacpan.get = function(url, query, callback, error) {
	xmlhttp = metacpan.prepare(query, callback, error);

	xmlhttp.open("GET", url, true);
	xmlhttp.send();
};

metacpan.prepare = function(query, callback, error) {
	xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			switch (xmlhttp.status) {
				case 200:
					console.log('responseText:' + xmlhttp.responseText);
					var data = JSON.parse(xmlhttp.responseText);
					callback(query, data);
					break;
				case 404:
					console.log('Status: ' + xmlhttp.status);
					error(query, {code : 404});
					break;
				default:
					console.log('Status: ' + xmlhttp.status);
					error(query, data);
					break;
			}
		}
	}
	return xmlhttp;
};

metacpan.search = function() {
	var query = $('#query').val();
	window.location.hash = '#search/' + query;
	click(location.hash)
}


Handlebars.registerHelper('pager', function() {
	var page_count = Math.ceil(metacpan.total / metacpan.size());
	var page = metacpan.page;
	var path = location.hash;
	if (path) {
		path = path.replace(/\?.*/, '');
	}

	var html = 'Page:';
	html += '<ul>';
	for (var n = Math.max(1, page - 2) ; n <= Math.min(page + 2, page_count); n++) {
		html += '<li>';
		if (page == n) {
			html += '<b>';
		}
		html += '<a href="' + path + '?page=' + n + '">' + n + '</a>';
		if (page == n) {
			html += '</b>';
		}
		html += '</li>';
	}

	html += '</ul>';
	return new Handlebars.SafeString(html);
});

Handlebars.registerHelper('sizer', function() {
	var page_size = metacpan.size();
	var path = location.hash;
	if (path) {
		path = path.replace(/\?.*/, '');
	}

	var html = 'Size:';
	html += '<ul>';
	[1, 10, 50, 100, 500].forEach(function(n) {
		html += '<li>';
		if (page_size == n) {
			html += '<b>';
		}
		html += '<a href="' + path + '?size=' + n + '">' + n + '</a>';
		if (page_size == n) {
			html += '</b>';
		}
		html += '</li>';
	});
	html += '</ul>';
	return new Handlebars.SafeString(html);
});


Handlebars.registerHelper('iff', function(a, operator, b, opts) {
	var bool = false;
	switch(operator) {
		case '==':
			bool = a == b;
			break;
		case '!=':
			bool = a != b;
			break;
		case '>':
			bool = a > b;
			break;
		case '<':
			bool = a < b;
			break;
		default:
			throw "Unknown operator " + operator;
	}

	if (bool) {
		return opts.fn(this);
	} else {
		return opts.inverse(this);
	}
});


function click(route) {
	var params = new Object;
	if (route) {
		route = route.replace(/^#/, '');
		var query_string = route.replace(/^[^?]*\?/, '');
		query_string.split(/\&/).forEach(function(pair) {
			var kv = pair.split(/=/);
			params[ kv[0] ] = kv[1];
		});
		route = route.replace(/\?.*/, '');
	} else {
		route = 'home';
	}
	route = route.split("/");

	$(".active").removeClass('active');
	var locator = route[0] == 'home' ? 'a[href=#]' : "a[href=#" + route[0] +"]" ;
	$(locator).parent('li').addClass('active');

	if (params["size"]) {
		localStorage.setItem('page_size', params["size"]);
	}
	if (params["page"]) {
		metacpan.page = parseInt(params["page"]);
	}

	switch(route[0]) {
		case('search'):
			// empty search redirct to home page
			if (route[1] == '') {
				window.location.hash = '#';
				return;
			}
			// if users searches for Module/Name.pm   we should load it directly
			// if user search for Module::Name we try to load that exact module (we should search among the module names)
			if (/::/.exec(route[1])) {
				metacpan.module(route[1], display_module);
			} else {
				metacpan.release(route[1], display_result);
			}
			return;
		case('home'):
			display('', { 'recommended' : metacpan.recommended }, 'home-template');
			return;
		case('recent'):
			metacpan.recent(20, display_recent);
			return;
		case('leaderboard'):
			metacpan.leaderboard('', display_leaderboard);
			return;
		case('profiles'):
			display(0, {'profiles' : metacpan.profiles }, 'profiles-template');
			return;
		case('other'):
			display(0, {}, 'other-template');
			return;
		case('no-license'):
			metacpan.no_license('', display_no_license);
			return;
		case('release'):
			metacpan.release(route[1], display_result);
			return;
		case('author'):
			metacpan.author(route[1], display_author);
			return;
		case('profile'):
			metacpan.profile(route[1], display_profile);
			return;
		case('recommended'):
			var name = route[1];
			display(name, { 'recommended' : metacpan.recommended[name] }, 'recommended-template');
			return;
		case('module'):
			metacpan.module(route[1], display_module);
			return;
		default:
			console.log('unhandled route: ' + route);
	}
}

function show_error(query, result) {
	display(query, result, 'error-template');
}


function display(query, result, template) {
	if (result["hits"]) {
		metacpan.total = result["hits"]["total"];
	}

	var source   = $('#' + template).html();
	var template = Handlebars.compile(source);
	var html    = template({'query' : query, 'result' : result});
	$('#result').html(html);
}

function display_profile(name, result) {
	for (var i=0; i < result["hits"]["hits"].length; i++) {
		var profile = result["hits"]["hits"][i]["fields"]["profile"];
		var url = "";
		var id = "";
		for (var j=0; j < profile.length; j++) {
			if (profile[j]["name"] == name) {
				id  = profile[j]["id"];
				url = metacpan.profiles[name] + profile[j]["id"];
				break;
			}
		}
		result["hits"]["hits"][i]["url"] = url;
		result["hits"]["hits"][i]["id"] = id;
	}

	display(name, result, 'profile-template');
}

function display_author(query, result) {
	if (result["profile"]) {
		result["profile"] = result["profile"].filter( function(p) { return metacpan.profiles[ p["name"] ] });
		result["profile"].forEach( function(p) { p["url"] =  metacpan.profiles[ p["name"] ] + p["id"] } );
	}

	display(query, result, 'author-template');
};

function display_module(query, result) {
	display(query, result, 'module-template');
};

function display_result(query, result) {
	display(query, result, 'release-template');
};

function display_recent(count, result) {
	display(count, result, 'recent-template');
}
function display_leaderboard(count, result) {
	display(count, result, 'leaderboard-template');
}

function display_no_license(count, result) {
	var distros = result["hits"]["hits"].filter(function(h) { return h["fields"]["license"] == "unknown" } );
	display(count, distros, 'releases-template');
}



$(document).ready(function() {
	$('#search').click(metacpan.search);
	$('#query').bind('keypress', function(e) {
		var code = e.keyCode || e.which;
		if (code == 13) {
			metacpan.search();
		}
	});
	$(window).bind('hashchange', function() {
		click(location.hash)
	})
	click(location.hash);
});

