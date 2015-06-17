"use strict";

Quoridor.Driver = function(size,pawns,walls,levels,threadsNum,names,comps,gui)
{
  var state;
  
  var titleElement = document.querySelector('#title'),
      progressElement = document.querySelector('#progress');

  var timeS = 0;
  
  var engine = new Quoridor.Engine(size,pawns,walls,threadsNum);
  
  var showState = function()
  {
    titleElement.className = 'pawn'+state.player;
    if(state.gameOver)
      titleElement.textContent = names[state.player] + ', you are winner!';
    else  
      titleElement.textContent = '(' + (timeS>=10000 ? Math.round(timeS/1000)+'s' : timeS + 'ms') + ') ' + 
        (comps[state.player] ? names[state.player] + ' computer thinking...' : names[state.player] + ', your turn!');

    gui.setState(state);
    gui.draw();
  };

  var ms2time = function(ms)
  {
    ms /= 1000;
    if(ms>60*60)
      return Math.round(ms/60/60) + 'h';
    else if(ms>60)
      return Math.round(ms/60) + 'm';
    else
      return Math.round(ms) + 's';
  };
  
  var doMove = function()
  {
    showState();

    var bestMove = 0, R = -Infinity;
    var n = 0, available = 0;

    if(state.gameOver)
      return;

    if(comps[state.player])
    {
      progressElement.querySelector('progress').value = 0;
      progressElement.lastChild.textContent = ' estimating...';
      progressElement.style.opacity = 1;
      
      engine.getAvailableMoves    // firstly, get available moves count
      (
        -1,
        function(move)
        {
          if(move.done)
          {
            progressElement.querySelector('progress').max = available;
            
            var time = Infinity;
            timeS = -new Date;
            var mmm=[], mm=[];
      
            engine.getAvailableMoves         // secondly, rate moves
            (
              levels[state.player],
              function(move)
              {
                
                if(move.done)
                {
                  console.log(mm+', jjj: '+move.jjj);
                  
                  timeS += +new Date; 
                  progressElement.style.opacity = 0;
                  
                  //engine.makeMove(bestMove);
                  engine.makeMove(mmm[mmm.length*Math.random()|0]);

                  state = engine.getState();
                  
                  doMove();
                }
                else
                {
                  if(move.rating>R)
                    bestMove = n,
                    mm=[JSON.stringify(move)],
                    mmm=[n],
                    R = move.rating;
                  else if(move.rating==R)
                    bestMove = n,
                    mm.push(JSON.stringify(move)),
                    mmm.push(n);
                  
                  progressElement.querySelector('progress').value = ++n;
                  
                  if(n>threadsNum)
                    time = Math.min(time,(timeS + +new Date)*(available-n)/n),
                    progressElement.lastChild.textContent = ' ~' + ms2time(time) + ' left';
                }
                //document.title = (moves[move] || {}).rating;
              }
            );
          }
          else
            available++;
        }
      );
    }
    else
    {
      // user turn
      
      var moves = [];
      
      engine.getAvailableMoves
      (
        -1,
        function(move)
        {
          if(move.done)
            gui.enableUser(moves);
          else
            moves.push(move);
        }
      );
    }
  };
  
  // move - Number, index in validMoves
  gui.onMove = function(move)
  {
    if(!comps[state.player] && !state.gameOver)
    {
      engine.makeMove(move);
      state = engine.getState();
      gui.disableUser();
      doMove();
    }
  };

  state = engine.getState();
  doMove();

}