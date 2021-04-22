window.addEventListener("load", function() {

  localforage.setDriver(localforage.LOCALSTORAGE);

  const CLIENT_ID = "bXKD7cYJPPMzmlfk";
  const SCOPE = 'challenge:write challenge:read board:play';
  var IFRAME_TIMER;
  var LICHESS_API = null;

  const state = new KaiState({
    'SEEK_OPTIONS': {},
  });

  const parseNdJSON = (jsonString) => {
    const type = typeof jsonString;
    if (type !== 'string') throw new Error(`Input have to be string but got ${type}`);

    const jsonRows = jsonString.split(/\n|\n\r/).filter(Boolean);
    return jsonRows.map(jsonStringRow => JSON.parse(jsonStringRow));
  };

  function getURLParam(key, target) {
    var values = [];
    if (!target) target = location.href;

    key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");

    var pattern = key + '=([^&#]+)';
    var o_reg = new RegExp(pattern,'ig');
    while (true){
      var matches = o_reg.exec(target);
      if (matches && matches[1]){
        values.push(matches[1]);
      } else {
        break;
      }
    }

    if (!values.length){
      return [];
    } else {
      return values.length == 1 ? [values[0]] : values;
    }
  }

  const helpSupportPage = new Kai({
    name: 'helpSupportPage',
    data: {
      title: 'helpSupportPage'
    },
    templateUrl: document.location.origin + '/templates/helpnsupport.html',
    mounted: function() {
      this.$router.setHeaderTitle('Help & Support');
      navigator.spatialNavigationEnabled = false;
    },
    unmounted: function() {},
    methods: {},
    softKeyText: { left: '', center: '', right: '' },
    softKeyListener: {
      left: function() {},
      center: function() {},
      right: function() {}
    }
  });

  const loginPage = function ($router) {
    var ping = new XMLHttpRequest({ mozSystem: true });
    ping.open('GET', 'https://malaysiaapi.herokuapp.com/', true);
    ping.send();
    var url = `https://oauth.lichess.org/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=https%3A%2F%2Fmalaysiaapi.herokuapp.com%2Flichess%2Fapi%2Fv1%2Fredirect&scope=${SCOPE}`
    $router.push(new Kai({
      name: 'loginPage',
      data: {
        title: 'loginPage'
      },
      templateUrl: document.location.origin + '/templates/login.html',
      mounted: function() {
        const hdr = document.getElementById('__kai_header__');
        hdr.classList.add("sr-only");
        const sk = document.getElementById('__kai_soft_key__');
        sk.classList.add("sr-only");
        const kr = document.getElementById('__kai_router__');
        kr.classList.add("full-screen-browser");
        var a = document.getElementsByClassName('kui-router-m-top')
        a[0].style.marginTop = '0px'
        navigator.spatialNavigationEnabled = true;
        var frameContainer = document.getElementById('login-container');
        loginTab = new Tab(url);
        window['loginTab'] = loginTab;
        loginTab.iframe.setAttribute('height', '296px;');
        loginTab.iframe.setAttribute('style', 'padding:2px;');
        loginTab.iframe.setAttribute('frameBorder', '0');
        loginTab.iframe.addEventListener('mozbrowserloadstart', () => {
          $router.showLoading(false);
        });
        loginTab.iframe.addEventListener('mozbrowserloadend', () => {
          this.$router.hideLoading();
        });
        var container = document.querySelector('#login-container');
        var root1 = container.createShadowRoot();
        var root2 = container.createShadowRoot();
        root1.appendChild(loginTab.iframe);
        var shadow = document.createElement('shadow');
        root2.appendChild(shadow);
        loginTab.iframe.addEventListener('mozbrowserlocationchange', function (e) {
          if (e.detail.url.indexOf('https://malaysiaapi.herokuapp.com/lichess/api/v1/redirect') > -1) {
            console.log(window['loginTab'].url.url);
            const codeToken = getURLParam('code', window['loginTab'].url.url);
            if (codeToken.length > 0) {
              setTimeout(() => {
                var oauthAuthorize = new XMLHttpRequest({ mozSystem: true });
                oauthAuthorize.open('GET', 'https://malaysiaapi.herokuapp.com/lichess/api/v1/exchange_token?code=' + codeToken[0], true);
                oauthAuthorize.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                oauthAuthorize.setRequestHeader("X-Accept", 'application/json');
                oauthAuthorize.onreadystatechange = function() {
                  if(oauthAuthorize.readyState == 4 && oauthAuthorize.status == 200) {
                    if (oauthAuthorize.response) {
                      var obj = JSON.parse(oauthAuthorize.response);
                      localforage.setItem('LICHESS_ACCESS_TOKEN', obj.data)
                      $router.showToast('Login Success');
                      $router.hideLoading()
                      $router.pop();
                    } else {
                      $router.hideLoading()
                      $router.showToast('Invalid response');
                      $router.pop();
                    }
                  } else if (oauthAuthorize.status == 403) {
                    $router.hideLoading()
                    $router.showToast('Unauthorize 403');
                    $router.pop();
                  } else if (oauthAuthorize.readyState == 4) {
                    $router.hideLoading()
                    $router.showToast('Unknown Error');
                    $router.pop();
                  }
                }
                $router.showLoading();
                oauthAuthorize.send();
              }, 500);
            }
          }
        });
      },
      unmounted: function() {
        const hdr = document.getElementById('__kai_header__');
        hdr.classList.remove("sr-only");
        const sk = document.getElementById('__kai_soft_key__');
        sk.classList.remove("sr-only");
        const kr = document.getElementById('__kai_router__');
        kr.classList.remove("full-screen-browser");
        var a = document.getElementsByClassName('kui-router-m-top')
        a[0].style.marginTop = '28px'
        navigator.spatialNavigationEnabled = false;
      },
      methods: {
        listenState: function() {}
      },
      softKeyText: { left: '', center: '', right: '' },
      softKeyListener: {
        left: function() {},
        center: function() {},
        right: function() {}
      },
      backKeyListener: function() {
        window['loginTab'].getCanGoBack()
        .then((canGoBack) => {
          if (canGoBack) {
            window['loginTab'].goBack();
          } else {
            this.$router.pop();
          }
        });
        return true;
      }
    }));
  }

  const newLocalGame = new Kai({
    name: 'newLocalGame',
    data: {
      title: '',
      p1: 'Human',
      p1Lvl: 0,
      p2: 'Human',
      p2Lvl: 0,
      pov: 'White',
    },
    verticalNavClass: '.newLocalGameNav',
    templateUrl: document.location.origin + '/templates/newLocalGame.html',
    mounted: function() {
      this.$router.setHeaderTitle('Local Game');
      navigator.spatialNavigationEnabled = false;
    },
    unmounted: function() {},
    methods: {
      setWhitePlayer: function() {
        var menu = [
          { "text": "Human", "checked": false },
          { "text": "Bot 1", "checked": false },
          { "text": "Bot 2", "checked": false },
          { "text": "Bot 3", "checked": false }
        ];
        const idx = menu.findIndex((opt) => {
          return opt.text === this.data.p1;
        });
        this.$router.showSingleSelector('White', menu, 'Select', (selected) => {
          this.setData({ p1: selected.text });
        }, 'Cancel', null, undefined, idx);
      },
      setBlackPlayer: function() {
        var menu = [
          { "text": "Human", "checked": false },
          { "text": "Bot 1", "checked": false },
          { "text": "Bot 2", "checked": false },
          { "text": "Bot 3", "checked": false }
        ];
        const idx = menu.findIndex((opt) => {
          return opt.text === this.data.p2;
        });
        this.$router.showSingleSelector('Black', menu, 'Select', (selected) => {
          this.setData({ p2: selected.text });
        }, 'Cancel', null, undefined, idx);
      },
      setPOV: function() {
        var menu = [
          { "text": "White", "checked": false },
          { "text": "Black", "checked": false }
        ];
        const idx = menu.findIndex((opt) => {
          return opt.text === this.data.pov;
        });
        this.$router.showSingleSelector('POV', menu, 'Select', (selected) => {
          this.setData({ pov: selected.text });
        }, 'Cancel', null, undefined, idx);
      }
    },
    softKeyText: { left: 'Back', center: 'SELECT', right: 'Create' },
    softKeyListener: {
      left: function() {
        this.$router.pop();
      },
      center: function() {
        const listNav = document.querySelectorAll(this.verticalNavClass);
        if (this.verticalNavIndex > -1) {
          if (listNav[this.verticalNavIndex]) {
            listNav[this.verticalNavIndex].click();
          }
        }
      },
      right: function() {
        var salt = window.crypto.getRandomValues(new Uint32Array(10))[0].toString();
        const hashids2 = new Hashids(salt, 15);
        const random = hashids2.encode(1);
        loadLocalGame(this.$router, random, this.data.p1.toLowerCase(), this.data.p2.toLowerCase(), this.data.pov.toLowerCase(), '');
      }
    },
    softKeyInputFocusText: { left: '', center: '', right: '' },
    softKeyInputFocusListener: {
      left: function() {
        if (document.activeElement.tagName === 'INPUT') {
          document.activeElement.blur();
          this.dPadNavListener.arrowDown();
        }
      },
      center: function() {},
      right: function() {}
    },
    dPadNavListener: {
      arrowUp: function() {
        this.navigateListNav(-1);
      },
      arrowRight: function() {
        // this.navigateTabNav(-1);
      },
      arrowDown: function() {
        this.navigateListNav(1);
      },
      arrowLeft: function() {
        // this.navigateTabNav(1);
      },
    }
  });

  const loadLocalGame = function ($router, game_id, p1='human', p2='human', pov='white', pgn='', local_game = true) {
    var HISTORY = [];
    $router.push(
      new Kai({
        name: 'loadLocalGame',
        data: {
          title: 'loadLocalGame'
        },
        templateUrl: document.location.origin + '/templates/loadLocalGame.html',
        mounted: function() {
          navigator.spatialNavigationEnabled = false;
          var listener = {
            onGameOver: function() {
              var s = document.getElementById('game-status')
              if (window['chess'].GAME.in_stalemate()) {
                s.innerText = 'Stalemate'
              }
              if (window['chess'].GAME.in_draw()) {
                s.innerText = 'Draw'
              }
              if (window['chess'].GAME.in_threefold_repetition()) {
                s.innerText = 'Threefold Repetition'
              }
              if (window['chess'].GAME.in_checkmate()) {
                s.innerText = 'White Win'
                if (window['chess'].GAME.turn() === 'w') {
                  s.innerText = 'Black Win'
                }
              }
            },
            onCheck: function() {
              var s = document.getElementById('game-status')
              s.innerText = 'Check'
            },
            onTurn: function(color) {
              var p = document.getElementById('player-turn')
              p.innerText = 'White'
              if (color === 'b') {
                p.innerText = 'Black'
              }
              var s = document.getElementById('game-status')
              s.innerText = 'In Progress'
              if (local_game && window['chess'] != null) {
                var _H = window['chess'].GAME.history({ verbose: true });
                var c = _H.length - 1;
                if (_H[c]) {
                  if (_H[c - 1]) {
                    var from = window['chess'].getPosition(window['chess'].getMoveDOM(_H[c - 1].from))
                    var to = window['chess'].getPosition(window['chess'].getMoveDOM(_H[c - 1].to))
                    from.classList.remove('h-select-cursor');
                    to.classList.remove('h-select-cursor');
                  }
                  var from = window['chess'].getPosition(window['chess'].getMoveDOM(_H[c].from))
                  var to = window['chess'].getPosition(window['chess'].getMoveDOM(_H[c].to))
                  from.classList.add('h-select-cursor');
                  to.classList.add('h-select-cursor');
                }
              }
            }
          }
          window['chess'] = createChessGame(p1, p2, pov, 'container', listener);
          window['chess'].loadPGN(pgn);
          if (!local_game) {
            HISTORY = JSON.parse(JSON.stringify(window['chess'].GAME.history({ verbose: true })));
            var c = window['chess'].GAME.history().length - 1;
            if (HISTORY[c]) {
              var from = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c].from))
              var to = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c].to))
              from.classList.add('h-select-cursor');
              to.classList.add('h-select-cursor');
              if (HISTORY[c - 1]) {
                var from = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c - 1].from))
                var to = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c - 1].to))
                from.classList.remove('h-select-cursor');
                to.classList.remove('h-select-cursor');
              }
            }
          }
          var a = document.getElementsByClassName('kui-router-m-top')
          a[0].style.marginTop = '0px'
        },
        unmounted: function() {
          window['chess'].WORKER.terminate()
          var a = document.getElementsByClassName('kui-router-m-top')
          a[0].style.marginTop = '28px'
          window['chess'] = null
        },
        methods: {
          minus: function() {},
          reset: function() {},
          plus: function() {},
        },
        softKeyText: { left: '', center: local_game ? 'MOVE' : '', right: local_game ? 'Undo' : '' },
        softKeyListener: {
          left: function() {
            if (!local_game) {
              return
            }
          },
          center: function() {
            if (!local_game) {
              return
            }
            window['chess'].enter()
          },
          right: function() {
            if (!local_game) {
              return
            }
            if (p1.toLowerCase().indexOf('bot') > -1 && p2.toLowerCase().indexOf('bot') > -1)
              return
            HISTORY = JSON.parse(JSON.stringify(window['chess'].GAME.history({ verbose: true })));
            var c = window['chess'].GAME.history().length - 1;
            if (HISTORY[c]) {
              var from = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c].from))
              var to = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c].to))
              from.classList.remove('h-select-cursor');
              to.classList.remove('h-select-cursor');
              if (HISTORY[c - 1]) {
                var from = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c - 1].from))
                var to = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c - 1].to))
                from.classList.add('h-select-cursor');
                to.classList.add('h-select-cursor');
              }
            }
            window['chess'].undo()
          }
        },
        dPadNavListener: {
          arrowUp: function() {
            if (local_game) {
              window['chess'].arrowUp()
            } else {
              window['chess'].loadPGN(pgn);
              var a = document.getElementsByClassName('board-b72b1')[0]
              for(var x=0;x<8;x++) {
                for(var y=0;y<8;y++) {
                  if (a.children[x].children[y]) {
                    a.children[x].children[y].classList.remove('h-select-cursor');
                    a.children[x].children[y].classList.remove('h-select-cursor');
                  }
                }
              }
              var c = window['chess'].GAME.history().length - 1;
              if (HISTORY[c]) {
                var from = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c].from))
                var to = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c].to))
                from.classList.add('h-select-cursor');
                to.classList.add('h-select-cursor');
                if (HISTORY[c - 1]) {
                  var from = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c - 1].from))
                  var to = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c - 1].to))
                  from.classList.remove('h-select-cursor');
                  to.classList.remove('h-select-cursor');
                }
              }
            }
          },
          arrowRight: function() {
            if (local_game) {
              window['chess'].arrowRight()
            } else {
              var c = window['chess'].GAME.history().length;
              if (HISTORY[c]) {
                window['chess'].nextMove(HISTORY[c]);
                var c = window['chess'].GAME.history().length - 1;
                if (HISTORY[c]) {
                  var from = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c].from))
                  var to = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c].to))
                  from.classList.add('h-select-cursor');
                  to.classList.add('h-select-cursor');
                  if (HISTORY[c - 1]) {
                    var from = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c - 1].from))
                    var to = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c - 1].to))
                    from.classList.remove('h-select-cursor');
                    to.classList.remove('h-select-cursor');
                  }
                }
              }
            }
          },
          arrowDown: function() {
            if (local_game) {
              window['chess'].arrowDown()
            } else {
              window['chess'].reset();
              var a = document.getElementsByClassName('board-b72b1')[0]
              for(var x=0;x<8;x++) {
                for(var y=0;y<8;y++) {
                  if (a.children[x].children[y]) {
                    a.children[x].children[y].classList.remove('h-select-cursor');
                    a.children[x].children[y].classList.remove('h-select-cursor');
                  }
                }
              }
              this.dPadNavListener.arrowRight();
            }
          },
          arrowLeft: function() {
            if (local_game) {
              window['chess'].arrowLeft()
            } else {
              window['chess'].undoMove()
              var c = window['chess'].GAME.history().length;
              if (HISTORY[c]) {
                var from = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c].from))
                var to = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c].to))
                from.classList.remove('h-select-cursor');
                to.classList.remove('h-select-cursor');
                if (HISTORY[c - 1]) {
                  var from = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c - 1].from))
                  var to = window['chess'].getPosition(window['chess'].getMoveDOM(HISTORY[c - 1].to))
                  from.classList.add('h-select-cursor');
                  to.classList.add('h-select-cursor');
                }
              }
            }
          },
        },
        backKeyListener: function() {
          if (window['chess'].getFocus()) {
            window['chess'].resetCursor();
            return true;
          }
          this.$router.showDialog('Confirm', 'Are you sure to exit the game ?', null, 'Yes', () => {
            this.$router.pop()
          }, 'No', () => {}, '', () => {}, () => {});
          return true;
        }
      })
    );
  }

  const loadOnlineGame = function ($router, game_id, p1='human', p2='human', pov='white', fen='', local_game = true) {

    var GAME_INIT = true;
    var DRAW_OFFER = false;
    var GAME_STATUS = true;
    var STATE = null;

    var listener = {
      onGameOver: function() {
        var s = document.getElementById('game-status')
        if (window['chess_lichess'].GAME.in_stalemate()) {
          s.innerText = 'Stalemate'
        }
        if (window['chess_lichess'].GAME.in_draw()) {
          s.innerText = 'Draw'
        }
        if (window['chess_lichess'].GAME.in_threefold_repetition()) {
          s.innerText = 'Threefold Repetition'
        }
        if (window['chess_lichess'].GAME.in_checkmate()) {
          s.innerText = 'White Win'
          if (window['chess_lichess'].GAME.turn() === 'w') {
            s.innerText = 'Black Win'
          }
        }
      },
      onCheck: function() {
        var s = document.getElementById('game-status')
        s.innerText = 'Check'
      },
      onTurn: function(color) {
        var p = document.getElementById('player-turn')
        p.innerText = 'White'
        if (color === 'b') {
          p.innerText = 'Black'
        }
        var s = document.getElementById('game-status')
        s.innerText = 'In Progress'
        if (local_game && window['chess_lichess'] != null) {
          var _H = window['chess_lichess'].GAME.history({ verbose: true });
          if (pov[0] === color && _H.length > 1) {
            if (STATE) {
              clearInterval(window['chess_timer']);
              window['chess_timer'] = setInterval(() => {
                STATE[color + 'time'] = STATE[color + 'time'] - 1000;
                document.getElementById('timer').innerText = new Date(STATE[color + 'time']).toISOString().substr(11, 8);
              }, 1000);
            }
          } else {
            if (STATE) {
              document.getElementById('timer').innerText = new Date(STATE[pov[0] + 'time']).toISOString().substr(11, 8);
            }
            clearInterval(window['chess_timer']);
          }
          var c = _H.length - 1;
          if (_H[c]) {
            if (_H[c - 1]) {
              var from = window['chess_lichess'].getPosition(window['chess_lichess'].getMoveDOM(_H[c - 1].from))
              var to = window['chess_lichess'].getPosition(window['chess_lichess'].getMoveDOM(_H[c - 1].to))
              from.classList.remove('h-select-cursor');
              to.classList.remove('h-select-cursor');
            }
            var from = window['chess_lichess'].getPosition(window['chess_lichess'].getMoveDOM(_H[c].from))
            var to = window['chess_lichess'].getPosition(window['chess_lichess'].getMoveDOM(_H[c].to))
            from.classList.add('h-select-cursor');
            to.classList.add('h-select-cursor');
          }
        }
      }
    }

    $router.push(
      new Kai({
        name: 'loadOnlineGame',
        data: {
          title: 'loadOnlineGame',
          mvs: 0
        },
        templateUrl: document.location.origin + '/templates/loadLocalGame.html',
        mounted: function() {
          navigator.spatialNavigationEnabled = false;
          var a = document.getElementsByClassName('kui-router-m-top')
          a[0].style.marginTop = '0px'
          window['chess_stream'] = LICHESS_API.streamBoardState(game_id, this.methods.onStream)
        },
        unmounted: function() {
          var a = document.getElementsByClassName('kui-router-m-top');
          a[0].style.marginTop = '28px';
          if (window['chess_lichess']) {
            window['chess_lichess'].WORKER.terminate();
            window['chess_lichess'] = null;
          }
          if (window['chess_stream'])
            window['chess_stream'][1].abort();
          if (window['chess_timer'])
            clearInterval(window['chess_timer']);
        },
        methods: {
          onStream: function(evt) {
            var logs = parseNdJSON(evt);
            console.log(logs);
            if (logs[0]) {
              if (logs[0].error) {
                console.log(logs);
                $router.pop();
                return
              }
            }
            if (logs.length === 1 && GAME_INIT) {
              k = logs[0];
              localforage.getItem('LICHESS_USER')
              .then((u) => {
                pov = 'black';
                if (k.white.id === u.id) {
                  pov = 'white';
                }
                window['chess_lichess'] = createChessGame(p1, p2, pov, 'container', listener);
                // window['chess_lichess'].loadFEN(fen);
                if (k.state.moves !== '') {
                  STATE = k.state;
                  var mvs = k.state.moves.split(' ');
                  mvs.forEach(m => {
                    window['chess_lichess'].GAME.move(m, { sloppy: true })
                  })
                  // console.log(pov[0], window['chess_lichess'].GAME.turn());
                  window['chess_lichess'].updateGame();
                  this.data.mvs = mvs.length;
                  var _draw = 'wdraw'
                  if (pov == 'white') {
                    _draw = 'bdraw'
                  }
                  DRAW_OFFER = k.state[_draw];
                  if (DRAW_OFFER) {
                    this.$router.setSoftKeyRightText('ACCEPT');
                  } else {
                    this.$router.setSoftKeyRightText('');
                  }
                }
                GAME_INIT = false;
              });
            }
            if (logs.length > 1 && !GAME_INIT) {
              if (logs[logs.length - 1].type === 'gameState') {
                var log = logs[logs.length - 1];
                var mvs = log.moves.split(' ');
                if (this.data.mvs === 0 && log.status === 'started') {
                  STATE = log;
                  window['chess_lichess'].GAME.move(mvs[0], { sloppy: true });
                  window['chess_lichess'].resetCursor();
                  var h = window['chess_lichess'].GAME.history({ verbose: true })
                  if (h.length > 0) {
                    window['chess_lichess'].playSound(h[h.length - 1].flags);
                  }
                }
                if (mvs.length > this.data.mvs) {
                  STATE = log;
                  window['chess_lichess'].GAME.move(mvs[mvs.length - 1], { sloppy: true });
                  window['chess_lichess'].updateGame();
                  window['chess_lichess'].resetCursor();
                  var h = window['chess_lichess'].GAME.history({ verbose: true })
                  if (h.length > 0) {
                    window['chess_lichess'].playSound(h[h.length - 1].flags);
                  }
                  this.data.mvs = mvs.length;
                }
                if (mvs.length > this.data.mvs && log.status === 'started') {
                  if (pov == 'white') {
                    DRAW_OFFER = log['bdraw'];
                  } else if (pov === 'black') {
                    DRAW_OFFER = log['wdraw'];
                  }
                  if (DRAW_OFFER) {
                    this.$router.setSoftKeyRightText('ACCEPT');
                  } else {
                    this.$router.setSoftKeyRightText('');
                  }
                }
                if (log.status === 'draw') {
                  this.$router.setSoftKeyRightText('');
                  DRAW_OFFER = false
                  var s = document.getElementById('game-status')
                  s.innerText = 'Draw'
                  GAME_STATUS = false
                } else if (log.status === 'stalemate') {
                  this.$router.setSoftKeyRightText('');
                  DRAW_OFFER = false
                  var s = document.getElementById('game-status')
                  s.innerText = 'Stalemate'
                  GAME_STATUS = false
                } else if (log.status === 'resign') {
                  this.$router.setSoftKeyRightText('');
                  DRAW_OFFER = false
                  var s = document.getElementById('game-status')
                  s.innerText = `Resign, ${log.winner[0].toUpperCase()} Win`
                  GAME_STATUS = false
                } else if (log.status === 'aborted') {
                  this.$router.setSoftKeyRightText('');
                  DRAW_OFFER = false
                  var s = document.getElementById('game-status')
                  s.innerText = 'Abort'
                  GAME_STATUS = false
                } else if (log.status === 'mate') {
                  this.$router.setSoftKeyRightText('');
                  DRAW_OFFER = false
                  var s = document.getElementById('game-status')
                  s.innerText = `Mate, ${log.winner[0].toUpperCase()} Win`
                  GAME_STATUS = false
                } else if (log.status === 'timeout') {
                  this.$router.setSoftKeyRightText('');
                  DRAW_OFFER = false
                  var s = document.getElementById('game-status')
                  s.innerText = `Timeout, ${log.winner[0].toUpperCase()} Win`
                  GAME_STATUS = false
                } else if (log.status === 'outoftime') {
                  this.$router.setSoftKeyRightText('');
                  DRAW_OFFER = false
                  var s = document.getElementById('game-status')
                  s.innerText = `Outoftime, ${log.winner[0].toUpperCase()} Win`
                  GAME_STATUS = false
                } else if (log.status === 'cheat') {
                  this.$router.setSoftKeyRightText('');
                  DRAW_OFFER = false
                  var s = document.getElementById('game-status')
                  s.innerText = `Cheat, ${log.winner[0].toUpperCase()} Win`
                  GAME_STATUS = false
                } else if (log.status === 'noStart') {
                  this.$router.setSoftKeyRightText('');
                  DRAW_OFFER = false
                  var s = document.getElementById('game-status')
                  s.innerText = `NoStart, ${log.winner[0].toUpperCase()} Win`
                  GAME_STATUS = false
                } else if (log.status === 'unknownFinish') {
                  this.$router.setSoftKeyRightText('');
                  DRAW_OFFER = false
                  var s = document.getElementById('game-status')
                  s.innerText = `UnknownFinish, ${log.winner[0].toUpperCase()} Win`
                  GAME_STATUS = false
                } else if (log.status === 'variantEnd') {
                  this.$router.setSoftKeyRightText('');
                  DRAW_OFFER = false
                  var s = document.getElementById('game-status')
                  s.innerText = `VariantEnd, ${log.winner[0].toUpperCase()} Win`
                  GAME_STATUS = false
                }
              } else if (logs[logs.length - 1].type === 'chatLine') {
                if (logs[logs.length - 1].username === 'lichess') {
                  if (logs[logs.length - 1].text === 'White offers draw' && pov === 'black' && !DRAW_OFFER) {
                    this.$router.setSoftKeyRightText('ACCEPT');
                    DRAW_OFFER = true
                  } else if (logs[logs.length - 1].text === 'Black offers draw' && pov === 'white' && !DRAW_OFFER) {
                    this.$router.setSoftKeyRightText('ACCEPT');
                    DRAW_OFFER = true
                  } else if (logs[logs.length - 1].text === 'White declines draw') {
                    this.$router.setSoftKeyRightText('');
                    DRAW_OFFER = false
                  } else if (logs[logs.length - 1].text === 'Black declines draw') {
                    this.$router.setSoftKeyRightText('');
                    DRAW_OFFER = false
                  } else if (logs[logs.length - 1].text  === 'Draw offer accepted') {
                    this.$router.setSoftKeyRightText('');
                    DRAW_OFFER = false
                  }
                }
              }
            }
          },
          sendDrawOffer: function(action) {
            this.$router.showLoading();
            LICHESS_API.handleDrawOffers(game_id, action.toLowerCase())[0]
            .finally(() => {
              this.$router.hideLoading();
            });
          }
        },
        softKeyText: { left: local_game ? 'Menu' : '', center: local_game ? 'MOVE' : '', right: '' },
        softKeyListener: {
          left: function() {
            if (!local_game) {
              return
            }
            var menu = []; // { "text": "Save" }
            if (!DRAW_OFFER && GAME_STATUS) {
              menu.push({ "text": "Offer Draw" });
            }
            if (GAME_STATUS) {
              menu.push({ "text": "Resign" });
            }
            if (GAME_STATUS && window['chess_lichess'].GAME.moves().length === 0) {
              menu.push({ "text": "Abort" });
            }
            this.$router.showOptionMenu('Menu', menu, 'Select', (selected) => {
              if (selected.text === "Offer Draw") {
                this.methods.sendDrawOffer('yes');
              } else if (selected.text === "Resign") {
                this.$router.showLoading();
                LICHESS_API.resignGame(game_id)[0]
                .finally(() => {
                  this.$router.hideLoading();
                });
              } else if (selected.text === "Abort") {
                this.$router.showLoading();
                LICHESS_API.abortGame(game_id)[0]
                .finally(() => {
                  this.$router.hideLoading();
                });
              }
            }, () => {}, 0);
          },
          center: function() {
            if (!GAME_STATUS) {
              return
            }
            if (!local_game && pov[0] !== window['chess_lichess'].GAME.turn()) {
              return
            }
            if (window['chess_lichess'].getFocus()) {
              var toMove = `${window['chess_lichess'].getFocusPoint()}${window['chess_lichess'].getPosition(window['chess_lichess'].getMove()).dataset.square}`;
              if (!window['chess_lichess'].GAME.move(toMove, { sloppy: true })) {
                return
              }
              window['chess_lichess'].GAME.undo();
              this.$router.showLoading();
              LICHESS_API.makeBoardmove(game_id, toMove)[0]
              .finally(() => {
                this.$router.hideLoading();
                window['chess_lichess'].resetCursor();
              });
              return
            }
            window['chess_lichess'].enter()
          },
          right: function() {
            if (DRAW_OFFER) {
              var menu = [
                { "text": "Accept", "val": "yes","checked": false },
                { "text": "Decline", "val": "no", "checked": false },
              ];
              this.$router.showOptionMenu('Your opponent offers a draw', menu, 'Select', (selected) => {
                this.methods.sendDrawOffer(selected.val);
              }, () => {
                setTimeout(() => {
                  if (DRAW_OFFER) {
                    this.$router.setSoftKeyRightText('ACCEPT');
                  } else {
                    this.$router.setSoftKeyRightText('');
                  }
                }, 101);
              }, -1);
            }
          }
        },
        dPadNavListener: {
          arrowUp: function() {
            if (!GAME_STATUS) {
              return
            }
            if (local_game && pov[0] === window['chess_lichess'].GAME.turn()) {
              window['chess_lichess'].arrowUp()
            }
          },
          arrowRight: function() {
            if (!GAME_STATUS) {
              return
            }
            if (local_game && pov[0] === window['chess_lichess'].GAME.turn()) {
              window['chess_lichess'].arrowRight()
            }
          },
          arrowDown: function() {
            if (!GAME_STATUS) {
              return
            }
            if (local_game && pov[0] === window['chess_lichess'].GAME.turn()) {
              window['chess_lichess'].arrowDown()
            }
          },
          arrowLeft: function() {
            if (!GAME_STATUS) {
              return
            }
            if (local_game && pov[0] === window['chess_lichess'].GAME.turn()) {
              window['chess_lichess'].arrowLeft()
            }
          },
        },
        backKeyListener: function() {
          if (window['chess_lichess'].getFocus()) {
            window['chess_lichess'].resetCursor();
            return true;
          }
          this.$router.showDialog('Confirm', 'Are you sure to exit the game ?', null, 'Yes', () => {
            this.$router.pop()
          }, 'No', () => {}, '', () => {}, () => {});
          return true;
        }
      })
    );
  }

  const pgnFiles = new Kai({
    name: 'pgnFiles',
    data: {
      title: 'pgnFiles',
      pgns: []
    },
    verticalNavClass: '.pgnFilesNav',
    templateUrl: document.location.origin + '/templates/pgnFiles.html',
    mounted: function() {
      navigator.spatialNavigationEnabled = false;
      this.$router.setHeaderTitle('Load PGN');
      window['__DS__'] = new DataStorage(this.methods.onChange, this.methods.onReady);
    },
    unmounted: function() {
      window['__DS__'].destroy();
    },
    methods: {
      selected: function() {},
      onChange: function(fileRegistry, documentTree, groups) {
        this.methods.runFilter(fileRegistry);
      },
      onReady: function(status) {
        if (status) {
          this.$router.hideLoading();
        } else {
          this.$router.showLoading();
        }
      },
      runFilter: function(fileRegistry) {
        var pgns = []
        fileRegistry.forEach((file) => {
          var n = file.split('/');
          var n1 = n[n.length - 1];
          var n2 = n1.split('.');
          if (n2.length > 1) {
            if (n2[n2.length - 1] === 'pgn') {
              pgns.push({'name': n1, 'path': file});
            }
          }
        });
        this.setData({pgns: pgns});
      }
    },
    softKeyText: { left: '', center: 'SELECT', right: '' },
    softKeyListener: {
      left: function() {},
      center: function() {
        var pgn = this.data.pgns[this.verticalNavIndex];
        if (pgn) {
          window['__DS__'].getFile(pgn.path, (found) => {
            var fr = new FileReader();
            fr.onload = (event) => {
              loadLocalGame(this.$router, pgn.name, 'human', 'human', 'white', event.target.result, false);
            };
            fr.readAsText(found);
          }, (notfound) => {
            console.log(notfound);
          });
        }
      },
      right: function() {}
    },
    dPadNavListener: {
      arrowUp: function() {
        this.navigateListNav(-1);
      },
      arrowRight: function() {
        //this.navigateTabNav(-1);
      },
      arrowDown: function() {
        this.navigateListNav(1);
      },
      arrowLeft: function() {
        //this.navigateTabNav(1);
      },
    },
    backKeyListener: function() {
      this.components = [];
    }
  });

  const onlineGames = new Kai({
    name: 'onlineGames',
    data: {
      title: 'onlineGames',
      games: []
    },
    verticalNavClass: '.onlineGamesNav',
    templateUrl: document.location.origin + '/templates/onlineGames.html',
    mounted: function() {
      navigator.spatialNavigationEnabled = false;
      this.$router.setHeaderTitle('Ongoing Games');
      this.methods.refresh();
    },
    unmounted: function() {
      this.data.games = []
    },
    methods: {
      selected: function() {},
      refresh: function() {
        if (LICHESS_API == null) {
          return
        }
        this.$router.showLoading();
        LICHESS_API.getOngoingGames()[0]
        .then((r) => {
          if (r.response.nowPlaying.length > 0) {
            this.setData({games: r.response.nowPlaying});
            this.$router.setSoftKeyCenterText('SELECT');
          } else {
            this.setData({games: []});
            this.$router.setSoftKeyCenterText('');
          }
        })
        .catch(e => {
          console.log(e);
        })
        .finally(() => {
          this.$router.hideLoading();
        })
      }
    },
    softKeyText: { left: 'Refresh', center: '', right: '' },
    softKeyListener: {
      left: function() {
        this.methods.refresh();
      },
      center: function() {
        var game = this.data.games[this.verticalNavIndex];
        if (game) {
          loadOnlineGame(this.$router, game.gameId, 'human', 'human', game.color, '', true);
        }
      },
      right: function() {}
    },
    dPadNavListener: {
      arrowUp: function() {
        this.navigateListNav(-1);
      },
      arrowRight: function() {
        //this.navigateTabNav(-1);
      },
      arrowDown: function() {
        this.navigateListNav(1);
      },
      arrowLeft: function() {
        //this.navigateTabNav(1);
      },
    },
    backKeyListener: function() {
      this.components = [];
    }
  });

  const vsComputer = new Kai({
    name: 'vsComputer',
    data: {
      title: 'vsComputer',
      isSeek: false,
      level: '1',
      'clock_limit': '',
      'clock_increment': '',
      days: '',
      color: 'random',
      variant: 'standard',
      response: null
    },
    verticalNavClass: '.vsComputerNav',
    templateUrl: document.location.origin + '/templates/vsComputer.html',
    mounted: function() {
      navigator.spatialNavigationEnabled = false;
      this.$router.setHeaderTitle('Challenge Computer');
      if (LICHESS_API == null) {
        return
      }
      window['chess_events'] = LICHESS_API.streamEvents(this.methods.onStream);
    },
    unmounted: function() {
      this.data.isSeek = false;
      this.data.response = null;
      window['chess_events'][1].abort();
    },
    methods: {
      selected: function() {},
      setLevel: function() {
        var menu = [
          { "text": "1", "checked": false },
          { "text": "2", "checked": false },
          { "text": "3", "checked": false },
          { "text": "4", "checked": false },
          { "text": "5", "checked": false },
          { "text": "6", "checked": false },
          { "text": "7", "checked": false },
          { "text": "8", "checked": false }
        ];
        const idx = menu.findIndex((opt) => {
          return opt.text === this.data.level;
        });
        this.$router.showSingleSelector('Level', menu, 'Select', (selected) => {
          this.setData({ level: selected.text });
        }, 'Cancel', null, undefined, idx);
      },
      setColor: function() {
        var menu = [
          { "text": "random", "checked": false },
          { "text": "white", "checked": false },
          { "text": "black", "checked": false }
        ];
        const idx = menu.findIndex((opt) => {
          return opt.text === this.data.color;
        });
        this.$router.showSingleSelector('Color', menu, 'Select', (selected) => {
          this.setData({ color: selected.text });
        }, 'Cancel', null, undefined, idx);
      },
      setVariant: function() {
        var menu = [
          { "text": "standard", "checked": false },
          { "text": "chess960", "checked": false },
          { "text": "crazyhouse", "checked": false },
          { "text": "antichess", "checked": false },
          { "text": "atomic", "checked": false },
          { "text": "horde", "checked": false },
          { "text": "kingOfTheHill", "checked": false },
          { "text": "racingKings", "checked": false },
          { "text": "threeCheck", "checked": false }
        ];
        const idx = menu.findIndex((opt) => {
          return opt.text === this.data.variant;
        });
        this.$router.showSingleSelector('Color', menu, 'Select', (selected) => {
          this.setData({ variant: selected.text });
        }, 'Cancel', null, undefined, idx);
      },
      submit: function() {
        if (this.data.isSeek) {
          return
        }
        this.data['clock_limit'] = document.getElementById('clock_limit').value;
        this.data['clock_increment'] = document.getElementById('clock_increment').value;
        this.data['days'] = document.getElementById('days').value;
        var opts = {
          level: this.data.level,
          'clock.limit': this.data['clock_limit'] === '' ? '' :parseInt(this.data['clock_limit']) * 60,
          'clock.increment': this.data['clock_increment'] === '' ? '' :parseInt(this.data['clock_increment']),
          days: this.data.days,
          color: this.data.color,
          variant: this.data.variant
        }
        console.log(opts);
        if (opts['clock_limit'] < 480) {
          this.$router.showToast('Minimum 8m');
          return
        }
        this.data.isSeek = true;
        this.$router.showLoading();
        if (LICHESS_API) {
          LICHESS_API.challengeAI(opts)[0]
          .then((res) => {
            this.data.response = res.response;
          })
          .catch((e) => {
            console.log(e);
            this.$router.showToast('Error');
            this.$router.hideLoading();
            this.data.isSeek = false;
          });
        }
      },
      onStream: function(evt) {
        var logs = parseNdJSON(evt);
        logs.forEach((log) => {
          if (log.type === 'gameStart') {
            if (this.data.response) {
              if (log.game.id === this.data.response.id) {
                this.$router.showToast(log.type);
                window['chess_events'][1].abort();
                this.$router.hideLoading();
                this.data.isSeek = false;
                loadOnlineGame(this.$router, this.data.response.id, 'human', 'human', this.data.response.player, '', true);
              }
            }
          } else if (log.type === 'challengeDeclined' || log.type === 'challengeCanceled') {
            if (this.data.response) {
              if (log.game.id === this.data.response.id) {
                this.$router.showToast(log.type);
                this.data.isSeek = false;
                this.data.response = null;
              }
            }
          }
        });
      }
    },
    softKeyText: { left: '', center: '', right: '' },
    softKeyListener: {
      left: function() {
      },
      center: function() {
        const listNav = document.querySelectorAll(this.verticalNavClass);
        if (this.verticalNavIndex > -1) {
          if (listNav[this.verticalNavIndex]) {
            listNav[this.verticalNavIndex].click();
          }
        }
      },
      right: function() {}
    },
    dPadNavListener: {
      arrowUp: function() {
        this.navigateListNav(-1);
      },
      arrowRight: function() {
        //this.navigateTabNav(-1);
      },
      arrowDown: function() {
        this.navigateListNav(1);
      },
      arrowLeft: function() {
        //this.navigateTabNav(1);
      },
    }
  });

  const vsHuman = new Kai({
    name: 'vsHuman',
    data: {
      title: 'vsHuman',
      isPending: false,
      username: '',
      rated: 'false',
      'clock_limit': '',
      'clock_increment': '',
      days: '',
      color: 'random',
      variant: 'standard',
      response: null
    },
    verticalNavClass: '.vsHumanNav',
    templateUrl: document.location.origin + '/templates/vsHuman.html',
    mounted: function() {
      navigator.spatialNavigationEnabled = false;
      this.$router.setHeaderTitle('Challenge Human');
      if (LICHESS_API == null) {
        return
      }
      window['chess_events'] = LICHESS_API.streamEvents(this.methods.onStream);
    },
    unmounted: function() {
      this.data.isPending = false;
      this.data.response = null;
      window['chess_events'][1].abort();
    },
    methods: {
      selected: function() {},
      setRated: function() {
        var menu = [
          { "text": "false", "checked": false },
          { "text": "true", "checked": false }
        ];
        const idx = menu.findIndex((opt) => {
          return opt.text === this.data.rated;
        });
        this.$router.showSingleSelector('Rated', menu, 'Select', (selected) => {
          this.setData({ rated: selected.text });
        }, 'Cancel', null, undefined, idx);
      },
      setColor: function() {
        var menu = [
          { "text": "random", "checked": false },
          { "text": "white", "checked": false },
          { "text": "black", "checked": false }
        ];
        const idx = menu.findIndex((opt) => {
          return opt.text === this.data.color;
        });
        this.$router.showSingleSelector('Color', menu, 'Select', (selected) => {
          this.setData({ color: selected.text });
        }, 'Cancel', null, undefined, idx);
      },
      setVariant: function() {
        var menu = [
          { "text": "standard", "checked": false },
          { "text": "chess960", "checked": false },
          { "text": "crazyhouse", "checked": false },
          { "text": "antichess", "checked": false },
          { "text": "atomic", "checked": false },
          { "text": "horde", "checked": false },
          { "text": "kingOfTheHill", "checked": false },
          { "text": "racingKings", "checked": false },
          { "text": "threeCheck", "checked": false }
        ];
        const idx = menu.findIndex((opt) => {
          return opt.text === this.data.variant;
        });
        this.$router.showSingleSelector('Color', menu, 'Select', (selected) => {
          this.setData({ variant: selected.text });
        }, 'Cancel', null, undefined, idx);
      },
      submit: function() {
        if (this.data.isPending) {
          return
        }
        this.data.username = document.getElementById('username').value;
        this.data['clock_limit'] = document.getElementById('clock_limit').value;
        this.data['clock_increment'] = document.getElementById('clock_increment').value;
        this.data['days'] = document.getElementById('days').value;
        var opts = {
          rated: JSON.parse(this.data.rated),
          'clock.limit': this.data['clock_limit'] === '' ? '' :parseInt(this.data['clock_limit']) * 60,
          'clock.increment': this.data['clock_increment'] === '' ? '' :parseInt(this.data['clock_increment']),
          days: this.data.days,
          color: this.data.color,
          variant: this.data.variant
        }
        console.log(this.data.username, opts);
        if (opts['clock_limit'] < 480) {
          this.$router.showToast('Minimum 8m');
          return
        }
        this.$router.showLoading();
        if (LICHESS_API) {
          LICHESS_API.createChallenge(this.data.username, opts)[0]
          .then((res) => {
            this.data.response = res.response;
            this.data.isPending = true;
            this.$router.setSoftKeyLeftText('Cancel');
          })
          .catch((e) => {
            console.log(e);
            this.$router.showToast('Error');
          })
          .finally(() => {
            this.$router.hideLoading();
          });
        }
      },
      onStream: function(evt) {
        var logs = parseNdJSON(evt);
        logs.forEach((log) => {
          if (log.type === 'gameStart') {
            if (this.data.response) {
              if (log.game.id === this.data.response.challenge.id) {
                this.$router.setSoftKeyLeftText('');
                this.$router.showToast(log.type);
                window['chess_events'][1].abort();
                loadOnlineGame(this.$router, this.data.response.id, 'human', 'human', this.data.response.player, '', true);
              }
            }
          } else if (log.type === 'challengeDeclined' || log.type === 'challengeCanceled') {
            if (this.data.response) {
              if (log.challenge.id === this.data.response.challenge.id) {
                this.$router.showToast(log.type);
                this.data.isPending = false;
                this.data.response = null;
                this.$router.setSoftKeyLeftText('');
              }
            }
          }
        });
      }
    },
    softKeyText: { left: '', center: '', right: '' },
    softKeyListener: {
      left: function() {
        if (!this.data.isPending) {
          return
        }
        if (this.data.response) {
          this.$router.showLoading();
          LICHESS_API.cancelChallenge(this.data.response.challenge.id)[0]
          .finally(() => {
            this.$router.hideLoading();
          });
        }
      },
      center: function() {
        const listNav = document.querySelectorAll(this.verticalNavClass);
        if (this.verticalNavIndex > -1) {
          if (listNav[this.verticalNavIndex]) {
            listNav[this.verticalNavIndex].click();
          }
        }
      },
      right: function() {}
    },
    dPadNavListener: {
      arrowUp: function() {
        this.navigateListNav(-1);
        if (this.data.isPending) {
          this.$router.setSoftKeyLeftText('Cancel');
        } else {
          this.$router.setSoftKeyLeftText('');
        }
      },
      arrowRight: function() {
        //this.navigateTabNav(-1);
      },
      arrowDown: function() {
        this.navigateListNav(1);
        if (this.data.isPending) {
          this.$router.setSoftKeyLeftText('Cancel');
        } else {
          this.$router.setSoftKeyLeftText('');
        }
      },
      arrowLeft: function() {
        //this.navigateTabNav(1);
      },
    }
  });

  const challengeRequest = new Kai({
    name: 'challengeRequest',
    data: {
      title: 'challengeRequest',
      challenges: [],
      selected: null
    },
    verticalNavClass: '.challengeRequestNav',
    templateUrl: document.location.origin + '/templates/challengeRequest.html',
    mounted: function() {
      navigator.spatialNavigationEnabled = false;
      this.$router.setHeaderTitle('Challenge Requests');
      if (LICHESS_API == null) {
        return
      }
      window['chess_events'] = LICHESS_API.streamEvents(this.methods.onStream);
    },
    unmounted: function() {
      this.data.challenges = [];
      this.data.selected = null;
      window['chess_events'][1].abort();
    },
    methods: {
      onStream: function(evt) {
        var challenges = [];
        var canceled = [];
        var _challenges = [];
        var logs = parseNdJSON(evt);
        console.log(logs);
        var resume = true;
        logs.forEach((log) => {
          if (log.type === 'challenge') {
            challenges.push(log.challenge);
          } else if (log.type === 'challengeCanceled' || log.type === 'challengeDeclined') {
            canceled.push(log.challenge.id);
          } else if (log.type === 'gameStart') {
            if (log.game.id === this.data.selected) {
              resume = false;
              loadOnlineGame(this.$router, log.game.id, 'human', 'human', 'white', '', true);
            }
          }
        });
        if (!resume)
          return
        challenges.forEach((i) => {
          if (canceled.indexOf(i.id) == -1) {
            _challenges.push(i);
          }
        });
        //console.log(_challenges);
        this.setData({challenges: _challenges});
        if (_challenges.length > 0) {
          this.$router.setSoftKeyText('Decline', '', 'Accept');
        } else {
          this.$router.setSoftKeyText('', '', '');
        }
      }
    },
    softKeyText: { left: '', center: '', right: '' },
    softKeyListener: {
      left: function() {
        var challenge = this.data.challenges[this.verticalNavIndex];
        if (challenge) {
          var _id = challenge.id;
          console.log(_id);
          this.$router.showLoading();
          LICHESS_API.declineChallenge(_id)[0]
          .then((r) => {
            //console.log(r);
          })
          .catch((e) => {
            console.log(e);
          })
          .finally(() => {
            this.$router.hideLoading();
          });
        }
      },
      center: function() {},
      right: function() {
        var challenge = this.data.challenges[this.verticalNavIndex];
        if (challenge) {
          this.data.selected = challenge.id;
          console.log(this.data.selected);
          this.$router.showLoading();
          LICHESS_API.acceptChallenge(this.data.selected)[0]
          .then((r) => {
            //console.log(r);
          })
          .catch((e) => {
            console.log(e);
            this.data.selected = null;
          })
          .finally(() => {
            this.$router.hideLoading();
          });
        }
      }
    },
    dPadNavListener: {
      arrowUp: function() {
        this.navigateListNav(-1);
        if (challenges.length > 0) {
          this.$router.setSoftKeyText('Decline', '', 'Accept');
        } else {
          this.$router.setSoftKeyText('', '', '');
        }
      },
      arrowRight: function() {
        //this.navigateTabNav(-1);
      },
      arrowDown: function() {
        this.navigateListNav(1);
        if (challenges.length > 0) {
          this.$router.setSoftKeyText('Decline', '', 'Accept');
        } else {
          this.$router.setSoftKeyText('', '', '');
        }
      },
      arrowLeft: function() {
        //this.navigateTabNav(1);
      },
    }
  });

  const matchmaking = new Kai({
    name: 'matchmaking',
    data: {
      title: 'matchmaking',
      isSearching: false,
      ratingRange: '',
      rated: 'false',
      time: '0',
      increment: '0',
      color: 'random',
      variant: 'standard'
    },
    verticalNavClass: '.matchmakingNav',
    templateUrl: document.location.origin + '/templates/matchmaking.html',
    mounted: function() {
      navigator.spatialNavigationEnabled = false;
      this.$router.setHeaderTitle('Matchmaking');
      if (LICHESS_API == null) {
        return
      }
      window['chess_events'] = LICHESS_API.streamEvents(this.methods.onStream);
    },
    unmounted: function() {
      this.data.isSearching = false;
      window['chess_events'][1].abort();
      if (window['chess_seeking']) {
        window['chess_seeking'][1].abort();
      }
    },
    methods: {
      selected: function() {},
      setRated: function() {
        var menu = [
          { "text": "false", "checked": false },
          { "text": "true", "checked": false }
        ];
        const idx = menu.findIndex((opt) => {
          return opt.text === this.data.rated;
        });
        this.$router.showSingleSelector('Rated', menu, 'Select', (selected) => {
          this.setData({ rated: selected.text });
        }, 'Cancel', null, undefined, idx);
      },
      setColor: function() {
        var menu = [
          { "text": "random", "checked": false },
          { "text": "white", "checked": false },
          { "text": "black", "checked": false }
        ];
        const idx = menu.findIndex((opt) => {
          return opt.text === this.data.color;
        });
        this.$router.showSingleSelector('Color', menu, 'Select', (selected) => {
          this.setData({ color: selected.text });
        }, 'Cancel', null, undefined, idx);
      },
      setVariant: function() {
        var menu = [
          { "text": "standard", "checked": false },
          { "text": "chess960", "checked": false },
          { "text": "crazyhouse", "checked": false },
          { "text": "antichess", "checked": false },
          { "text": "atomic", "checked": false },
          { "text": "horde", "checked": false },
          { "text": "kingOfTheHill", "checked": false },
          { "text": "racingKings", "checked": false },
          { "text": "threeCheck", "checked": false }
        ];
        const idx = menu.findIndex((opt) => {
          return opt.text === this.data.variant;
        });
        this.$router.showSingleSelector('Color', menu, 'Select', (selected) => {
          this.setData({ variant: selected.text });
        }, 'Cancel', null, undefined, idx);
      },
      submit: function() {
        if (this.data.isSearching) {
          return
        }
        this.data.ratingRange = document.getElementById('ratingRange').value;
        this.data.time = document.getElementById('time').value;
        this.data.increment = document.getElementById('increment').value;
        var opts = {
          rated: JSON.parse(this.data.rated),
          time: parseInt(this.data.time),
          increment: parseInt(this.data.increment),
          color: this.data.color,
          variant: this.data.variant,
          ratingRange: this.data.ratingRange
        }
        console.log(opts);
        if (LICHESS_API) {
          this.data.isSearching = true;
          this.$router.showLoading(false);
          this.$router.setSoftKeyLeftText('Cancel');
          window['chess_seeking'] = LICHESS_API.seekChallenge(opts, () => {});
          window['chess_seeking'][0]
          .catch((e) => {
            if (typeof e.response === 'object')
              this.$router.showToast('Error');
            this.$router.hideLoading();
          })
          .finally(() => {
            this.data.isSearching = false;
            this.$router.hideLoading();
            this.$router.setSoftKeyLeftText('');
          })
        }
      },
      onStream: function(evt) {
        var logs = parseNdJSON(evt);
        logs.forEach((log) => {
          //if (log.type === 'gameStart') {
            //if (this.data.response) {
              //if (log.game.id === this.data.response.challenge.id) {
                //this.$router.setSoftKeyLeftText('');
                //this.$router.showToast(log.type);
                //window['chess_events'][1].abort();
                //loadOnlineGame(this.$router, this.data.response.id, 'human', 'human', this.data.response.player, '', true);
              //}
            //}
          //}
        });
      }
    },
    softKeyText: { left: '', center: '', right: '' },
    softKeyListener: {
      left: function() {
        if (!this.data.isSearching) {
          return
        }
        if (window['chess_seeking']) {
          window['chess_seeking'][1].abort();
        }
      },
      center: function() {
        const listNav = document.querySelectorAll(this.verticalNavClass);
        if (this.verticalNavIndex > -1) {
          if (listNav[this.verticalNavIndex]) {
            listNav[this.verticalNavIndex].click();
          }
        }
      },
      right: function() {}
    },
    dPadNavListener: {
      arrowUp: function() {
        this.navigateListNav(-1);
        if (this.data.isSearching) {
          this.$router.setSoftKeyLeftText('Cancel');
        } else {
          this.$router.setSoftKeyLeftText('');
        }
      },
      arrowRight: function() {
        //this.navigateTabNav(-1);
      },
      arrowDown: function() {
        this.navigateListNav(1);
        if (this.data.isSearching) {
          this.$router.setSoftKeyLeftText('Cancel');
        } else {
          this.$router.setSoftKeyLeftText('');
        }
      },
      arrowLeft: function() {
        //this.navigateTabNav(1);
      },
    }
  });

  const homepage = new Kai({
    name: 'homepage',
    data: {
      title: 'homepage',
      LICHESS_ACCESS_TOKEN: null
    },
    templateUrl: document.location.origin + '/templates/homepage.html',
    mounted: function() {
      navigator.spatialNavigationEnabled = false;
      this.$router.setHeaderTitle('K-Chess');
    },
    unmounted: function() {},
    methods: {},
    softKeyText: { left: '', center: 'Menu', right: '' },
    softKeyListener: {
      left: function() {},
      center: function() {
        localforage.getItem('LICHESS_ACCESS_TOKEN')
        .then((res) => {
          var title = 'Menu';
          var menu = [
            { "text": "Help & Support" },
            { "text": "Login Lichess.org" },
            { "text": "Local Game" },
            { "text": "Load PGN" }
          ];
          if (res) {
            menu = [
              { "text": "Help & Support" },
              { "text": "Ongoing Games" },
              { "text": "Matchmaking" },
              { "text": "Challenge Requests" },
              { "text": "Challenge Human" },
              { "text": "Challenge Computer" },
              { "text": "Local Game" },
              { "text": "Load PGN" },
              { "text": "Logout" }
            ];
            LICHESS_API = new Lichess(res.access_token);
            LICHESS_API.me()[0]
            .then((d) => {
              localforage.setItem('LICHESS_USER', d.response);
            });
          }
          this.$router.showOptionMenu(title, menu, 'Select', (selected) => {
            setTimeout(() => {
              if (selected.text === 'Login Lichess.org') {
                loginPage(this.$router);
              } else if (selected.text === 'Ongoing Games') {
                this.$router.push('onlineGames');
              } else if (selected.text === 'Matchmaking') {
                this.$router.push('matchmaking');
              } else if (selected.text === 'Challenge Requests') {
                this.$router.push('challengeRequest');
              } else if (selected.text === 'Challenge Computer') {
                this.$router.push('vsComputer');
              } else if (selected.text === 'Challenge Human') {
                this.$router.push('vsHuman');
              } else if (selected.text === 'Load PGN') {
                this.$router.push('pgnFiles');
              } else if (selected.text === 'Logout') {
                window['TODOIST_API'] = null;
                localforage.removeItem('LICHESS_ACCESS_TOKEN');
                this.verticalNavIndex = 0;
                this.setData({ LICHESS_ACCESS_TOKEN: null });
              } else if (selected.text === 'Sync') {
                
              } else if (selected.text === 'Help & Support') {
                this.$router.push('helpSupportPage');
              } else if (selected.text === 'Local Game') {
                this.$router.push('newLocalGame');
              }
            }, 101);
          }, () => {}, 0);
        })
        .catch((err) => {
          // console.log(err);
        });
      },
      right: function() {}
    },
    backKeyListener: function() {
      return false;
    },
    dPadNavListener: {
      arrowUp: function() {},
      arrowRight: function() {},
      arrowDown: function() {},
      arrowLeft: function() {},
    }
  });

  const router = new KaiRouter({
    title: 'K-Chess',
    routes: {
      'index' : {
        name: 'homepage',
        component: homepage
      },
      'helpSupportPage': {
        name: 'helpSupportPage',
        component: helpSupportPage
      },
      'newLocalGame': {
        name: 'newLocalGame',
        component: newLocalGame
      },
      'pgnFiles': {
        name: 'pgnFiles',
        component: pgnFiles
      },
      'onlineGames': {
        name: 'onlineGames',
        component: onlineGames
      },
      'vsComputer': {
        name: 'vsComputer',
        component: vsComputer
      },
      'vsHuman': {
        name: 'vsHuman',
        component: vsHuman
      },
      'challengeRequest': {
        name: 'challengeRequest',
        component: challengeRequest
      },
      'matchmaking': {
        name: 'matchmaking',
        component: matchmaking
      }
    }
  });

  const app = new Kai({
    name: '_APP_',
    data: {},
    templateUrl: document.location.origin + '/templates/template.html',
    mounted: function() {},
    unmounted: function() {},
    router,
    state
  });

  try {
    app.mount('app');
  } catch(e) {
    // console.log(e);
  }

  IFRAME_TIMER = setInterval(() => {
    if (document.activeElement.tagName === 'IFRAME') {
      navigator.spatialNavigationEnabled = true;
    }
  }, 500);

  function displayKaiAds() {
    getKaiAd({
      publisher: 'ac3140f7-08d6-46d9-aa6f-d861720fba66',
      app: 'k-chess',
      slot: 'kaios',
      onerror: err => console.error(err),
      onready: ad => {
        ad.call('display')
        setTimeout(() => {
          document.body.style.position = '';
        }, 1000);
      }
    })
  }

  displayKaiAds();

  document.addEventListener('visibilitychange', () => {
    if (app.$router.stack.length === 1) {
      setTimeout(() => {
        navigator.spatialNavigationEnabled = false;
      }, 500);
    }

    if (document.activeElement.tagName === 'IFRAME') {
      document.activeElement.blur();
    }
    
    if (document.visibilityState === 'hidden') {
      if (IFRAME_TIMER) {
        clearInterval(IFRAME_TIMER);
      }
    } else if (document.visibilityState === 'visible') {
      displayKaiAds();
      const browser = app.$router.stack[app.$router.stack.length - 1];
      if (browser.name === 'browser') {
        if (document.activeElement.tagName !== 'IFRAME') {
          navigator.spatialNavigationEnabled = true;
        }
      }
      IFRAME_TIMER = setInterval(() => {
        if (document.activeElement.tagName === 'IFRAME') {
          navigator.spatialNavigationEnabled = true;
        }
      }, 500);
    }
  });

});
