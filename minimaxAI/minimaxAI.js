window.addEventListener('load', function() {
    var engine = window.TTTEngine;
    // AI Class:
    var ai = {
        /**
         * Run the main AI logic function.
         *
         * @param {Function} callback
         */
        run: function(callback) {
            var copyBoard = engine.getGameObjects();
            var myType = engine.turn;
            var bestMove = this.minimax(copyBoard, 2, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, myType);
            console.log(bestMove[0]);
            var x = bestMove[1][0];
            var y = bestMove[1][1];
            callback([x,y]);
        },

        /**
         * Find all empty cells in a given board
         * @param  {[type]} board [description]
         * @return {[type]}       [description]
         */
        findEmptyCells: function(board) {
            var copyBoard = this.makeBoardCopy(board);
            var emptyCells = [];
            var maxX = Math.floor(engine.boardWidth/engine.boardCellSize);
            var maxY = Math.floor(engine.boardHeight/engine.boardCellSize);
            for (var x = 0; x < maxX; x++ ) {
                // Add all cells of an empty column
                if (!copyBoard.hasOwnProperty(x)) {
                    for (var i = 0; i < maxY; i++) {
                        emptyCells.push([x,i]);
                    }
                    // Go to the next column
                    continue;
                }

                // Add all empty cells of an existing column
                var column = copyBoard[x];
                for (var y = 0; y < maxY; y++) {
                    if (!column.hasOwnProperty(y)) {
                        emptyCells.push([x,y]);
                    }
                }
            }
            return emptyCells;
        },

        /**
         * Find all cells in a given board with a
         * given type.
         * @param  {[type]} board [description]
         * @param  {[type]} type  [description]
         * @return {[type]}       [description]
         */

        findTypeCells: function(board, type) {
            var copyBoard = this.makeBoardCopy(board);
            var typeCells = [];
            var maxX = Math.floor(engine.boardWidth/engine.boardCellSize);
            var maxY = Math.floor(engine.boardHeight/engine.boardCellSize);
            for (var x = 0; x < maxX; x++ ) {
                if (!copyBoard.hasOwnProperty(x)) {
                    // Go to the next column
                    continue;
                }
                // Loop through the column
                var column = copyBoard[x];
                for (var y = 0; y < maxY; y++) {
                    if (!column.hasOwnProperty(y)) {
                        continue;
                    }
                    // Add any cells that match the type
                    if (column[y].type === type) {
                        typeCells.push([x,y]);
                    }
                }
            }
            return typeCells;
        },

        /**
         * Find all empty cells adjacent to an
         * x,y position on the evaluated board.
         *
         * @param  {[type]} board [description]
         * @param  {[type]} x     [description]
         * @param  {[type]} y     [description]
         * @return {[type]}       [description]
         */
        findEmptyAdjacent: function(board, x, y){
            var emptyCells = [];
            var maxX = Math.floor(engine.boardWidth/engine.boardCellSize)-1;
            var maxY = Math.floor(engine.boardHeight/engine.boardCellSize)-1;
            // If the point doesn't exist, return an empty array
            if (!board.hasOwnProperty(x)) {
                return [];
            }
            var column = board[x];
            if (!column.hasOwnProperty(y)) {
                return [];
            }
            var topLeft = [x-1,y-1];
            var topRight = [x+1,y-1];
            var bottomLeft = [x-1,y+1];
            var bottomRight = [x+1,y+1];
            var top = [x,y-1];
            var bottom = [x,y+1];
            var left = [x-1,y];
            var right = [x+1,y];
            // Check boundaries
            if (x+1 > maxX) {
                topRight = [];
                right = [];
                bottomRight = [];
            }
            if (x-1 < 0) {
                topLeft = [];
                left = [];
                bottomLeft = [];
            }
            if (y+1 > maxY) {
                bottomRight = [];
                bottom = [];
                bottomLeft = [];
            }
            if (y-1 < 0) {
                topRight = [];
                top = [];
                topLeft = [];
            }
            // If any of these exist already, then unset them
            if (board.hasOwnProperty(x-1)) {
                if (board[x-1].hasOwnProperty(y)) {
                    left = [];
                }
                if (board[x-1].hasOwnProperty(y+1)){
                    bottomLeft = [];
                }
                if (board[x-1].hasOwnProperty(y-1)) {
                    topLeft = [];
                }
            }
            if (board.hasOwnProperty(x+1)){
                if (board[x+1].hasOwnProperty(y)) {
                    right = [];
                }
                if (board[x+1].hasOwnProperty(y+1)){
                    bottomRight = [];
                }
                if (board[x+1].hasOwnProperty(y-1)) {
                    topRight = [];
                }
            }
            if (board.hasOwnProperty(x)) {
                if (board[x].hasOwnProperty(y+1)){
                    bottom = [];
                }
                if (board[x].hasOwnProperty(y-1)) {
                    top = [];
                }
            }
            // Push the cells to the empty cell array and return
            if (topLeft.length !== 0) emptyCells.push(topLeft);
            if (topRight.length !== 0) emptyCells.push(topRight);
            if (bottomLeft.length !== 0) emptyCells.push(bottomLeft);
            if (bottomRight.length !== 0) emptyCells.push(bottomRight);
            if (top.length !== 0) emptyCells.push(top);
            if (bottom.length !== 0) emptyCells.push(bottom);
            if (left.length !== 0) emptyCells.push(left);
            if (right.length !== 0) emptyCells.push(right);
            return emptyCells;
        },

        /**
         * Find the number of i-length chains
         * found in the column of the board
         *
         * @param  {[type]} board [description]
         * @param  {[type]} type    [description]
         * @param  {[type]} i    [description]
         */
        findIColChain: function(board,type,i,isFive) {
            var copyBoard = this.makeBoardCopy(board);
            var maxX = Math.floor(engine.boardWidth/engine.boardCellSize);
            var maxY = Math.floor(engine.boardHeight/engine.boardCellSize);
            var count = 0;
            // Iterate through the columns of the game board
            for (var x = 0; x < maxX; x++) {
                // Check that the column exists first
                if (!copyBoard.hasOwnProperty(x)) {
                    continue;
                }
                var column = copyBoard[x];
                // spaceFront is a flag indicating whether a space in the front of a chain has been seen
                // sfChainNum is the length of current chain with a space in the front
                // sbChainNum is the length of current chain with a space in the back
                var spaceFront = false;
                var sfChainNum = 0;
                var sbChainNum = 0;
                for (var y = 0; y < maxY; y++){
                    // If we see an empty space, check if sbChainNum is i-length.
                    // Otherwise, check if we've seen a space before so we can start checking for chains with space in front
                    if (!column.hasOwnProperty(y)){
                        if (sbChainNum === i){
                            count++;
                        }
                        sbChainNum = 0;
                        if (!spaceFront){
                            spaceFront = true;
                        }
                        continue;
                    }
                    // Increment sfChainNum if flag has been set and type matches, otherwise reset
                    if (spaceFront) {
                        if(column[y].type === type){
                            sfChainNum++;
                            // If we see an i-length chain, increment count and reset stats
                            if (sfChainNum === i){
                                count++;
                                spaceFront = false;
                                sfChainNum = 0;
                            }
                        }
                        else{
                            spaceFront = false;
                            sfChainNum = 0;
                        }
                    }
                    else {
                        // Increment sbChainNum if it matches the type and reset to 0 if it doesn't
                        if(column[y].type === type){
                            sbChainNum++;
                            if (isFive && sbChainNum === i) {
                                count++;
                                sbChainNum = 0;
                            }
                        }
                        else {
                            sbChainNum = 0;
                        }
                    }
                }
            }
            return count;
        },

        /**
         * Find the number of i-length chains
         * found in the rows of the board
         *
         * @param  {[type]} board [description]
         * @param  {[type]} type    [description]
         * @param  {[type]} i    [description]
         */
        findIRowChain: function(board,type,i,isFive) {
            var copyBoard = this.makeBoardCopy(board);
            var transposeBoard = {};
            var maxX = Math.floor(engine.boardWidth/engine.boardCellSize);
            var maxY = Math.floor(engine.boardHeight/engine.boardCellSize);
            var count;
            // Get transpose of original board
            // Iterate through the columns of the game board
            for (var x = 0; x < maxX; x++) {
                // Check that the column exists
                if (!copyBoard.hasOwnProperty(x)) {
                    continue;
                }
                for (var y = 0; y < maxY; y++){
                    // Check that the cell exists
                    if (copyBoard[x].hasOwnProperty(y)){
                        if (!transposeBoard.hasOwnProperty(y)) {
                            transposeBoard[y] = {};
                        }
                        transposeBoard[y][x] = copyBoard[x][y];
                    }
                }
            }
            count = this.findIColChain(transposeBoard,type,i,isFive);
            return count;
        },

        /**
         * Find the number of i-length diagonal chains
         * going in a downwards direction
         *
         * @param  {[type]} board [description]
         * @param  {[type]} type    [description]
         * @param  {[type]} i    [description]
         */
        findDIDiagChain: function(board,type,i) {
            // Vars to iterate through the boundaries of the board
            var copyBoard = this.makeBoardCopy(board);
            var maxX = Math.floor(engine.boardWidth/engine.boardCellSize);
            var maxY = Math.floor(engine.boardHeight/engine.boardCellSize);
            // Output variable, number of diagonal chains of length i
            var count = 0;
            // Length of potential chains
            // every potential chain will have its own index
            // and every broken chain will have undefined in its own index
            var chainNums = [];
            // Points to check with potential chains
            // pointsToCheck[i] should be the next point to check for chain with chainNums[i] length
            // pointsToCheck[i] will be undefined if chainNums[i] is undefined
            var pointsToCheck = [];
            // Iterate through the columns of the game board
            for (var x = 0; x < maxX; x++) {
                // Check that the column does not exist
                if (!copyBoard.hasOwnProperty(x)) {
                    // Reset all diagonal chain statistics if there are any
                    // because all your diagonal chains are broken now
                    if (chainNums.length !== 0){
                        // This sets all indices to undefined
                        for (var j = 0; j < pointsToCheck.length; j++){
                            delete chainNums[j];
                            delete pointsToCheck[j];
                        }
                    }
                    continue;
                }
                var column = copyBoard[x];
                for (var y = 0; y < maxY; y++){
                    var pointFound = false;
                    // check if the point is a point we're looking for
                    for (var k = 0; k < pointsToCheck.length; k++){
                        // ignore indicies that have been reset
                        if (pointsToCheck[k] === undefined){
                            continue;
                        }
                        var ptcX = pointsToCheck[k][0];
                        var ptcY = pointsToCheck[k][1];
                        if (x === ptcX && y === ptcY){
                            pointFound = true;
                            // If it is a point we're looking for and the cell doesn't exist
                            // that means the chain is broken and we reset the stats for it
                            if (!column.hasOwnProperty(y)){
                                delete chainNums[k];
                                delete pointsToCheck[k];
                                continue;
                            }
                            // Otherwise, add to the appropriate chainNum,
                            // check if chainNum is i and increment count accordingly,
                            // change the next point to check to the next point in the diagonal chain
                            else {
                                if (column[y].type !== type) {
                                    delete chainNums[k];
                                    delete pointsToCheck[k];
                                    continue;
                                }
                                chainNums[k]++;
                                if (chainNums[k] === i){
                                    count++;
                                    delete chainNums[k];
                                    delete pointsToCheck[k];
                                }
                                else{
                                    pointsToCheck[k] = [ptcX + 1,ptcY + 1];
                                }
                            }
                        }
                    }
                    // if it's not a point we were looking for
                    if (!pointFound){
                        // if it doesn't exist, ignore it
                        if (!column.hasOwnProperty(y)){
                            continue;
                        }
                        // otherwise, add it as the start of a potential chain
                        else{
                            if (column[y].type === type) {
                                chainNums.push(1);
                                pointsToCheck.push([x+1,y+1]);
                            }
                        }
                    }
                }
            }
            return count;
        },

        /**
         * Find the number of i-length diagonal chains
         * going in an upwards direction
         *
         * @param  {[type]} board [description]
         * @param  {[type]} type  [description]
         * @param  {[type]} i    [description]
         */
        findUIDiagChain: function(board,type,i) {
            // Vars to iterate through the boundaries of the board
            var copyBoard = this.makeBoardCopy(board);
            var maxX = Math.floor(engine.boardWidth/engine.boardCellSize);
            var maxY = Math.floor(engine.boardHeight/engine.boardCellSize);
            // Output variable, number of diagonal chains of length i
            var count = 0;
            // Horizonally flipped board
            var flipBoard = {};
            for (var x = 0; x < maxX; x++) {
                // Check that the column exists
                if (!copyBoard.hasOwnProperty(x)) {
                    continue;
                }
                for (var y = 0; y < maxY; y++){
                    // Check that the cell exists
                    if (copyBoard[x].hasOwnProperty(y)){
                        if (!flipBoard.hasOwnProperty(maxX-x-1)) {
                            flipBoard[maxX-x-1] = {};
                        }
                        flipBoard[maxX-x-1][y] = copyBoard[x][y];
                    }
                }
            }
            count = this.findDIDiagChain(flipBoard,type,i);
            return count;
        },

        /**
         * Evaluate board function. Determines score using
         * the number of rows and columns that are 1,2,and
         * 3 pieces away from a win state.
         *
         * @param  {Array} Game board to evaluate
         * @return {Integer} Score
         */
        evaluateBoard: function(board, type) {
            var numZeros = this.findIColChain(board,type,5,true) + this.findIRowChain(board,type,5,true) + this.findDIDiagChain(board,type,5) + this.findUIDiagChain(board,type,5);
            var numOnes =  this.findIColChain(board,type,4,true)+ this.findIRowChain(board,type,4,true) + this.findDIDiagChain(board,type,4) + this.findUIDiagChain(board,type,4);
            var numTwos = this.findIColChain(board,type,3,false) + this.findIRowChain(board,type,3,false) + this.findDIDiagChain(board,type,3) + this.findUIDiagChain(board,type,3);
            var numThrees = this.findIColChain(board,type,2,false) + this.findIRowChain(board,type,2,false) + this.findDIDiagChain(board,type,2) + this.findUIDiagChain(board,type,2);
            var numFours = this.findIColChain(board,type,1,false) + this.findIRowChain(board,type,1,false) + this.findDIDiagChain(board,type,1) + this.findUIDiagChain(board,type,1);
            var score = numOnes * 2500.0 + numTwos * 50.0 + numThrees * 5.0 + numFours * 1.0;
            return score;
        },

        // ======================================
        //
        //           Utility Functions
        //
        // ======================================
        // Function to make a list of items unique
        uniq: function(items, key) {
            var set = {};
            return items.filter(function(item) {
            var k = key ? key.apply(item) : item;
                return k in set ? false : set[k] = true;
            });
        },

        // Function to make a hard copy of a given board
        makeBoardCopy: function(board) {
            var copy_board = {};
            // Copy the game board and retun the copy
            for (var x in board) {
                if (!board.hasOwnProperty(x)) {
                    continue;
                }
                copy_board[x] = {};
                for (var y in board[x]) {
                    copy_board[x][y] = board[x][y];
                }
            }
            return copy_board;
        },

        // Function to shuffle an array:
        // "http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array"
        shuffleArray: function(array) {
            for (var i = array.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            return array;
        },

        /**
         * Minimax functon for finding the best move on
         * a given game board
         *
         * @param  {[type]} board [description]
         * @param  {[type]} depth [description]
         * @param  {[type]} alpha [description]
         * @param  {[type]} beta  [description]
         * @param  {  } [varname] [description]
         * @return {[type]}       [description]
         */
        minimax: function(board, depth, alpha, beta, type) {
            var playerPieces = this.findTypeCells(board,type);
            playerPieces = playerPieces.concat(this.findTypeCells(board,1-type));
            var numPieces = playerPieces.length;
            var moves = [];
            if (playerPieces.length !== 0) {
                for (var i = 0; i < numPieces; i++) {
                    // Get the x and y values of a player piece
                    var x = playerPieces[i][0];
                    var y = playerPieces[i][1];
                    // Concatenate the empty cells around the piece into the move list
                    moves = moves.concat(this.findEmptyAdjacent(board,x,y));
                }
            }
            // If no good spaces were found, use all empty spaces.
            if (moves.length === 0) {
                moves = this.findEmptyCells(board);
            }
            // Make sure the list of moves is unique and shuffle them
            moves = this.uniq(moves, [].join);
            moves = this.shuffleArray(moves);

            var bestMove = moves[0];
            var result = [alpha,bestMove];
            //========================
            //   Minimax Algorithm
            //========================
            // Base Case:
            if (depth === 0) {
                result = [(this.evaluateBoard(board,type)-this.evaluateBoard(board,1-type)),moves.pop()];
                return result;
            }
            // Recursive Case:
            //var temp = [];
            var currentAlpha = alpha;
            while (moves.length > 0) {
                var freshBoard = this.makeBoardCopy(board);
                var testMove = moves.pop();
                // Get the x,y coordinates from the testMove
                var testX = testMove[0];
                var testY = testMove[1];

                // Create new game object.
                var object = new GameObject();
                object.type = type;

                // Add it to the fresh game board
                if (freshBoard[testX] === undefined) {
                    freshBoard[testX] = {};
                }
                freshBoard[testX][testY] = object;
                // Go down the minimax tree and get the results
                var temp = this.minimax(freshBoard, depth-1, -beta, -currentAlpha, 1-type);
                var tempScore = -temp[0];

                // Update the alpha values
                if (tempScore > currentAlpha) {
                    currentAlpha = tempScore;
                    bestMove = testMove;
                }
                // Alpha-Beta Pruning
                if (currentAlpha > beta) {
                    result = [currentAlpha,bestMove];
                    return result;
                }
            }
            result = [currentAlpha,bestMove];
            return result;
        }
    };

    engine.addAI('minimaxAI', ai.run, ai);
}, false);
