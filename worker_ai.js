self.importScripts('/chess.min.js');

onmessage = function(e) {
  if (e.data.pgn !== null && e.data.minimaxDepth >= 0) {
    var minimaxDepth = e.data.minimaxDepth;

    var GAME = new Chess();
    GAME.load_pgn(e.data.pgn);

    // uses the minimax algorithm with alpha beta pruning to caculate the best move
    var calculateBestMove = function() {
      var possibleNextMoves = GAME.moves();
      var bestMove = -9999;
      var bestMoveFound;

      for(var i = 0; i < possibleNextMoves.length; i++) {
        var possibleNextMove = possibleNextMoves[i]
        GAME.move(possibleNextMove);
        var value = minimax(minimaxDepth, -10000, 10000, false);
        GAME.undo();
        if(value >= bestMove) {
          bestMove = value;
          bestMoveFound = possibleNextMove;
        }
      }
      return bestMoveFound;
    };


    // minimax with alhpha-beta pruning and search depth d = 3 levels
    var minimax = function (depth, alpha, beta, isMaximisingPlayer) {
      if (depth === 0) {
          return -evaluateBoard(GAME.board());
      }

      var possibleNextMoves = GAME.moves();
      var numPossibleMoves = possibleNextMoves.length

      if (isMaximisingPlayer) {
        var bestMove = -9999;
        for (var i = 0; i < numPossibleMoves; i++) {
          GAME.move(possibleNextMoves[i]);
          bestMove = Math.max(bestMove, minimax(depth - 1, alpha, beta, !isMaximisingPlayer));
          GAME.undo();
          alpha = Math.max(alpha, bestMove);
          if(beta <= alpha){
            return bestMove;
          }
        }
      } else {
        var bestMove = 9999;
        for (var i = 0; i < numPossibleMoves; i++) {
          GAME.move(possibleNextMoves[i]);
          bestMove = Math.min(bestMove, minimax(depth - 1, alpha, beta, !isMaximisingPlayer));
          GAME.undo();
          beta = Math.min(beta, bestMove);
          if(beta <= alpha){
            return bestMove;
          }
        }
      }

      return bestMove;
    };


    // the evaluation function for minimax
    var evaluateBoard = function (board) {
      var totalEvaluation = 0;
      for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
          totalEvaluation = totalEvaluation + getPieceValue(board[i][j], i, j);
        }
      }
      return totalEvaluation;
    };


    var reverseArray = function(array) {
      return array.slice().reverse();
    };

    var whitePawnEval = [
      [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
      [5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0],
      [1.0,  1.0,  2.0,  3.0,  3.0,  2.0,  1.0,  1.0],
      [0.5,  0.5,  1.0,  2.5,  2.5,  1.0,  0.5,  0.5],
      [0.0,  0.0,  0.0,  2.0,  2.0,  0.0,  0.0,  0.0],
      [0.5, -0.5, -1.0,  0.0,  0.0, -1.0, -0.5,  0.5],
      [0.5,  1.0,  1.0,  -2.0, -2.0,  1.0,  1.0,  0.5],
      [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
    ];

    var blackPawnEval = reverseArray(whitePawnEval);

    var knightEval = [
      [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
      [-4.0, -2.0,  0.0,  0.0,  0.0,  0.0, -2.0, -4.0],
      [-3.0,  0.0,  1.0,  1.5,  1.5,  1.0,  0.0, -3.0],
      [-3.0,  0.5,  1.5,  2.0,  2.0,  1.5,  0.5, -3.0],
      [-3.0,  0.0,  1.5,  2.0,  2.0,  1.5,  0.0, -3.0],
      [-3.0,  0.5,  1.0,  1.5,  1.5,  1.0,  0.5, -3.0],
      [-4.0, -2.0,  0.0,  0.5,  0.5,  0.0, -2.0, -4.0],
      [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
    ];

    var whiteBishopEval = [
      [ -2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
      [ -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
      [ -1.0,  0.0,  0.5,  1.0,  1.0,  0.5,  0.0, -1.0],
      [ -1.0,  0.5,  0.5,  1.0,  1.0,  0.5,  0.5, -1.0],
      [ -1.0,  0.0,  1.0,  1.0,  1.0,  1.0,  0.0, -1.0],
      [ -1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0],
      [ -1.0,  0.5,  0.0,  0.0,  0.0,  0.0,  0.5, -1.0],
      [ -2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
    ];

    var blackBishopEval = reverseArray(whiteBishopEval);

    var whiteRookEval = [
      [  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
      [  0.5,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  0.5],
      [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
      [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
      [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
      [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
      [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
      [  0.0,   0.0, 0.0,  0.5,  0.5,  0.0,  0.0,  0.0]
    ];

    var blackRookEval = reverseArray(whiteRookEval);

    var evalQueen = [
      [ -2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
      [ -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
      [ -1.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
      [ -0.5,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
      [  0.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
      [ -1.0,  0.5,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
      [ -1.0,  0.0,  0.5,  0.0,  0.0,  0.0,  0.0, -1.0],
      [ -2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
    ];

    var whiteKingEval = [
      [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
      [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
      [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
      [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
      [ -2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
      [ -1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
      [  2.0,  2.0,  0.0,  0.0,  0.0,  0.0,  2.0,  2.0 ],
      [  2.0,  3.0,  1.0,  0.0,  0.0,  1.0,  3.0,  2.0 ]
    ];

    var blackKingEval = reverseArray(whiteKingEval);

    var getPieceValue = function (piece, x, y) {
      if (piece === null) {
        return 0;
      }

      var absoluteValue = getAbsoluteValue(piece, piece.color === 'w', x ,y);

      if(piece.color === 'w'){
        return absoluteValue;
      } else {
        return -absoluteValue;
      }
    };

    var getAbsoluteValue = function (piece, isWhite, x ,y) {
      if (piece.type === 'p') {
          return 10 + ( isWhite ? whitePawnEval[y][x] : blackPawnEval[y][x] );
      } else if (piece.type === 'r') {
          return 50 + ( isWhite ? whiteRookEval[y][x] : blackRookEval[y][x] );
      } else if (piece.type === 'n') {
          return 30 + knightEval[y][x];
      } else if (piece.type === 'b') {
          return 30 + ( isWhite ? whiteBishopEval[y][x] : blackBishopEval[y][x] );
      } else if (piece.type === 'q') {
          return 90 + evalQueen[y][x];
      } else if (piece.type === 'k') {
          return 900 + ( isWhite ? whiteKingEval[y][x] : blackKingEval[y][x] );
      }
    };

    postMessage(calculateBestMove());

  }
}
