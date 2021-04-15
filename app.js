window.addEventListener("load", function() {

  localforage.setDriver(localforage.LOCALSTORAGE);

  const CLIENT_ID = "37243c41f091443492812b2782548508";
  const SCOPE = 'task:add,data:read,data:read_write,data:delete,project:delete';
  var IFRAME_TIMER;

  const state = new KaiState({
    'TODOIST_SYNC': {},
  });

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
    template: `<div style="padding:4px;"><style>.kui-software-key{height:0px}</style>
      <h5>Premium features are not available(maybe implemented on next update):</h5>
      <ul>
        <li>1. Backups</li>
        <li>2. Archive a project</li>
        <li>3. Unarchive a project</li>
        <li>4. Filters</li>
        <li>5. Label</li>
        <li>6. User settings</li>
        <li>7. Templates</li>
        <li>8. Reminders</li>
        <li>9. Get all completed items(Task)</li>
        <li>10. Project Notes(Project Comment)</li>
        <li>11. Item Notes(Task Comment)</li>
      </ul>
    </div>`,
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

    var salt = window.crypto.getRandomValues(new Uint32Array(10))[0].toString();
    const hashids2 = new Hashids(salt, 15);
    const random = hashids2.encode(1);
    var url = `https://todoist.com/oauth/authorize?client_id=${CLIENT_ID}&scope=${SCOPE}&state=${random}`
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
          if (e.detail.url.indexOf('https://malaysiaapi.herokuapp.com/todoist/api/v1/redirect') > -1) {
            // console.log(window['loginTab'].url.url);
            const codeToken = getURLParam('code', window['loginTab'].url.url);
            const stateToken = getURLParam('state', window['loginTab'].url.url);
            if (codeToken.length > 0 && stateToken.length > 0) {
              setTimeout(() => {
                var oauthAuthorize = new XMLHttpRequest({ mozSystem: true });
                oauthAuthorize.open('GET', 'https://malaysiaapi.herokuapp.com/todoist/api/v1/exchange_token?code=' + codeToken[0], true);
                oauthAuthorize.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                oauthAuthorize.setRequestHeader("X-Accept", 'application/json');
                oauthAuthorize.onreadystatechange = function() {
                  if(oauthAuthorize.readyState == 4 && oauthAuthorize.status == 200) {
                    if (oauthAuthorize.response) {
                      var obj = JSON.parse(oauthAuthorize.response);
                      localforage.setItem('TODOIST_ACCESS_TOKEN', obj.data)
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

  const newOfflineGame = new Kai({
    name: 'newOfflineGame',
    data: {
      title: '',
      p1: 'Human',
      p1Lvl: 0,
      p2: 'Human',
      p2Lvl: 0,
      pov: 'White',
    },
    verticalNavClass: '.newOfflineGameNav',
    templateUrl: document.location.origin + '/templates/newOfflineGame.html',
    mounted: function() {
      this.$router.setHeaderTitle('Offline Game');
      navigator.spatialNavigationEnabled = false;
    },
    unmounted: function() {},
    methods: {
      setWhitePlayer: function() {
        var menu = [
          { "text": "Human", "checked": false },
          { "text": "Bot", "checked": false },
          //{ "text": "Bot 1", "lvl": 0, "checked": false },
          //{ "text": "Bot 2", "lvl": 1, "checked": false },
          //{ "text": "Bot 3", "lvl": 2, "checked": false }
        ];
        const idx = menu.findIndex((opt) => {
          return opt.text === this.data.p1;
        });
        this.$router.showSingleSelector('White', menu, 'Select', (selected) => {
          this.setData({ p1: selected.text });
          if (selected.lvl) {
            this.setData({ p1Lvl: selected.lvl });
          }
        }, 'Cancel', null, undefined, idx);
      },
      setBlackPlayer: function() {
        var menu = [
          { "text": "Human", "checked": false },
          { "text": "Bot", "checked": false },
          //{ "text": "Bot 1", "lvl": 0, "checked": false },
          //{ "text": "Bot 2", "lvl": 1, "checked": false },
          //{ "text": "Bot 3", "lvl": 2, "checked": false }
        ];
        const idx = menu.findIndex((opt) => {
          return opt.text === this.data.p2;
        });
        this.$router.showSingleSelector('Black', menu, 'Select', (selected) => {
          this.setData({ p2: selected.text });
          if (selected.lvl) {
            this.setData({ p2Lvl: selected.lvl });
          }
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
        createOfflineGame(this.$router, this.data.p1.toLowerCase().split(' ')[0], this.data.p2.toLowerCase().split(' ')[0], this.data.pov.toLowerCase(), null);
      }
    },
    softKeyInputFocusText: { left: 'Done', center: '', right: '' },
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

  const createOfflineGame = function ($router, p1='bot', p2='bot', pov='white', container, listener = {}) {
    $router.push(
      new Kai({
        name: 'createOfflineGame',
        data: {
          title: 'createOfflineGame',
          counter: -1,
        },
        verticalNavClass: '.createOfflineGameNav',
        templateUrl: document.location.origin + '/templates/createOfflineGame.html',
        mounted: function() {
          var listener = {
            onGameOver: function() {
              var s = document.getElementById('game-status')
              if (window['chess'].GAME.in_stalemate() || window['chess'].GAME.in_draw() || window['chess'].GAME.in_threefold_repetition()) {
                s.innerText = 'Draw'
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
            }
          }
          window['chess'] = createChessGame(p1, p2, pov, 'container', listener)
          var a = document.getElementsByClassName('kui-router-m-top')
          a[0].style.marginTop = '0px'
          //a[0].classList.add('kui-router-m-top-0')
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
        softKeyText: { left: 'Menu', center: 'MOVE', right: '' },
        softKeyListener: {
          left: function() {},
          center: function() {
            window['chess'].enter()
          },
          right: function() {}
        },
        dPadNavListener: {
          arrowUp: function() {
            window['chess'].arrowUp()
          },
          arrowRight: function() {
            window['chess'].arrowRight()
          },
          arrowDown: function() {
            window['chess'].arrowDown()
          },
          arrowLeft: function() {
            window['chess'].arrowLeft()
          },
        },
        backKeyListener: function() {
          this.$router.showDialog('Confirm', 'Are you sure to exit game ?', null, 'Yes', () => {
            this.$router.pop()
          }, 'No', () => {}, '', () => {}, () => {});
          return true;
        }
      })
    );
  }

  const homepage = new Kai({
    name: 'homepage',
    data: {
      title: 'homepage',
      offset: -1,
      projects: [],
      projectsVerticalNavIndexID: 0,
      empty: true,
      TODOIST_ACCESS_TOKEN: null
    },
    verticalNavClass: '.homepageNav',
    templateUrl: document.location.origin + '/templates/homepage.html',
    mounted: function() {
      navigator.spatialNavigationEnabled = false;
      this.$router.setHeaderTitle('K-Chess');
      this.$state.addStateListener('TODOIST_SYNC', this.methods.listenStateSync);
    },
    unmounted: function() {
      this.$state.removeStateListener('TODOIST_SYNC', this.methods.listenStateSync);
    },
    methods: {
      listenStateSync: function(data) {
        this.setData({ projects: projects, empty: (projects.length === 0 ? true : false) });
      },
      toggleSoftKeyText: function() {
        setTimeout(() => {
          if (!this.$router.bottomSheet) {
            if (this.data.projects.length > 0) {
              this.$router.setSoftKeyText('Menu', '', 'More');
            } else {
              this.$router.setSoftKeyText('Menu', '', '');
            }
          }
        }, 100);
      },
    },
    softKeyText: { left: 'Menu', center: '', right: '' },
    softKeyListener: {
      left: function() {
        localforage.getItem('TODOIST_ACCESS_TOKEN')
        .then((res) => {
          var title = 'Menu';
          var menu = [
            { "text": "Help & Support" },
            { "text": "Offline Game" },
            { "text": "Login" }
          ];
          if (res) {
            menu = [
              { "text": "Help & Support" },
              { "text": "Offline Game" },
              { "text": "Logout" }
            ];
          }
          this.$router.showOptionMenu(title, menu, 'Select', (selected) => {
            setTimeout(() => {
              if (selected.text === 'Login') {
                // loginPage(this.$router);
              } else if (selected.text === 'Add Project') {
                
              } else if (selected.text === 'Logout') {
                window['TODOIST_API'] = null;
                localforage.removeItem('TODOIST_ACCESS_TOKEN');
                localforage.removeItem('TODOIST_SYNC');
                this.verticalNavIndex = 0;
                this.setData({ TODOIST_ACCESS_TOKEN: null });
                this.setData({ projects: [], offset: -1 });
                this.$router.setSoftKeyText('Menu', '', '');
              } else if (selected.text === 'Sync') {
                
              } else if (selected.text === 'Help & Support') {
                this.$router.push('helpSupportPage');
              } else if (selected.text === 'Offline Game') {
                this.$router.push('newOfflineGame');
              }
            }, 101);
          }, () => {
            this.methods.toggleSoftKeyText();
          }, 0);
        })
        .catch((err) => {
          // console.log(err);
        });
      },
      center: function() {
        //if (this.verticalNavIndex > -1) {
        //  const nav = document.querySelectorAll(this.verticalNavClass);
        //  nav[this.verticalNavIndex].click();
        //}
      },
      right: function() {
        var proj = this.data.projects[this.verticalNavIndex];
        if (proj) {
          var title = 'Options';
          var menu = [
            { "text": "Show Tasks" },
            { "text": "Show Sections" },
            { "text": "Edit Project" },
            { "text": "Delete Project" }
          ];
          this.$router.showOptionMenu(title, menu, 'Select', (selected) => {
            setTimeout(() => {
              if (selected.text === 'Show Tasks') {
                
              } else if (selected.text === 'Show Sections') {
                
              } else if (selected.text === 'Edit Project') {
                
              } else if (selected.text === 'Delete Project') {
                
              }
            }, 101);
          }, () => {
            this.methods.toggleSoftKeyText();
          }, 0);
        }
      }
    },
    backKeyListener: function() {
      return false;
    },
    dPadNavListener: {
      arrowUp: function() {
        if (this.verticalNavIndex === 0 || this.data.projects.length === 0) {
          return;
        }
        this.navigateListNav(-1);
      },
      arrowRight: function() {},
      arrowDown: function() {
        if (this.verticalNavIndex === (this.data.projects.length - 1)  || this.data.projects.length === 0) {
          return;
        }
        this.navigateListNav(1);
      },
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
      'newOfflineGame': {
        name: 'newOfflineGame',
        component: newOfflineGame
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

  getKaiAd({
    publisher: 'ac3140f7-08d6-46d9-aa6f-d861720fba66',
    app: 'k-chess',
    slot: 'kaios',
    onerror: err => console.error(err),
    onready: ad => {
      ad.call('display')
    }
  })

});
