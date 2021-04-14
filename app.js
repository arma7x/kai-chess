window.addEventListener('DOMContentLoaded', () => {

  function createGame(p1='bot', p2='bot', pov='white', container, fen='', listener = {}) {

    var onGameOver = typeof listener.onGameOver === 'function' ? listener.onGameOver : function(){}
    var onStalemate = typeof listener.onStalemate === 'function' ? listener.onStalemate : function(){}
    var onDraw = typeof listener.onDraw === 'function' ? listener.onDraw : function(){}
    var onCheck = typeof listener.onCheck === 'function' ? listener.onCheck : function(){}
    var onCheckmate = typeof listener.onCheckmate === 'function' ? listener.Checkmate : function(){}
    var onTurn = typeof listener.onTurn === 'function' ? listener.onTurn : function(){}
    var onThreefoldRepetition = typeof listener.onThreefoldRepetition === 'function' ? listener.onThreefoldRepetition : function(){}

    var P1 = p1
    var P2 = p2
    var POV = pov
    var XAXIS = 'abcdefgh'
    var I_XAXIS = 'hgfedcba'
    var I_YAXIS = [1,2,3,4,5,6,7,8]
    var BOARD = null
    var GAME = new Chess()
    var MOVE = null // y, x
    var FOCUS = null
    var FOCUS_POINT = null
    var FOCUS_DOM = null

    var config = {
      orientation: P1 === 'bot' && P2 === 'human' ? 'black' : POV,
      pieceTheme: '/assets/images/{piece}.png',
      position: 'start'
    }

    BOARD = Chessboard('container', config)

    function getPosition(m) {
      var a = document.getElementsByClassName('board-b72b1')[0]
      var b = a.children[m[0]]
      var c = b.children[m[1]]
      return c
    }

    function updateGame() {
      BOARD.position(GAME.fen())
      if (onTurn) {
        onTurn(GAME.turn())
      }
      if (GAME.in_stalemate()) {
        if (onStalemate)
          onStalemate();
      }
      if (GAME.in_draw()) {
        if (onDraw)
          onDraw()
      }
      if (GAME.in_threefold_repetition()) {
        if (onThreefoldRepetition)
          onThreefoldRepetition()
      }
      if (GAME.in_checkmate()) {
        if (onCheckmate)
          onCheckmate()
      } else if (GAME.in_check()) {
        if (onCheck)
          onCheck()
      }
      if (GAME.game_over()) {
        if (onGameOver)
          onGameOver()
        return true
      }
    }

    updateGame()

    function makeRandomMove() {
      var possibleMoves = GAME.moves()
      var randomIdx = Math.floor(Math.random() * possibleMoves.length)
      GAME.move(possibleMoves[randomIdx])
      if (updateGame() === true) {
        return
      }
      if (GAME.turn() === 'w' && P1 === 'bot') {
        setTimeout(makeRandomMove, 500)
      } else if (GAME.turn() === 'b' && P2 === 'bot') {
        setTimeout(makeRandomMove, 500)
      }
      resetCursor()
    }

    function undo() {
      if (GAME.undo()) {
        updateGame()
        if (GAME.undo()) {
          updateGame()
        } else {
          if ((P1 === 'bot' && GAME.turn() === 'w') || (P2 === 'bot' && GAME.turn() === 'b')) {
            setTimeout(makeRandomMove, 500)
          }
        }
        resetCursor()
      }
    }

    function resetCursor() {
      if (MOVE) {
        var c = getPosition(MOVE)
        c.classList.remove('w-select-cursor')
        c.classList.remove('b-select-cursor')
        MOVE = null
        FOCUS = null
        FOCUS_POINT = null
        if (FOCUS_DOM) {
          FOCUS_DOM.classList.remove('select-piece')
        }
        FOCUS_DOM = null
      }
    }

    function moveCursor(om, nm) {
      if (om) {
        getPosition(om).classList.remove(`${GAME.turn()}-select-cursor`)
      }
      getPosition(nm).classList.add(`${GAME.turn()}-select-cursor`)
      MOVE = nm
    }

    function startCursor() {
      if (GAME.turn() === 'w' && POV === 'white') {
        return [7, 0]
      } else if (GAME.turn() === 'b' && POV === 'white') {
        return [0, 7]
      } else if (GAME.turn() === 'w' && POV === 'black') {
        return [0, 7]
      } else if (GAME.turn() === 'b' && POV === 'black') {
        return [7, 0]
      }
      return [7, 0]
    }

    function arrowUp() {
      if (MOVE == null) {
        moveCursor(null, startCursor())
      } else {
        var m = JSON.parse((JSON.stringify(MOVE)));
        var mv = m[0] - 1
        if (mv > -1) {
          m[0] = mv
          moveCursor(MOVE, m);
        }
      }
    }

    function arrowRight() {
      if (MOVE == null) {
        moveCursor(null, startCursor())
      } else {
        var m = JSON.parse((JSON.stringify(MOVE)));
        var mv = m[1] + 1
        if (mv <= 7) {
          m[1] = mv
          moveCursor(MOVE, m);
        }
      }
    }

    function arrowDown() {
      if (MOVE == null) {
        moveCursor(null, startCursor())
      } else {
        var m = JSON.parse((JSON.stringify(MOVE)));
        var mv = m[0] + 1
        if (mv <= 7) {
          m[0] = mv
          moveCursor(MOVE, m);
        }
      }
    }

    function arrowLeft() {
      if (MOVE == null) {
        moveCursor(null, startCursor())
      } else {
        var m = JSON.parse((JSON.stringify(MOVE)));
        var mv = m[1] - 1
        if (mv > -1) {
          m[1] = mv
          moveCursor(MOVE, m);
        }
      }
    }

    function enter() {
      if (FOCUS) {
        var command
        var from = GAME.get(FOCUS_POINT)
        var _to = `${XAXIS[MOVE[1]]}${(8 - MOVE[0])}`
        if (POV === 'black' || (P1 === 'bot' && P2 === 'human')) {
          _to = `${I_XAXIS[MOVE[1]]}${I_YAXIS[MOVE[0]]}`
        }
        var to = GAME.get(_to)
        if (FOCUS == 'p' || FOCUS == 'P') {
          if (to === null) {
            command = `${_to}`
            if (FOCUS_POINT[0] != _to[0]) {
              command = `${FOCUS_POINT[0]}x${_to}` // En passant
            }
          } else if (to.color !== from.color) {
            command = `${FOCUS_POINT[0]}x${_to}`
          }
          if (command) {
            if (command[command.length - 1] === '1' || command[command.length - 1] === '8') {
              command += 'Q' // promotion to Queen
            }
          }
        } else {
          if (to === null) {
            command = `${FOCUS}${_to}`
            if (FOCUS === 'K' || FOCUS === 'k') { // Castling
              if (FOCUS_POINT === 'e1' && _to === 'g1') {
                command = `O-O` // kingside castling
              } else if (FOCUS_POINT === 'e1' && _to === 'c1') {
                command = `O-O-O` // queenside castling
              } else if (FOCUS_POINT === 'e8' && _to === 'g8') {
                command = `O-O` // kingside castling
              } else if (FOCUS_POINT === 'e8' && _to === 'c8') {
                command = `O-O-O` // queenside castling
              }
            }
          } else if (to.color !== from.color) {
            command = `${FOCUS}x${_to}`
          }
        }
        if (command) {
          if (GAME.move(command)) {
            if (updateGame() === true) {
              return
            }
            if (GAME.turn() === 'w' && P1 === 'bot') {
              setTimeout(makeRandomMove, 500)
            } else if (GAME.turn() === 'b' && P2 === 'bot') {
              setTimeout(makeRandomMove, 500)
            }
          } else {
            console.log('Illegal');
          }
        }
        resetCursor()
      } else if (MOVE) {
        var c = GAME.get(getPosition(MOVE).dataset.square)
        if (c) {
          FOCUS = c.type.toUpperCase()
          FOCUS_POINT = getPosition(MOVE).dataset.square
          FOCUS_DOM = getPosition(MOVE)
          FOCUS_DOM.classList.add('select-piece')
        }
      }
    }
    
    if (P1 === 'bot') {
      makeRandomMove()
    }

    return {GAME, resetCursor, enter, arrowUp, arrowRight, arrowRight, arrowDown, arrowLeft, undo, updateGame}
  }

  var listener = {
    onGameOver: function() {
      console.log('onGameOver')
    },
    onStalemate: function(){
      console.log('onStalemate')
    },
    onDraw: function() {
      console.log('onDraw')
    },
    onCheck: function() {
      console.log('onCheck')
    },
    onCheckmate: function() {
      console.log('onCheckmate')
    },
    onTurn: function(color) {
      console.log('onTurn', color)
    },
    onThreefoldRepetition: function() {
      console.log('onThreefoldRepetition')
    }
  }

  window['chess'] = createGame('bot', 'bot', 'white', 'container', '', listener)

  document.addEventListener('keydown', (evt) => {
    switch (evt.key) {
      case 'z':
      case 'Z':
        window['chess'].undo()
        break
      case 'Backspace':
        window['chess'].resetCursor()
        break
      case 'Enter':
        window['chess'].enter()
        break
      case 'ArrowUp':
        window['chess'].arrowUp()
        break;
      case 'ArrowRight':
        window['chess'].arrowRight()
        break;
      case 'ArrowDown':
        window['chess'].arrowDown()
        break;
      case 'ArrowLeft':
        window['chess'].arrowLeft()
        break;
    }
  })

});
