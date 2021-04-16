function createChessGame(p1='human', p2='human', pov='white', container, listener = {}) {

  var onGameOver = typeof listener.onGameOver === 'function' ? listener.onGameOver : function(){}
  var onStalemate = typeof listener.onStalemate === 'function' ? listener.onStalemate : function(){}
  var onDraw = typeof listener.onDraw === 'function' ? listener.onDraw : function(){}
  var onCheck = typeof listener.onCheck === 'function' ? listener.onCheck : function(){}
  var onCheckmate = typeof listener.onCheckmate === 'function' ? listener.Checkmate : function(){}
  var onTurn = typeof listener.onTurn === 'function' ? listener.onTurn : function(){}
  var onThreefoldRepetition = typeof listener.onThreefoldRepetition === 'function' ? listener.onThreefoldRepetition : function(){}

  var P1 = p1.split(' ')[0]
  var P2 = p2.split(' ')[0]
  var P1_LVL = p1.split(' ').length > 1 ? JSON.parse(p1.split(' ')[1]) : 0
  var P2_LVL = p2.split(' ').length > 1 ? JSON.parse(p2.split(' ')[1]) : 0
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

  var whiteSquareGrey = '#a9a9a9'
  var blackSquareGrey = '#696969'

  function removeGreySquares () {
    $(`#${container} .square-55d63`).css('background', '')
  }

  function greySquare (square) {
    var $square = $(`#${container} .square-` + square)

    var background = whiteSquareGrey
    if ($square.hasClass('black-3c85d')) {
      background = blackSquareGrey
    }

    $square.css('background', background)
  }

  function onMouseoverSquare (square) {
    var moves = GAME.moves({
      square: square,
      verbose: true
    })
    if (moves.length === 0) return
    greySquare(square)
    for (var i = 0; i < moves.length; i++) {
      greySquare(moves[i].to)
    }
  }

  function onMouseoutSquare (square) {
    removeGreySquares()
  }

  var config = {
    orientation: P1 === 'bot' && P2 === 'human' ? 'black' : POV,
    pieceTheme: '/assets/images/{piece}.png',
    position: 'start'
  }

  var WORKER = new Worker('/worker_ai.js')
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

  function loadFEN(fen) {
    if (GAME.load(fen)) {
      updateGame()
    }
  }

  function loadPGN(pgn) {
    if (GAME.load_pgn(pgn)) {
      updateGame()
    }
  }

  updateGame()

  function makeRandomMove() {
    WORKER.postMessage({pgn: GAME.pgn(), minimaxDepth: (GAME.turn() === 'w' ? P1_LVL : P2_LVL) });
    WORKER.onmessage = (e) => {
      var success = GAME.move(e.data)
      if (success) {
        playSound(success.flags)
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
    }
  }

  function playSound(flags) {
    switch (flags) {
      case 'n':
      case 'b':
      case 'p':
        sound = '/assets/sounds/audio-move.mp3'
        break
      case 'e':
      case 'c':
        sound = '/assets/sounds/audio-capture.mp3'
        break
      case 'k':
      case 'q':
        sound = '/assets/sounds/audio-castling.mp3'
        break
    }
    var audio = new Audio(sound)
    audio.play();
  }

  function nextMove(c) {
    var success = GAME.move(c)
    if (success) {
      playSound(success.flags)
      updateGame()
      resetCursor()
    }
  }

  function undoMove() {
    undo()
  }

  function undo() {
    if (GAME.undo()) {
      playSound('q')
      updateGame()
      resetCursor()
    }
  }

  function getFocus() {
    return FOCUS
  }

  function resetCursor() {
    if (MOVE) {
      var c = getPosition(MOVE)
      c.classList.remove('w-select-cursor')
      c.classList.remove('b-select-cursor')
      onMouseoutSquare(FOCUS_POINT)
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
      const el = getPosition(om);
      if (FOCUS == null) {
        onMouseoutSquare(el.dataset.square)
      }
      el.classList.remove(`${GAME.turn()}-select-cursor`)
    }
    const el = getPosition(nm)
    if (FOCUS == null) {
      onMouseoverSquare(el.dataset.square)
    }
    el.classList.add(`${GAME.turn()}-select-cursor`)
    MOVE = nm
  }

  function getMove(P) {
    var a = document.getElementsByClassName('board-b72b1')[0]
    for(var x=0;x<8;x++) {
      for(var y=0;y<8;y++) {
        if (a.children[x].children[y].dataset.square === P) {
          return [x, y]
        }
      }
    }
  }

  function startCursor() {
    if (POV === 'white') {
      const h = GAME.history({ verbose: true })
      if (GAME.turn() === 'w') {
        if (h.length > 1) {
          return getMove(h[h.length - 2].to);
        }
        return [7, 0]
      } else {
        if (h.length > 2) {
          return getMove(h[h.length - 2].to);
        }
        return [0, 7]
      }
    } else {
      const h = GAME.history({ verbose: true })
      if (GAME.turn() === 'b') {
        if (h.length > 2) {
          return getMove(h[h.length - 2].to);
        }
        return [7, 0]
      } else {
        if (h.length > 1) {
          return getMove(h[h.length - 2].to);
        }
        return [0, 7]
      }
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
          } else if (FOCUS === 'R' || FOCUS === 'r' || FOCUS === 'N' || FOCUS === 'n') {
            command = { from: FOCUS_POINT, to: _to }
          }
        } else if (to.color !== from.color) {
          command = `${FOCUS}x${_to}`
          if (FOCUS === 'R' || FOCUS === 'r' || FOCUS === 'N' || FOCUS === 'n') {
            command = { from: FOCUS_POINT, to: _to, flags: 'c' }
          }
        }
      }
      if (command) {
        var success = GAME.move(command)
        if (success) {
          playSound(success.flags)
          console.log(`Valid`, command)
          if (updateGame() === true) {
            return
          }
          if (GAME.turn() === 'w' && P1 === 'bot') {
            setTimeout(makeRandomMove, 500)
          } else if (GAME.turn() === 'b' && P2 === 'bot') {
            setTimeout(makeRandomMove, 500)
          }
        } else {
          console.log(`Illegal`, command);
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
  
  if (P1 === 'bot' && GAME.turn() === 'w') {
    makeRandomMove()
  } else if (P2 === 'bot' && GAME.turn() === 'b') {
    makeRandomMove()
  }

  return {WORKER, GAME, getFocus, resetCursor, enter, arrowUp, arrowRight, arrowRight, arrowDown, arrowLeft, undo, updateGame, undoMove, nextMove, loadPGN, loadFEN}
}
