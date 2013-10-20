corridor-game
=============

A Corridor game in HTML, CSS, JS with support of (some) mobile browsers.

Only two players supported for now. Each player may be a human or computer. For computer you can specify its skills level and number of threads to think on (good for multicore computer).

PURPOSE OF THE GAME
To be the first to reach the line opposite to one's base line.
 
When the game starts each player have 10 walls (configurable).
Each player places his pawn in the centre of his base line.
 
Each player in turn, chooses to move his pawn or to put up one of his walls.
When he has run out of walls, the player must move his pawn.

Pawn moves
The pawns are moved one square at a time, horizontally or vertically, forwards or backwards.
The pawns must get around the walls.

Positioning of the fences
The fences must be placed between 2 sets of 2 squares.
The fences can be used to facilitate the player’s progress or to impede that of the opponent, however, an acess to the goal line must always be left open for each player.

Face to face
When two pawns face each other on neighbouring squares which are not separated by a wall, the player whose turn it is can jump the opponent’s pawn (and place himself behind him), thus advancing an extra square. If there is a wall behind the said pawn, the player can place his pawn to the left or the right of the other pawn. 

END OF GAME
The first player who reaches one of the 9 squares (configurable) opposite his base line is the winner.
