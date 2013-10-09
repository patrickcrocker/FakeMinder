var assert = require('assert');
var expect = require('expect.js');
var fm = require('../lib/fakeminder.js');

describe('FakeMinder', function() {
  var subject;
  var emptySession;

  beforeEach(function() {
    subject = new fm.FakeMinder();
    emptySession = { 'user':'' };
    subject.config['target_site'] = {
      'host':'http://localhost:8000',
      'logoff_url':'/system/logout'
    };
  });

  it('it has an empty session', function() {
    // Act
    var emptySession = subject.emptySession;

    // Assert
    expect(emptySession).to.eql({'user':''});
  });

  describe('#getUserForCurrentSession()', function() {
    it('finds the session that matches the current SmSession cookie.', function() {
      var existingSession = {
        'xyz' : {
          'name' :'bob'
        }
      };
      subject.sessions = existingSession;
      var req = {
        'headers': {
          'cookie':'SMSESSION=xyz'
        }
      };

      var session = subject.getUserForCurrentSession(req);

      expect(session['name']).to.equal('bob');
    });

    it('returns an empty session for an SmSession cookie that does not match an existing session.', function() {
      subject.sessions = {'xyz':''};
      var req = { 'headers':{'cookie':'SMSESSION=abc'} };

      var session = subject.getUserForCurrentSession(req);

      expect(session).to.eql(emptySession);
    });

    it('returns an empty session if an SmSession cookie does not exist.', function() {
      var req = { 'headers':{'cookie':'SMSESSION=abc'} };

      var session = subject.getUserForCurrentSession(req);

      expect(session).to.eql(emptySession);
    });

    it('returns an empty session if there are no active sessions.', function() {
      var req = { 'headers':{} };

      var session = subject.getUserForCurrentSession(req);

      expect(session).to.eql(emptySession);
    })
  });

  describe('#handleRequest()', function() {
    var request = {};
    var response = {};

    beforeEach(function() {
      request['method'] = 'GET';
      request['url'] = 'http://localhost:8000/';
      response['setHeader'] = function(header, value) {
        this.headers = this.headers || {};
        this.headers[header] = value;
      };
    });

    it('replaces the response writeHead method with the original implementation', function() {
      // Arrange
      var writeHead = 'writeHead';
      response['writeHead'] = writeHead;

      // Act
      subject.handleRequest(request, response);
      response.writeHead(200);

      // Assert
      expect(response.writeHead).to.equal(writeHead);
    });

    it('adds a "x-proxied-by" header value with the host/port value of the proxy', function() {
      // Arrange

      // Act
      subject.handleRequest(request, response);
      response.writeHead(200);

      // Assert
      expect(response.headers).to.be.ok();
      expect(response.headers).to.have.key('x-proxied-by');
      expect(response.headers['x-proxied-by']).to.equal('localhost:8000');
    });

    describe('when the logoff_url is requested', function() {
      it('adds an SMSESSION cookie with a value of LOGGEDOFF to the response', function() {
        // Arrange
        request.url = 'http://localhost:8000/system/logout';

        // Act
        subject.handleRequest(request, response);
        response.writeHead(200);

        // Assert
        expect(response.headers['Set-Cookie']).to.contain('SMSESSION=LOGGEDOFF');
      });

      it('removes the existing session corresponding to the SMSESSION cookie value');
    });

    describe('when the request is a post to the login_url', function() {
      describe('when the credentials are valid', function() {
        it('adds an SMSESSION cookie with the session ID to the response');
        it('responds with a redirect to the TARGET URI');
      });

      describe('when the USER is not valid', function() {
        it('responds with a redirect to the bad login URI');
      });

      describe('when the PASSWORD is not valid', function() {
        it('responds with a redirect to the bad password URI');
      });

      describe('when the number of login attempts has been exceeded', function() {
        it('responds with a redirect to the account locked URI');
      });
    });
  })

  describe('#beginSession()', function(req, res) {
  });
});