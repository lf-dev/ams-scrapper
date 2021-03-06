var request = require('request');

//const siteUrl = "http://54.233.163.206:3000";
const siteUrl = "http://localhost:3000";
const search = "/search";
const resources = ['/js/app.js', '/css/styles.css'];
const MAX_TIMEOUT = 2000;
const NUM_USUARIOS = 10;
const NUM_BUSCA_USUARIO = 20;
const NUM_MAX_PAGINACAO_BUSCA = 10;

function User() {

    this.events = [];
    this.stack = [];
    this.lastPage = 0;
    this.lastQuery = "";
}

User.prototype._request = function(url, stack, done) {

    var self = this;
    request(url, function(error, response, body) {

        if(error || !response) {
            console.error(error);
        }
        else{
            if(stack){
                self.stack.push(url);
            }

            if(response.statusCode != 200){
                console.error("erro ao requisitar " + url);
            }
        }

        if(done) done();
    });
}

User.prototype.land = function() {
    var self = this;
    return new Promise(function(resolve) {
        self._land(resolve);
    });
}

User.prototype._land = function(done) {

    var event = {
        type: 'land',
        start: Date.now()
    }
    var self = this;
    var start = new Date().getTime();

    new Promise(function(resolve, reject) {
        self._request(siteUrl, true, resolve);

    }).then(function() {

        var promises = resources.map(function(resource) {
            return new Promise(function(resolve, reject) {
                self._request(siteUrl + resource, false, resolve);
            });
        });

        Promise.all(promises).then(function() {
            event.end = Date.now();
            self.events.push(event);
            if(done) done();
        });
    });
}

User.prototype.search = function(){
    var self = this;
    return new Promise(function(resolve){
        self._search(resolve);
    });
}

User.prototype._search = function(done) {

    var event = {
        type: 'search',
        start: Date.now()
    }
    var self = this;

    var query = this._createQuery();
    this.lastPage = query.from;
    this.lastQuery = query.q;

    var params = "?q="+query.q+"&from="+query.from;
    this._request(siteUrl + search + params, true, function() {
        event.end = Date.now();
        self.events.push(event);
        if(done) done();
    });
}

User.prototype._createQuery = function() {

    var termos = [    "ortopedista",
                        "cardiologista",
                        "rio de janeiro",
                        "petropolis",
                        "sao paulo",
                        "cirurgiao",
                        "ortopedia",
                        "barra da tijuca",
                        "botafogo",
                        "dermatologista",
                        "joao"];

    var numTermos = Math.floor((Math.random()*5)+1);
    var query = [];
    for(var i=0; i<numTermos; i++) {
        var indexTermo = Math.floor(Math.random()*termos.length);
        query.push(termos.splice(indexTermo, 1));
    }

    return {
        q: query.join(" "),
        from: 0
    }
}

User.prototype.back = function(){
    var self = this;
    return new Promise(function(resolve){
        self._back(resolve);
    });
}

User.prototype._back = function(done) {

    if(this.stack.length <= 1){
        if(done) done();
        return;
    }

    var event = {
        type: 'back',
        start: Date.now()
    }
    var self = this;

    this.stack.pop();
    var url = this.stack.pop();
    this._request(url, true, function() {
        event.end = Date.now();
        self.events.push(event);
        if(done) done();
    });
}

User.prototype.nextPage = function(){
    var self = this;
    return new Promise(function(resolve){
        self._nextPage(resolve);
    });
}

User.prototype._nextPage = function(done) {

    var event = {
        type: 'next',
        start: Date.now()
    }
    var self = this;

    this.lastPage += 1;
    var params = "?q="+this.lastQuery+"&from="+this.lastPage;

    this._request(siteUrl + search + params, false, function() {
        event.end = Date.now();
        self.events.push(event);
        if(done) done();
    });
}

User.prototype.navigate = function(done){

    var self = this;
    var navigation = this._navigationSteps();
    var p = Promise.resolve();

    navigation.forEach(function(nav) {
        p = p.then(function(){
            return nav.call(self);
        })
        .then(function () {

            var t = Math.floor(Math.random()*MAX_TIMEOUT);
            return new Promise(function(resolve) {
                setTimeout(resolve, t);
            });
        });
    });

    p.then(function() {
        done();
    });
}

User.prototype._navigationSteps = function() {
    var navigation = [];
    navigation.push(User.prototype.land);
    for(var i=0; i<NUM_BUSCA_USUARIO; i++){
        navigation.push(...this._generateSearchAndPaginate());
    }
    navigation.push(User.prototype.back);
    navigation.push(User.prototype.back);
    return navigation;
}

User.prototype._generateSearchAndPaginate = function() {

    var navigation = [];

    var paginations = Math.floor(Math.random()*NUM_MAX_PAGINACAO_BUSCA);
    navigation.push(User.prototype.search);
    for(var i=0; i<paginations; i++){
        navigation.push(User.prototype.nextPage);
    }

    return navigation;
}

function report(users) {

    var events = [];
    users.forEach(function(user){
        events.push(...user.events);
    });

    var totalTime = 0;
    var numRequests = 0;
    events.forEach(function(e) {
        numRequests++;
        totalTime += e.end - e.start;
    });

    var average = totalTime/numRequests;

    console.log("Num requests: " + numRequests);
    console.log("Total time: " + totalTime);
    console.log("Average: " + average + " ms");
}

var users = Array(NUM_USUARIOS).fill().map(function() {
    return new User();
});

var ps = users.map(function(user) {
    return new Promise(function(resolve){
        user.navigate(resolve);
    });
});

Promise.all(ps).then(function() {
        report(users);
});

