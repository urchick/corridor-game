  'use strict';

  var jjj;
  var SIZE = 11;  // should be the same as Quoridor.SIZE

function AsmFillModule(std,foreign,memBuf)
{   
  'use asm';
  
  var SIZE = 0;
  
  var wallh = 0,
      wallv = 0,
      brd = 0;

  var mem = new std.Int8Array(memBuf);
  
  function init(SIZE_,wallh_,wallv_,brd_)
  {
    SIZE_ = SIZE_|0;
    wallh_ = wallh_|0;
    wallv_ = wallv_|0;
    brd_ = brd_|0;
    
    SIZE = SIZE_;
    
    wallh = wallh_;
    wallv = wallv_;
    brd = brd_;
  }
  
  function fill(p,n)
  {
    p = p|0;
    n = n|0;

    var brdP = 0;
    brdP = brd+p|0;
    
    mem[brdP] = n;
    n = n+1|0;

    if((mem[wallh+p|0]|0)<=0)
      if((mem[brdP-SIZE|0]|0)>(n|0))
        fill(p-SIZE|0,n);
    
    if((mem[wallh+p+SIZE|0]|0)<=0)
      if((mem[brdP+SIZE|0]|0)>(n|0))
        fill(p+SIZE|0,n);
    
    if((mem[wallv+p|0]|0)<=0)
      if((mem[brdP-1|0]|0)>(n|0))
        fill(p-1|0,n);
    
    if((mem[wallv+p+1|0]|0)<=0)
      if((mem[brdP+1|0]|0)>(n|0))
        fill(p+1|0,n);
  }
  
  return {
           init: init,
           fill: fill
         };

}  
  
  var memBuf = new ArrayBuffer(4096);
  
  var asmFillModule = AsmFillModule(this,{},memBuf);
  
  // init board
  var originalBoard = new Int8Array(SIZE*SIZE);
  for(var i=SIZE*SIZE-1;i>=0;i--)
    originalBoard[i] = 127;
  
  var brd = new Int8Array(memBuf,2048,SIZE*SIZE);
  
  var wallh = new Int8Array(memBuf,0,SIZE*SIZE),
      wallv = new Int8Array(memBuf,1024,SIZE*SIZE),
      pawns, walls, goals,
      player, level;

  var getPlayerLength = function(player)
  {
    jjj++;
    brd.set(originalBoard);
    
    asmFillModule.fill(pawns[player],0);

    var n = 127;
    
    var goal = goals[player];
    for(var i in goal)
      n = Math.min(n,brd[i]);

    return n<127 ? n : NaN;
  };
  
  // returns rating (Number, may be NaN)
  var solve = function(alpha,beta)
  {
    //alpha = -(beta = Infinity);
    
    var cp = (player+1)%pawns.length,
        i = pawns[player], j;
    
    if(goals[cp][pawns[cp]])
    {
      // the shorter length the greater rating
      return -getPlayerLength(player)+ -10000 + walls[player]-walls[cp];
    }

    if(level<0)
    {
      var my = getPlayerLength(player),
          enemy = getPlayerLength(cp);
      
      return -my + enemy + walls[player] - walls[cp];
    }

    var good = false, bestR = -Infinity;
    
    var rateHWall = function(p)
    {
      if(bestR>=beta)
        return;

      var right = wallh[p+1];
      
      wallh[p] = 1; wallh[p+1] = 2;

      var left = wallh[p-1];
      left || (wallh[p-1] = -1);

      var cross = wallv[p-SIZE+1];
      cross || (wallv[p-SIZE+1] = -1);

      var r = -solve(-beta,-alpha);
      good |= !isNaN(r);
      if(r>bestR)
        bestR=r,
        alpha=Math.max(alpha,bestR);
      
      wallv[p-SIZE+1] = cross;
      wallh[p-1] = left;
      wallh[p+1] = right;
      wallh[p] = 0;
    };
    
    var rateVWall = function(p)
    {
      if(bestR>=beta)
        return;

      var bottom = wallv[p+SIZE];
      
      wallv[p] = 1; wallv[p+SIZE] = 2;

      var up = wallv[p-SIZE];
      up || (wallv[p-SIZE] = -1);

      var cross = wallh[p+SIZE-1];
      cross || (wallh[p+SIZE-1] = -1);
      
      var r = -solve(-beta,-alpha);
      good |= !isNaN(r);
      if(r>bestR)
        bestR=r,
        alpha=Math.max(alpha,bestR);

      wallh[p+SIZE-1] = cross;
      wallv[p-SIZE] = up;
      wallv[p+SIZE] = bottom;
      wallv[p] = 0;
    };

    cp = player;
    player = (player+1)%pawns.length;
    level--;
    
    var ratePawnMove = function(p)
    {
      if(bestR>=beta)
        return;

      var op = pawns[cp];
      pawns[cp] = p;
      var r = -solve(-beta,-alpha);
      pawns[cp] = op;
      
      good |= !isNaN(r);
      if(r>bestR)
        bestR=r,
        alpha=Math.max(alpha,bestR);
    };
    
    // moving up
    if(wallh[i]<=0)
    {
      j = i-SIZE;
      if(pawns.indexOf(j)<0)   // if there is no another pawn
        ratePawnMove(j);
      else
      {
        if(wallh[j]<=0 && pawns.indexOf(j-SIZE)<0)       // try to jump
          ratePawnMove(j-SIZE);
        else
        {
          if(wallv[j]<=0 && pawns.indexOf(j-1)<0)        // up and left
            ratePawnMove(j-1);
          
          if(wallv[j+1]<=0 && pawns.indexOf(j+1)<0)      // up and right
            ratePawnMove(j+1);
        }
      }
    }
      
    // moving down
    j = i+SIZE;
    if(wallh[j]<=0)
    {
      if(pawns.indexOf(j)<0)   // if there is no another pawn
        ratePawnMove(j);
      else
      {
        if(wallh[j+SIZE]<=0 && pawns.indexOf(j+SIZE)<0)       // try to jump
          ratePawnMove(j+SIZE);
        else
        {
          if(wallv[j]<=0 && pawns.indexOf(j-1)<0)        // down and left
            ratePawnMove(j-1);
          
          if(wallv[j+1]<=0 && pawns.indexOf(j+1)<0)      // down and right
            ratePawnMove(j+1);
        }
      }
    }
      
    // moving left
    if(wallv[i]<=0)
    {
      j = i-1;
      if(pawns.indexOf(j)<0)   // if there is no another pawn
        ratePawnMove(j);
      else
      {
        if(wallv[j]<=0 && pawns.indexOf(j-1)<0)       // try to jump
          ratePawnMove(j-1);
        else
        {
          if(wallh[j]<=0 && pawns.indexOf(j-SIZE)<0)     // left & up
            ratePawnMove(j-SIZE);
          
          if(wallh[j+SIZE]<=0 && pawns.indexOf(j+SIZE)<0)      // left & down
            ratePawnMove(j+SIZE);
        }
      }
    }
      
    // moving right
    j = i+1;
    if(wallv[j]<=0)
    {
      if(pawns.indexOf(j)<0)   // if there is no another pawn
        ratePawnMove(j);
      else
      {
        if(wallv[j+1]<=0 && pawns.indexOf(j+1)<0)       // try to jump
          ratePawnMove(j+1);
        else
        {
          if(wallh[j]<=0 && pawns.indexOf(j-SIZE)<0)        // right & up
            ratePawnMove(j-SIZE);
          
          if(wallh[j+SIZE]<=0 && pawns.indexOf(j+SIZE)<0)      // right & down
            ratePawnMove(j+SIZE);
        }
      }
    }
    
    if(walls[cp])
    {
      walls[cp]--;
      
      for(var w=wallh.length-1;w>=0;w--)
        wallh[w] || rateHWall(0|w);

      for(var w=wallv.length-1;w>=0;w--)
        wallv[w] || rateVWall(0|w);
      
      walls[cp]++;
    }
    
    if(!good && bestR>=beta)
      good = !isNaN(getPlayerLength(cp)+getPlayerLength(player));
    
    // restore level and player
    level++;
    player = cp;

    //return good ? alpha : NaN;
    return good ? bestR : NaN;
    //return isFinite(bestR) ? bestR : NaN;
  };
  
  var n1,  // the divisor
      n2,  // the proper remainder
      n;   // current move's number
  
  var alpha, beta=Infinity;
  
  var sendHWallRating = function(p)
  {
    if((++n)%n1 != n2)
      return;
    
    var right = wallh[p+1];
    
    wallh[p] = 1; wallh[p+1] = 2;

    var left = wallh[p-1];
    left || (wallh[p-1] = -1);

    var cross = wallv[p-SIZE+1];
    cross || (wallv[p-SIZE+1] = -1);

    var r = -solve(-beta,-alpha);
    isNaN(r) || postMessage({h: p, rating: r});
    if(r>alpha)
      ; //alpha = r;
    
    wallv[p-SIZE+1] = cross;
    wallh[p-1] = left;
    wallh[p+1] = right;
    wallh[p] = 0;
  };

  var sendVWallRating = function(p)
  {
    if((++n)%n1 != n2)
      return;
    
    var bottom = wallv[p+SIZE];
    
    wallv[p] = 1; wallv[p+SIZE] = 2;

    var up = wallv[p-SIZE];
    up || (wallv[p-SIZE] = -1);

    var cross = wallh[p+SIZE-1];
    cross || (wallh[p+SIZE-1] = -1);
    
    var r = -solve(-beta,-alpha);
    isNaN(r) || postMessage({v: p, rating: r});
    if(r>alpha)
      ; //alpha = r;

    wallh[p+SIZE-1] = cross;
    wallv[p-SIZE] = up;
    wallv[p+SIZE] = bottom;
    wallv[p] = 0;
  };

  onmessage = function(e)
  {
    e = e.data;
    pawns = e.pawns;
    walls = e.walls;
    goals = e.goals;
    player = e.player;
    level = e.level - 1;
    n1 = e.n1;
    n2 = e.n2;
    n = 0;

    wallh.set(e.wallh);
    wallv.set(e.wallv);
    asmFillModule.init(SIZE,0,1024,2048);
    
    jjj=0;
    
    var cp = player;
    player = (player+1)%pawns.length;
    
    alpha=-Infinity;
    
    var sendPawnMoveRating = function(p)
    {
      if((++n)%n1 != n2)
        return;
    
      var op = pawns[cp];
      pawns[cp] = p;
      var r = -solve(-beta,-alpha);
      pawns[cp] = op;
      
      isNaN(r) || postMessage({m: p, rating: r});
      if(r>alpha)
        ; //alpha = r;
    };
    
    var i = pawns[cp], j;

    // moving up
    if(wallh[i]<=0)
    {
      j = i-SIZE;
      if(pawns.indexOf(j)<0)   // if there is no another pawn
        sendPawnMoveRating(j);
      else
      {
        if(wallh[j]<=0 && pawns.indexOf(j-SIZE)<0)       // try to jump
          sendPawnMoveRating(j-SIZE);
        else
        {
          if(wallv[j]<=0 && pawns.indexOf(j-1)<0)        // up and left
            sendPawnMoveRating(j-1);
          
          if(wallv[j+1]<=0 && pawns.indexOf(j+1)<0)      // up and right
            sendPawnMoveRating(j+1);
        }
      }
    }
      
    // moving down
    j = i+SIZE;
    if(wallh[j]<=0)
    {
      if(pawns.indexOf(j)<0)   // if there is no another pawn
        sendPawnMoveRating(j);
      else
      {
        if(wallh[j+SIZE]<=0 && pawns.indexOf(j+SIZE)<0)       // try to jump
          sendPawnMoveRating(j+SIZE);
        else
        {
          if(wallv[j]<=0 && pawns.indexOf(j-1)<0)        // down and left
            sendPawnMoveRating(j-1);
          
          if(wallv[j+1]<=0 && pawns.indexOf(j+1)<0)      // down and right
            sendPawnMoveRating(j+1);
        }
      }
    }
      
    // moving left
    if(wallv[i]<=0)
    {
      j = i-1;
      if(pawns.indexOf(j)<0)   // if there is no another pawn
        sendPawnMoveRating(j);
      else
      {
        if(wallv[j]<=0 && pawns.indexOf(j-1)<0)       // try to jump
          sendPawnMoveRating(j-1);
        else
        {
          if(wallh[j]<=0 && pawns.indexOf(j-SIZE)<0)     // left & up
            sendPawnMoveRating(j-SIZE);
          
          if(wallh[j+SIZE]<=0 && pawns.indexOf(j+SIZE)<0)      // left & down
            sendPawnMoveRating(j+SIZE);
        }
      }
    }
      
    // moving right
    j = i+1;
    if(wallv[j]<=0)
    {
      if(pawns.indexOf(j)<0)   // if there is no another pawn
        sendPawnMoveRating(j);
      else
      {
        if(wallv[j+1]<=0 && pawns.indexOf(j+1)<0)       // try to jump
          sendPawnMoveRating(j+1);
        else
        {
          if(wallh[j]<=0 && pawns.indexOf(j-SIZE)<0)        // right & up
            sendPawnMoveRating(j-SIZE);
          
          if(wallh[j+SIZE]<=0 && pawns.indexOf(j+SIZE)<0)      // right & down
            sendPawnMoveRating(j+SIZE);
        }
      }
    }
    
    if(walls[cp])
    {
      walls[cp]--;
      
      for(var w=wallh.length-1;w>=0;w--)
        wallh[w] || sendHWallRating(0|w);

      for(var w=wallv.length-1;w>=0;w--)
        wallv[w] || sendVWallRating(0|w);
      
      walls[cp]++;
    }
    
    postMessage({done: true, jjj: alpha});
  };


