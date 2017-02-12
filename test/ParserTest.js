var should = require('should');
var cheerio = require('cheerio');
var fs = require('fs');
var Parser = require('../src/Parser.js');

function load(file) {
  return cheerio.load(fs.readFileSync('test/html/' + file));
}

describe('Parser', function() {

  before(function() {
    // var $ = cheerio.load(fs.readFileSync('test/test.html'));
  });

  describe('#isData', function() {

    it('should identify a data line', function() {
      let $ = load("data_line.html");
      let tr = $('tr');
      let parser = new Parser($);

      (parser.isData(tr)).should.be.exactly(true);
    });

    it('should identify a header line as not a data line', function() {
      let $ = load("header_line.html");
      let tr = $('tr');
      let parser = new Parser($);

      (parser.isData(tr)).should.be.exactly(false);
    });
  });

  describe('#getPessoa', function() {

    let $PJ = load("pessoaJuridica.html");
    let trPJ = $PJ('tr');
    let parserPJ = new Parser($PJ);

    let $PF = load("pessoaFisica.html");
    let trPF = $PF('tr');
    let parserPF = new Parser($PF);

    it('should return pessoa td', function() {

      let td = parserPJ._getPessoaTd(trPJ);
      (td.text().trim()).should.startWith("Razão Social: ANGRA ");
    });

    it('should identify Pessoa Juridica', function() {

        let pjTxt = parserPJ._getPessoaTd(trPJ).text();
        (parserPJ._isPessoaJuridica(pjTxt)).should.be.exactly(true);

        let pfTxt = parserPF._getPessoaTd(trPF).text();
        (parserPF._isPessoaJuridica(pfTxt)).should.be.exactly(false);
    });

    it('should return Pessoa Juridica', function() {

        let expected = {
            "razao social": "ANGRA LAB LABORATORIO DE ANALISES CLINICAS ANGRA",
            "fantasia": "ANGRA LAB LABORATORIO DE ANALISES CLINICAS ANGRA 123",
            "cnpj": "28.588.747/0001-21"
        };

        let pjTxt = parserPJ._getPessoaTd(trPJ).text();
        (parserPJ._getPessoaJuridica(pjTxt)).should.be.eql(expected);
    });

    it('should return Pessoa Fisica', function() {

      let expected = {
          "nome": "ALEXANDRE ALMEIDA L'HOTELLIER",
          "conselho": "CRO",
          "numero": "38064",
          "estado": "RJ"
      };

      let pfTd = parserPJ._getPessoaTd(trPF);
      (parserPF._getPessoaFisica(pfTd)).should.be.eql(expected);
    });

  });

});
