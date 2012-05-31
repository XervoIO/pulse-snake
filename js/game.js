// Hook the ready callback.
pulse.ready(function() {
  // Create an engine.
  var engine = new pulse.Engine({
    size : {
      width: 320,
      height: 480
    },
    gameWindow: 'snake-game'
  });

  // Create and add the menu scene
  var menuScene = new snake.MenuScene();
  menuScene.events.bind('gameStart', function(){
    engine.scenes.deactivateScene(menuScene);
    gameScene.startGame();
  });
  engine.scenes.addScene(menuScene);

  // Create and add the game scene
  var gameScene = new snake.GameScene();
  gameScene.events.bind('gameEnd', function(){
    engine.scenes.activateScene(menuScene);
  });
  engine.scenes.addScene(gameScene);

  engine.scenes.activateScene(gameScene);
  engine.scenes.activateScene(menuScene);

  // Start the update and render loop.
  engine.go(50);
});

var snake = {};

snake.MenuScene = pulse.Scene.extend({
  init : function(params) {
    this._super(params);

    // Self reference to use in event handlers
    var self = this;

    var layer = new pulse.Layer();
    layer.position = { x: 160, y : 240 };
    this.addLayer(layer);

    // Background sprite
    var bg = new pulse.Sprite({
      src: 'img/menu_bg.png',
      size: {
        width: 320,
        height: 480
      }
    });
    bg.position = { x: 160, y: 240 };
    layer.addNode(bg);

    // Play button
    var play = new pulse.Sprite({
      src: 'img/play_btn.png'
    });
    play.position = { x: 160, y: 100};
    play.events.bind('click', function(e){
      self.events.raiseEvent('gameStart', e);
    });
    layer.addNode(play);
  }
});

snake.GameScene = pulse.Scene.extend({
  init : function(params) {
    this._super(params);

    // Self reference to use in event handlers
    var self = this;

    // Create a layer and add it to the scene.
    this.layer = new pulse.Layer();
    this.layer.position = { x: 160, y : 240 };
    this.addLayer(this.layer);

    // Background sprite
    var bg = new pulse.Sprite({
      src: 'img/bg.png',
      size: {
        width: 320,
        height: 480
      }
    });
    bg.position = { x: 160, y: 240 };
    this.layer.addNode(bg);

    // Board background sprite
    var board = new pulse.Sprite({
      src: 'img/board_border.png'
    });
    board.anchor = { x: 0.5, y: 0};
    board.position = { x: 160, y: 18};
    this.layer.addNode(board);

    this.scoreLabel = new pulse.CanvasLabel({
      text : '0',
      fontSize : 14
    });
    this.scoreLabel.fillColor = "#CCFF00";
    this.scoreLabel.anchor = { x: 1.0, y: 0 };
    this.scoreLabel.position = { x: 312, y: 2};
    this.layer.addNode(this.scoreLabel);

    var arrowTexture = new pulse.Texture({
      filename: 'img/arrow_btn.png'
    });

    var up = new pulse.Sprite({
      src: arrowTexture
    });
    up.position = { x: 160, y: 394};
    up.events.bind('click', function(){
      self.changeDirection(0, -1);
    });
    this.layer.addNode(up);

    var down = new pulse.Sprite({
      src: arrowTexture
    });
    down.position = { x: 160, y: 448};
    down.rotation = 180;
    down.events.bind('click', function(){
      self.changeDirection(0, 1);
    });
    this.layer.addNode(down);

    var right = new pulse.Sprite({
      src: arrowTexture
    });
    right.position = { x: 214, y: 421};
    right.rotation = 90;
    right.events.bind('click', function(){
      self.changeDirection(1, 0);
    });
    this.layer.addNode(right);

    var left = new pulse.Sprite({
      src: arrowTexture
    });
    left.position = { x: 106, y: 421};
    left.rotation = -90;
    left.events.bind('click', function(){
      self.changeDirection(-1, 0);
    });
    this.layer.addNode(left);

    // Keyboard events
    this.events.bind('keyup', function(e) {
      switch(e.keyCode) {
        case 38: // Up arrow
        case 87: // W key
          self.changeDirection(0, -1);
          break;
        case 40: // Down arrow
        case 83: // S key
          self.changeDirection(0, 1);
          break;
        case 39: // Right arrow
        case 68: // D key
          self.changeDirection(1, 0);
          break;
        case 37: // Left arrow
        case 65: // A key
          self.changeDirection(-1, 0);
          break;
      }
    });

    // Game variables
    this.state = 'game-over';
    this.time = 0;
    this.speed = 200;
    this.score = 0;

    this.snakeVelocity = null;

    this.snakeTexture = new pulse.Texture({
      filename: 'img/snake_piece.png'
    });

    this.snakeHead = null;
    this.snakeTail = null;

    this.apple = new pulse.Sprite({
      src : 'img/apple.png'
    });
    this.apple.visible = false;
    this.layer.addNode(this.apple);
  },

  startGame : function() {
    // clean up old snake
    if(this.snakeHead) {
      var piece = this.snakeHead;
      while(piece) {
        this.layer.removeNode(piece);
        piece = piece.next;
      }
    }

    // create new snake
    this.snakeHead = this.snakeTail = new snake.SnakePiece({
      src : this.snakeTexture
    });
    this.snakeHead.position = { x: 20, y: 30};
    this.layer.addNode(this.snakeHead);
    this.addSnakePiece();
    this.addSnakePiece();

    // reset snake velocity
    this.snakeVelocity = {
      x : 1,
      y : 0
    };

    // reset score
    this.score = 0;
    this.scoreLabel.text = this.score;

    // place apple
    this.apple.visible = true;
    this.placeApple();

    this.state = 'playing';
  },

  addSnakePiece: function() {
    var piece = new snake.SnakePiece({
      src: this.snakeTexture,
      prev: this.snakeTail
    });
    piece.position.x = this.snakeTail.position.x;
    piece.position.y = this.snakeTail.position.y;
    this.snakeTail.next = piece;
    this.snakeTail = piece;
    this.layer.addNode(this.snakeTail);
  },

  placeApple : function() {
    do {
      this.apple.position.x = Math.round(Math.random() * 14) * 20 + 20;
      this.apple.position.y = Math.round(Math.random() * 16) * 20 + 30;
    }  while(!this.checkApplePlacement());
  },

  checkApplePlacement : function() {
    var piece = this.snakeHead;
    while(piece) {
      if(piece.position.x === this.apple.position.x &&
         piece.position.y === this.apple.position.y) {
        return false;
      }
      piece = piece.next;
    }
    return true;
  },

  changeDirection: function(x, y) {
    if(Math.abs(this.snakeVelocity.x) != Math.abs(x)) {
      this.snakeVelocity.x = x;
    }
    if(Math.abs(this.snakeVelocity.y) != Math.abs(y)) {
      this.snakeVelocity.y = y;
    }
  },

  update : function(elapsed) {
    this._super(elapsed);

    if(this.state == 'playing') {
      this.time += elapsed;
      if(this.time >= this.speed) {
        this.updateSnake();

        if(this.checkSnakeCollision()) {
          this.gameOver();
        }

        // check eat apple
        if(this.snakeHead.position.x === this.apple.position.x &&
           this.snakeHead.position.y === this.apple.position.y) {
          this.eatApple();
        }
        this.time = 0;
      }
    }
  },

  updateSnake : function() {
    // update snake
    var piece = this.snakeTail;
    while(piece.prev) {
      piece.updatePos();
      piece = piece.prev;
    }
    this.snakeHead.position.x += this.snakeVelocity.x * 20;
    this.snakeHead.position.y += this.snakeVelocity.y * 20;
  },

  checkSnakeCollision : function() {
    // check collision with wall
    var piece = this.snakeHead;
    if(piece.position.x < 20 || piece.position.x > 300 ||
       piece.position.y < 30 || piece.position.y > 350) {
      return true;
    }

    // check collision with self
    piece = piece.next;
    while(piece) {
      if(piece.position.x === this.snakeHead.position.x &&
         piece.position.y === this.snakeHead.position.y) {
        return true;
      }
      piece = piece.next;
    }

    return false;
  },

  eatApple : function() {
    this.addSnakePiece();
    this.placeApple();
    this.score += 42;
    this.scoreLabel.text = this.score;
  },

  gameOver : function() {
    this.snakeVelocity.x = 0;
    this.snakeVelocity.y = 0;
    this.state = 'game-over';
    this.events.raiseEvent('gameEnd', new pulse.Event());
  }
});

snake.SnakePiece = pulse.Sprite.extend({
  init : function(params) {
    this._super(params);

    this.prev = params.prev || null;
    this.next = null;
  },

  updatePos : function() {
    if(this.prev) {
      this.position.x = this.prev.position.x;
      this.position.y = this.prev.position.y;
    }
  }
});