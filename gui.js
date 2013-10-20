"use strict";

Quoridor.GUI = function(container,size,names,comps)
{
  var FIELDSIZE,
      FIELDMARGIN,
      PIECERADIUS,
      STARTX,
      STARTY;

  var state, boardObjs = [];

  var enabled = false, validMoves = [];
      
  this.onMove;

  var that = this;
  
  var pawnObjs, projObj;

  var timeS = 0;
  
  var findNearestMove = function(x,y)
  {
    var d = Infinity, j = 0;

    for(var i in validMoves)
    {
      var dx = x-validMoves[i].x,
          dy = y-validMoves[i].y,
          d_ = dx*dx + dy*dy;

      if(d_<d)
        d = d_, j = i;
    }

    return j;
  };
  
  var clearProjObj = function()
  {
    projObj && container.removeChild(projObj);
    projObj = null;
  };
  
  var nearestMove = NaN;

  var umove = function(x,y)
  {
    nearestMove = findNearestMove(x,y);
    var m = validMoves[nearestMove];
    
    //clearProjObj();

    if('h' in m)
      projObj = drawHWall(m.h, 'projWall', projObj);
    else if('v' in m)
      projObj = drawVWall(m.v, 'projWall', projObj);
    else
      projObj = drawPawn(m.m, 'projPawn', null, projObj);
  };
  
  var mmove = function(e)
  {
    enabled && umove(e.clientX + window.pageXOffset-STARTX,e.clientY + window.pageYOffset-STARTY*2);
  };

  var tstart = function(e)
  {
    container.onmousemove = null;
    container.onmousedown = null;
    enabled && umove(e.targetTouches[0].pageX-STARTX,e.targetTouches[0].pageY-STARTY*3);
  };

  var tmove = function(e)
  {
    e.preventDefault();
    enabled && umove(e.targetTouches[0].pageX-STARTX,e.targetTouches[0].pageY-STARTY*3);
  };

  var tcancel = function(e)
  {
    e.preventDefault();
    clearProjObj();
    nearestMove = NaN;
  };

  var udone = function(e)
  {
    e.preventDefault();
    enabled && isFinite(nearestMove) && (that.onMove || function(){}) (nearestMove);
  };

  container.onmousemove = mmove;
  container.ontouchmove = tmove;
  container.ontouchstart = tstart;
  
  container.onmousedown = udone;
  container.ontouchend = udone;
  
  container.ontouchleave = tcancel;
  container.ontouchcancel = tcancel;
  
  this.setState = function(theState)
  {
    state = theState;
  };
  
  var availableMoves;
  
  var enableUser = function()
  {
    validMoves = [];
    
    for(var i in availableMoves)
    {
      var m = availableMoves[i];
      if('h' in m)
      {
        var x = m.h % Quoridor.SIZE,
            y = (m.h / Quoridor.SIZE)|0;

        x = x*(FIELDSIZE+FIELDMARGIN) + FIELDSIZE/2;
        y = y*(FIELDSIZE+FIELDMARGIN) - FIELDMARGIN/2;
        
        validMoves.push({x: x, y: y, n: i, h: m.h});
      }
      else if('v' in m)
      {
        var x = m.v % Quoridor.SIZE,
            y = (m.v / Quoridor.SIZE)|0;

        x = x*(FIELDSIZE+FIELDMARGIN) - FIELDMARGIN/2;
        y = y*(FIELDSIZE+FIELDMARGIN) + FIELDSIZE/2;
        
        validMoves.push({x: x, y: y, n: i, v: m.v});
      }
      else
      {
        var x = m.m % Quoridor.SIZE,
            y = (m.m / Quoridor.SIZE)|0;

        x = x*(FIELDSIZE+FIELDMARGIN) + FIELDSIZE/2;
        y = y*(FIELDSIZE+FIELDMARGIN) + FIELDSIZE/2;
        
        validMoves.push({x: x, y: y, n: i, m: m.m});
      }
    }
  };
  
  this.enableUser = function(theAvailableMoves)
  {
    nearestMove = NaN;
    availableMoves = theAvailableMoves;

    enableUser();
    
    enabled = true;
  };
  
  this.disableUser = function()
  {
    clearProjObj();
    enabled = false;
    timeS = +new Date;
  };
  
  var draw = function()
  {
    clear();
    drawWalls();
    drawPawns();
    drawRemWalls();
  };

  this.draw = draw;
  
  var clear = function()
  {
    // remove walls
    for(var i in boardObjs)
      container.removeChild(boardObjs[i]);

    boardObjs = [];
  };
  
  var drawWalls = function()
  {
    for(var y=size-1;y>=0;y--)
    for(var x=size-1;x>=0;x--)
    {
      var p = y*Quoridor.SIZE+x;
      if(state.wallh[p]==1 && y>0)
        boardObjs.push(drawHWall(p));
      
      if(state.wallv[y*Quoridor.SIZE+x]==1 && x>0)
        boardObjs.push(drawVWall(p));
    }
  };

  var drawHWall = function(p,cssClass,obj)
  {
    var x = p % Quoridor.SIZE,
        y = 0|(p / Quoridor.SIZE);

    p = obj;
    var obj = obj || document.createElement('div');
    obj.className = 'wall '+(cssClass || '');
    obj.style.left = x*(FIELDSIZE+FIELDMARGIN) + FIELDMARGIN/2 + 'px';
    obj.style.top =  y*(FIELDSIZE+FIELDMARGIN) - FIELDMARGIN + 'px';
    
    obj.style.width = 2*FIELDSIZE + FIELDMARGIN - FIELDMARGIN + 'px';
    obj.style.height = FIELDMARGIN + 'px';

    obj.style.borderRadius = 0;
                 
    p || container.appendChild(obj);
    
    return obj;
  }
  
  var drawVWall = function(p,cssClass,obj)
  {
    var x = p % Quoridor.SIZE,
        y = 0|(p / Quoridor.SIZE);

    p = obj;
    var obj = obj || document.createElement('div');
    obj.className = 'wall '+(cssClass || '');
    obj.style.left = x*(FIELDSIZE+FIELDMARGIN) - FIELDMARGIN + 'px';
    obj.style.top  = y*(FIELDSIZE+FIELDMARGIN) + FIELDMARGIN/2 + 'px';
    
    obj.style.width  = FIELDMARGIN + 'px';
    obj.style.height = 2*FIELDSIZE + FIELDMARGIN - FIELDMARGIN + 'px';

    obj.style.borderRadius = 0;
                 
    p || container.appendChild(obj);
    
    return obj;
  }
  
  var drawPawns = function()
  {
    for(var i in state.pawns)
      pawnObjs[i] = drawPawn(
        state.pawns[i],
        'pawn'+i,
        names[i] + (comps[i] ? ' (computer), ' : ' (human), ') + (state.walls[i] || 'no')+ ' walls left',
        pawnObjs[i]);
  };

  var drawPawn = function(p, cssClass, tooltip, pawnObj)
  {
    var x = p % Quoridor.SIZE;
    var y = 0|(p / Quoridor.SIZE);

    p = pawnObj;
    var pawnObj = pawnObj || document.createElement('div');
    pawnObj.className = 'pawn '+(cssClass || '');
    pawnObj.title = tooltip || null;
    
    pawnObj.style.left = x*(FIELDSIZE+FIELDMARGIN) + FIELDSIZE/2 - PIECERADIUS + 'px';
    pawnObj.style.top  = y*(FIELDSIZE+FIELDMARGIN) + FIELDSIZE/2 - PIECERADIUS + 'px';
    
    pawnObj.style.borderRadius = PIECERADIUS + 'px';
                 
    pawnObj.style.width  = PIECERADIUS*2 + 'px';
    pawnObj.style.height = PIECERADIUS*2 + 'px';

    p || container.appendChild(pawnObj);
    
    return pawnObj;
  };

  var drawRemWalls = function()
  {
    var div = document.createElement('div');
    
    div.className = 'remWalls';
    
    var s='Remaining walls:';
    for(var i in state.walls)
      s += '<span class="pawn'+i+'">' + state.walls[i] + '</span>';
    
    div.innerHTML = s;
    boardObjs.push(container.appendChild(div));
  };
  
  window.onresize = function()
  {
    FIELDSIZE = Math.min(innerWidth,innerHeight-50-50)/size,
    FIELDMARGIN = FIELDSIZE*0.2,
    FIELDSIZE *= 0.8;
    PIECERADIUS = FIELDSIZE/2.5,
    STARTX = FIELDMARGIN/2,
    STARTY = 40;

    while(container.firstChild)
      container.removeChild(container.firstChild);

    document.body.style.height = window.innerHeight + 'px';
    
    container.style.left = STARTX + 'px'
    container.style.top = STARTY*2 + 'px'
    container.style.width = (FIELDSIZE+FIELDMARGIN)*size + 'px'
    container.style.height = (FIELDSIZE+FIELDMARGIN)*size + 'px'
  
    // draw board
    for(var y=0;y<size;y++)
    for(var x=0;x<size;x++)
    {
      var div = document.createElement('div');

      div.className = 'field';
      
      div.style.left = x*(FIELDSIZE+FIELDMARGIN) + 'px';
      div.style.top  = y*(FIELDSIZE+FIELDMARGIN) + 'px';
      
      div.style.width  = FIELDSIZE + 'px';
      div.style.height = FIELDSIZE + 'px';
      
      container.appendChild(div);
    }
    
    pawnObjs = [];
    projObj = null;
    boardObjs = [];
    
    state && draw();
    enableUser();
  };
  
  window.onresize();

};