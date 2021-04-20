const Lichess = (function() {

  function Lichess(access_token) {
    this.init(access_token);
  }

  Lichess.prototype.init = function(access_token) {
    this.access_token = access_token;
    this.headers = { Authorization: `Bearer ${this.access_token}` }
  }

  Lichess.prototype.me = function() {
    return Lichess.xhr(`GET`, `https://lichess.org/api/account`, {}, {}, this.headers);
  }
  
  Lichess.prototype.getOngoingGames = function() {
    return Lichess.xhr(`GET`, `https://lichess.org/api/account/playing`, {}, {}, this.headers);
  }

  Lichess.prototype.streamEvents = function(onStream = function(){}) {
    return Lichess.xhr(`GET`, `https://lichess.org/api/stream/event`, {}, {}, this.headers, onStream);
  }

  Lichess.prototype.createSeek = function(opts) {
    return Lichess.xhr(`POST`, `https://lichess.org/api/board/seek`, opts, {}, this.headers);
  }

  Lichess.prototype.streamBoardState = function(gameId, onStream = function(){}) {
    return Lichess.xhr(`GET`, `https://lichess.org/api/board/game/stream/${gameId}`, {}, {}, this.headers, onStream);
  }

  Lichess.prototype.makeBoardmove = function(gameId, move) {
    return Lichess.xhr(`POST`, `https://lichess.org/api/board/game/${gameId}/move/${move}`, {}, {}, this.headers);
  }

  Lichess.prototype.abortGame = function(gameId) {
    return Lichess.xhr(`POST`, `https://lichess.org/api/board/game/${gameId}/abort`, {}, {}, this.headers);
  }

  Lichess.prototype.resignGame = function(gameId) {
    return Lichess.xhr(`POST`, `https://lichess.org/api/board/game/${gameId}/resign`, {}, {}, this.headers);
  }

  Lichess.prototype.handleDrawOffers = function(gameId, accept) {
    return Lichess.xhr(`POST`, `https://lichess.org/api/board/game/${gameId}/draw/${accept}`, {}, {}, this.headers);
  }

  Lichess.prototype.challengeAI = function(opts) {
    var headers = JSON.parse(JSON.stringify(this.headers));
    headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
    return Lichess.xhr(`POST`, `https://lichess.org/api/challenge/ai`, opts, {}, headers);
  }

  Lichess.prototype.createChallenge = function(username, opts) {
    var headers = JSON.parse(JSON.stringify(this.headers));
    headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
    return Lichess.xhr(`POST`, `https://lichess.org/api/challenge/${username}`, opts, {}, headers);
  }

  Lichess.prototype.cancelChallenge = function(challengeId) {
    return Lichess.xhr(`POST`, `https://lichess.org/api/challenge/${challengeId}/cancel`, {}, {}, this.headers);
  }

  Lichess.prototype.acceptChallenge = function(challengeId) {
    return Lichess.xhr(`POST`, `https://lichess.org/api/challenge/${challengeId}/accept`, {}, {}, this.headers);
  }

  Lichess.prototype.declineChallenge = function(challengeId) {
    return Lichess.xhr(`POST`, `https://lichess.org/api/challenge/${challengeId}/decline`, {}, {}, this.headers);
  }

  Lichess.xhr = function(method, url, data={}, query={}, headers={}, onStream=function(){}) {
    var xhttp = new XMLHttpRequest({ mozSystem: true });
    var prms = new Promise((resolve, reject) => {
      var _url = new URL(url);
      for (var y in query) {
        _url.searchParams.set(y, query[y]);
      }
      url = _url.origin + _url.pathname + `?` + _url.searchParams.toString();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status >= 200 && this.status <= 299) {
            try {
              const response = JSON.parse(xhttp.response);
              resolve({ raw: xhttp, response: response});
            } catch (e) {
              resolve({ raw: xhttp, response: xhttp.responseText});
            }
          } else {
            try {
              const response = JSON.parse(xhttp.response);
              reject({ raw: xhttp, response: response});
            } catch (e) {
              reject({ raw: xhttp, response: xhttp.responseText});
            }
          }
        } else if (this.readyState == 3) {
          onStream(xhttp.responseText);
        }
      };
      xhttp.open(method, url, true);
      for (var x in headers) {
        xhttp.setRequestHeader(x, headers[x]);
      }
      if (Object.keys(data).length > 0) {
        var formBody = [];
        for (var property in data) {
          var encodedKey = encodeURIComponent(property);
          var encodedValue = encodeURIComponent(data[property]);
          formBody.push(encodedKey + "=" + encodedValue);
        }
        formBody = formBody.join("&");
        xhttp.send(formBody);
      } else {
        xhttp.send();
      }
    });
    return [prms, xhttp]
  }

  return Lichess;

})();
