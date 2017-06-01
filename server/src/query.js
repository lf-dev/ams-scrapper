var http = require('http');

const   estados = [],
        cidades = [],
        bairros = [],
        especialidades = [];

const matchAllQuery = {
    "size": 10000,
    "query": {
        "match_all": {}
    }
};

var buildFilter = function(queryTxt) {

    var query = queryTxt.toUpperCase();

    return {
        "filter": [
            buildFilterIndice(query, estados, "credencidado.enderecos.estado"),
            buildFilterIndice(query, cidades, "credencidado.enderecos.cidade"),
            buildFilterIndice(query, bairros, "credencidado.enderecos.bairro"),
            buildFilterIndice(query, especialidades, "credencidado.enderecos.especialidades")
    ]};
}
module.exports.buildFilter = buildFilter;


var buildFilterIndice = function(query, todosValoresIndices, path) {

    var matchQueries = todosValoresIndices.filter(function(value) {
        return query.indexOf(value) > -1;
    }).map(function(value) {
        return buildMatchQuery(value, path);
    });

    return {
        "bool": {
            "should": matchQueries
        }
    };
}

var buildMatchQuery = function(value, path) {

    var matchQuery = {
        "match": {}
    };

    matchQuery.match[path] = {
        "query": value,
        "operator": "and"
    };

    return matchQuery;
}

var carregarIndice = function(indice, array) {

    consultarES(indice, matchAllQuery, function(json) {

        var values = json.hits.hits.map(function(hit) {
            return hit._source[indice];
        });

        while(array.length) {
            array.pop();
        }
        values.forEach(function(v) {
            array.push(v);
        });
    });
}

var consultarES = function(index, jsonQuery, callback) {

    var options = {
        host: 'localhost',
        port: 9200,
        path: '/ams/'+index+'/_search',
        method: 'POST'
    };

    var req = http.request(options, function (res) {

        var body = [];
        res.on('data', function (chunk) {
            body.push(chunk);
        });
        res.on('end', function () {
            var bodyTxt = Buffer.concat(body).toString();
            var json = JSON.parse(bodyTxt);

            callback(json);
        });
    });

    req.write(JSON.stringify(jsonQuery));
    req.end();
}

carregarIndice("estado", estados);
carregarIndice("cidade", cidades);
carregarIndice("bairro", bairros);
carregarIndice("especialidade", especialidades);