'use strict';

Quoridor.SIZE = 11;

// size - Number of places where to install wall
// pawns - Number of players
// walls - Number of walls available to each player
// solverCB - callback function(move, rating) called then solver is done
Quoridor.Engine = function(size,pawns,walls,threadsNum)
{
  var SIZE = Quoridor.SIZE;
  var wallh=new Int8Array(SIZE*SIZE),     // walls map
      wallv=new Int8Array(SIZE*SIZE),
      player = 0,
      gameOver = false;

  // init webworker solvers
  var solvers = Quoridor.Engine.workersPool;
  
  var i;
  for(i=solvers.length;i<threadsNum;i++)
    solvers.push(new Worker(Quoridor.Engine.solverURL));
  
  // init board (set perimeter walls)
  for(i=SIZE*SIZE;i>=0;i--)
    wallh[i] = wallv[i] = -1;
  
  for(i=0;i<size;i+=2)
  {
    wallh[i] = 1; wallh[i+1] = 2;           // upper
    wallh[i+(size)*SIZE] = 1; wallh[i+(size)*SIZE+1] = 2;  // bottom
    
    wallv[i*SIZE] = 1; wallv[(i+1)*SIZE] = 2;          // left
    wallv[i*SIZE+(size)] = 1; wallv[(i+1)*SIZE+(size)] = 2;   // right
  }
  
  for(var y=1;y<size;y++)
  {
    for(var x=0;x<size;x++)
      wallh[y*SIZE+x] = 0;
    wallh[y*SIZE+size-1] = -1;
  }
  
  for(var y=0;y<size;y++)
    for(var x=1;x<size;x++)
      wallv[y*SIZE+x] = 0;
  for(var x=1;x<size;x++)
    wallv[(size-1)*SIZE+x] = -1;

  //

  // init players goals
  var goals = [[],[],[],[]];
  for(var y=0;y<size;y++)
  for(var x=0;x<size;x++)
  {
    i = y*SIZE+x;
    if(y==0)
      goals[0][i] = true;
    if(x==size-1)
      goals[1][i] = true;
    if(y==size-1)
      goals[2][i] = true;
    if(x==0)
      goals[3][i] = true;
  }
  
  // init pawns positions
  i = [];
  i.push((size-1)*SIZE+size/2|0);
  
  if(pawns>2)
    i.push((size/2|0)*SIZE);
  
  if(pawns>1)
    i.push((size/2|0)+0*SIZE);
  
  if(pawns>3)
    i.push((size/2|0)*SIZE+size-1);

  if(pawns==2)
    goals[1] = goals[2];
  
  walls = [walls,walls,walls,walls].slice(0,pawns);
  pawns = i;

  // sets hor wall at position p (integer) and returns an unset function
  var setHWall = function(p)
  {
    walls[player]--;
    
    wallh[p] = 1; wallh[p+1] = 2;

    wallh[p-1] = wallh[p-1] || -1;
    wallv[p-SIZE+1] = wallv[p-SIZE+1] || -1;
  };
  
  var setVWall = function(p)
  {
    walls[player]--;
    
    wallv[p] = 1; wallv[p+SIZE] = 2;
  
    wallv[p-SIZE] = wallv[p-SIZE] || -1;
    wallh[p+SIZE-1] = wallh[p+SIZE-1] || -1;
  };
  
  var validMoves = [];
  
  this.makeMove = function(n)
  {
    if(n>=validMoves.length)
      return;
    
    n = validMoves[n];
    
    if('h' in n)
      setHWall(n.h);
    else if('v' in n)
      setVWall(n.v);
    else
      pawns[player] = n.m;

    if(goals[player][pawns[player]])
      gameOver = true;
    else
      player = (player+1)%pawns.length;
  };
  
  this.getState = function()
  {
    return {
      pawns: pawns.slice(),
      walls: walls.slice(),
      wallh: new Int8Array(wallh),
      wallv: new Int8Array(wallv),
      player: player,
      gameOver: gameOver
    };
  };
  
  var slvr = 0;  // solver counter
  
  // player - 0-3, ¹ of player
  // returns {pos | wallH | wallV, rating}
  this.getAvailableMoves = function(level,CB)
  {
    if(slvr)
      throw 'bad operation';
    
    slvr = threadsNum;
    
    var state =
    {
      level: level,
      //wallh: new Int8Array(wallh),
      //wallv: new Int8Array(wallv),
      wallh: wallh,
      wallv: wallv,
      pawns: pawns,
      walls: walls,
      goals: goals,
      player: player,
      n1: slvr
    };
    
    //console.log(JSON.stringify(11 in state.pwallh));
    
    validMoves = [];
    
    var solverResponse = function(e)
    {
      e = e.data;
      
      if(e.done)
        --slvr || CB(e);
      else
        validMoves.push(e),
        CB(JSON.parse(JSON.stringify(e)));
        //console.log(e.n1+','+e.n2);
    };
    
    for(var i=slvr-1;i>=0;i--)
      state.n2 = i,
      solvers[i].onmessage = solverResponse,
      solvers[i].postMessage(state);
  };
}

Quoridor.Engine.workersPool = [];

Quoridor.Engine.worker = function()
{
};

Quoridor.Engine.solverURL = (''+Quoridor.Engine.worker).replace(/(function[^{]*?)?{((.|\n|\r)+)}/,'$2');
Quoridor.Engine.solverURL = URL.createObjectURL(new Blob([Quoridor.Engine.solverURL],{type: 'text/javascript'}));
Quoridor.Engine.solverURL = 'engineWorker.js';








