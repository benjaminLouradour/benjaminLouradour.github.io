/**************************************************************************************************
*                                                                                                 *
* Game and code by Benjamin Louradour                                                             *
*                                                                                                 *
***************************************************************************************************/

/**************************************************************************************************
*                                                                                                 *
* Creation : 10/10/2014                                                                           *
*                                                                                                 *
* Last update : 09/11/2015                                                                        *
***************************************************************************************************/

/*********
*  V1.0  *
**********/

/**********
* Others  *
***********/
// TODO find new patterns for ennemies
// TODO responsive design
// TODO implement better bonuses and items

// TODO speech intro and bosses

// TODO improve core gameplay with levels (ennemies, bonusses, possibilities, scoring, bonus zones)

// TODO support other browsers
// TODO mobile version
// TODO optimization : layers for redraw

// TODO easter eggs
// TODO achievements
// TODO bonus mini me for X seconds
// TODO transition between levels and bosses

// TODO check browsers compatibility and unable game if not compatible
// TODO confirm new game if a game is currently running

// IDEA animate when collision (i.e. brick wall destructed / sparkles for bonuses)
// IDEA keep box but draw other shapes inside
// IDEA modes (X lives, X time, etc.)
// IDEA bonus ball arkanoid
// IDEA bonus X bullets |||
// IDEA bonus cherry PACMAN
// IDEA bonus protection bubble
// IDEA different states of player depending on lives

// IDEA maluses
// IDEA forced maluses warned a few seconds before
// IDEA malus flip vertically
// IDEA malus something that hides partially the screen

// IDEA random bonus / malus

// TOFIX screen to small not displaying
// TOFIX refreshs that should not happen
// TOFIX bonus text display
/*
* GLOBAL VARIABLES
*/
    // acceleration : float >= 0
var acceleration,
    // float value of the rotation for the canvas (degrees)
    angle,
    // rectangles to simulate movement
    backgrounds = [],
    // list of currently displayed bonuses
    bonuses = [],
    // text displayed when a bonus is get
    bonusText,
    // timer to display the bonus feedback
    bonusTextTimer,
    // timers to update the bonus' display
    bonusTimers = [],
    // int value of bonus time remaining
    bonusRemainingTime,
    // current boss
    boss,
    // canvas
    canvas,
    // boolean : true if canvas is rotating clockwise
    clockwise,
    // number of growing calls remaining (reset each new level)
    canvasGrowingCallsRemaining,
    // timer for the next canvas growing call
    canvasGrowingTimer,
    // boolean : true if the canvas is moving to the right
    canvasMovingRight,
    // boolean : true if the canvas is moving to the top
    canvasMovingTop,
    // context 2D of the canvas
    context,
    // current background number
    currentBackground,
    // list of ennemies
    ennemies = [],
    // int value of fps
    fps,
    // boolean : true if player is invincible
    invincible,
    // boolean : true if the game is paused
    isPause,
    // boolean : true if the game is already paused
    isPauseKeyDown,
    // boolean : true if left key is pressed
    keyLeftPressed,
    // boolean : true if right key is pressed
    keyRightPressed,
    // type of previous bonus
    lastBonusType,
    // current level : between 1 and 42
    level,
    // amount of lives remaining : between 0 and 8
    lives,
    // float value of left margin for the canvas
    marginLeft,
    // float value of top margin for the canvas
    marginTop,
    // boolean : true if sounds are off
    muted,
    // red square controlled by the user
    player,
    // text displayed when a bonus point is get
    pointsBonus,
    // refresh timer (every 1 / fps second)
    refreshTimer,
    // request animation frame identifier
    requestAnimId,
    // current score
    score,
    // score mutliplier
    scoreMultiplier,
    // boolean : true if the window is too small to keep playing
    screenTooSmall,
    // game song
    song,
    // boss song
    songBoss,
    // boolean : true if the game has begun
    started,
    // timer to reset invicibility after a certain time
    timerInvincible,
    // timer to trigger next level
    timerLevel,
    // list of timers
    timers = [],
    // list of timer for pushing tentacles
    timerTentaclesList = [];

/*
* SETUP
*/

/**
* Set up game and variables
*/
function init() {
    // clear refresh timer
    if (refreshTimer != null) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
    
    // get previous best score
    var previousScore = localStorage.getItem("bestScoreSPRedsquare");
    if (previousScore != null) {
        $('#bestScore').html(previousScore);
    }
    
    if (muted == undefined || muted == null) {
        muted = false;
    }
    
    // canvas
    canvas = document.getElementById("myCanvas");
    context = canvas.getContext("2d");
    canvas.width = 400;
    canvas.height = 564;
    
    // (re)set margins
    canvas.style.marginLeft = "0" + "px";
    marginLeft = 0.0;
    canvas.style.marginTop = "18" + "px";
    marginTop = 18.0;
    canvasMovingRight = true;
    canvasMovingTop = true;
    
    // (re)set rotation
    angle = 0.0;
    var value = "rotate(0deg)";
    $("#myCanvas").css({
        "webkitTransform": value,
        "MozTransform": value,
        "msTransform": value,
        "OTransform": value,
        "transform": value
    });
    
    $(document).off("keydown");
    $(document).off("keyup");
    $(window).off("blur");
    $("#myCanvas").off("click");
    
    fps = 60;
    
    started = false;
    
    if ($(document).width() < 790 || $(document).height() < 610) { // TODO determine exact dimensions
        screenTooSmall = true;
        displayScreenTooSmall();
    } else {
        // player 
        player = {positionX: 175, positionY: canvas.height - 50, width: 50, height: 50, color: "#FF0000", alpha: 1.0, alphaUp: false};
        acceleration = 0.0;
        
        // reset
        resetAll();
        boss = null;
        
        // infos
        level = 1;
        score = 0;
        scoreMultiplier = 1;
        lives = 5;
        screenTooSmall = false;
        keyLeftPressed = false;
        keyRightPressed = false;
        isPauseKeyDown = false;
        
        // bonus text
        bonusTimers = [null, null, null, null];
        bonusText = null;
        bonusTextTimer = null;
        bonusRemainingTime = 0;
        pointsBonus = 0;
        lastBonusType = -1;
        
        // background
        currentBackground = 0;
        for (var i = 0; i < 10; i++) {
            backgrounds.push(new Background());
        }
        $.timer(function () {
            if (backgrounds.length < 20) {
                backgrounds.push(new Background());
            }
        }, 200, true);

        // start game
        isPause = false;
        timerLevel = null;
        canvasGrowingTimer = null;
        screenTitle();
    }
    
    // TODO put before and debug, don't call requestAnimationFrame but screenTitle or pause
    // screen resize
    window.onresize = function () {
        if ($(document).width() < 790 || $(document).height() < 610) {
            if (started) {
                pauseTimers();
            }
            screenTooSmall = true;
            displayScreenTooSmall();
        } else {
            screenTooSmall = false;
            if (!started) {
                init();
            } else {
                if (!isPause) {
                    resumeTimers();
                    if (refreshTimer != null) {
                        clearInterval(refreshTimer);
                    }
                    requestAnimId = window.requestAnimationFrame(game);
                } else {
                    drawPauseMenu();
                }
            }
        }
    };
}

/**
* Initiate a new game
*/
function startGame() {
    startLevel();
    addEventListeners();
    started = true;
    
    if (refreshTimer != null) {
        clearInterval(refreshTimer);
    }
    refreshTimer = setInterval(function () {
        if (!isPause && !screenTooSmall) {
            requestAnimId = window.requestAnimationFrame(game);
        }
    }, 1000 / fps);
}

/**
* Display a message telling that the screen is too small
*/
function displayScreenTooSmall() {
    // clear
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // display screen
    context.fillStyle = "#545454";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    /*    -----  Skull using rectangles
         -- - --
         -------
          -----
           ---
           ---      */
    context.fillStyle = "#bb0000";
    var centerX = canvas.width / 2,
        centerY = canvas.height / 2;
    context.fillRect(centerX - 40, centerY - 60, 100, 20);
    context.fillRect(centerX - 60, centerY - 40, 40, 40);
    context.fillRect(centerX, centerY - 40, 20, 20);
    context.fillRect(centerX + 40, centerY - 40, 40, 40);
    context.fillRect(centerX - 20, centerY - 20, 60, 20);
    context.fillRect(centerX - 40, centerY, 100, 20);
    context.fillRect(centerX - 20, centerY + 20, 60, 40);
    // Bones
    context.fillStyle = "#bb0044";
    context.fillRect(centerX - 120, centerY - 120, 20, 20);
    context.fillRect(centerX - 100, centerY - 140, 20, 40);
    context.fillRect(centerX - 80, centerY - 100, 20, 20);
    context.fillRect(centerX - 60, centerY - 80, 20, 20);
    context.fillRect(centerX + 120, centerY - 120, 20, 20);
    context.fillRect(centerX + 100, centerY - 140, 20, 40);
    context.fillRect(centerX + 80, centerY - 100, 20, 20);
    context.fillRect(centerX + 60, centerY - 80, 20, 20);
    context.fillRect(centerX - 120, centerY + 60, 20, 20);
    context.fillRect(centerX - 100, centerY + 60, 20, 40);
    context.fillRect(centerX - 80, centerY + 40, 20, 20);
    context.fillRect(centerX - 60, centerY + 20, 20, 20);
    context.fillRect(centerX + 120, centerY + 60, 20, 20);
    context.fillRect(centerX + 100, centerY + 60, 20, 40);
    context.fillRect(centerX + 80, centerY + 40, 20, 20);
    context.fillRect(centerX + 60, centerY + 20, 20, 20);
    // message
    context.fillStyle = "#e5f1ef";
    context.font = "32px Lucida Console";
    var msg = "Window too small";
    context.fillText(msg, centerX - context.measureText(msg).width / 2, 80);
    msg = "NOOB.";
    context.fillText(msg, centerX - context.measureText(msg).width / 2, canvas.height - 80);
}

/**
* Start a new level
*/
function startLevel() {
    // stop timers
    for (var i = 0; i < timers.length; i++) {
        timers[i].stop();
    }
    timers = [];
    
    // ennemies
    if (level == 1) {
        addRandomWave(-40);
        
        // DEBUG score 
        /*
        var res = 0;
        for (i = 1; i < 42; i++) {
            var pointsLevel = (10 + 1.35 * i) * (4.78 + 0.19 * i) * 1000 / (300 - 4 * i);
            res += pointsLevel;
            console.log(i + ": " + Math.floor(pointsLevel) + ", total: " + Math.floor(res));
        }
        console.log("Total points: " + res);
        */
        
    } else {
        canvasGrowingCallsRemaining = 8; // every second for 8s, TODO put in game()
        canvasGrowingTimer = $.timer(function (){
            if (canvasGrowingCallsRemaining > 0) {
                // redraw pause menu
                if (isPause) {
                    drawPauseMenu();
                } else {
                    canvas.width += 1;
                    if (canvasGrowingCallsRemaining % 2 == 0) {
                        canvas.height -= 1;
                        player.positionY -= 1;
                    }
                    canvasGrowingCallsRemaining -= 1;
                }
            } else if (canvasGrowingTimer != null) {
                canvasGrowingTimer.stop();
                canvasGrowingTimer = null;
            }
        }, 400, true);
    }
    
    if (level == 11 || level == 21 || level == 31 || level == 42) { 
        if (level != 42) {
            // give 3 hearts after a boss
            var bonus = new Bonus(3);
            bonus.positionX = Math.floor((Math.random() * (canvas.width - bonus.width)));
            bonus.positionY = 0;
            bonuses.push(bonus);

            var bonus2 = new Bonus(3);
            bonus2.positionX = Math.floor((Math.random() * (canvas.width - bonus2.width)));
            bonus2.positionY = -100;
            bonuses.push(bonus2);

            var bonus3 = new Bonus(3);
            bonus3.positionX = Math.floor((Math.random() * (canvas.width - bonus3.width)));
            bonus3.positionY = -200;
            bonuses.push(bonus3);
        }
        
        // change music
        document.getElementById('bossMusic').pause();
        document.getElementById('gameMusic').currentTime = 0;
        if (!muted) {
            document.getElementById('gameMusic').play();
        }
    } else if (level == 5 || level == 15 || level == 25 || level == 35) { 
        // give one heart
        var bonus = new Bonus(3);
        bonus.positionX = Math.floor((Math.random() * (canvas.width - bonus.width)));
        bonus.positionY = 0;
        bonuses.push(bonus);
    } else if (level == 10 || level == 20 || level == 30 || level == 41) {
        // change music
        document.getElementById('gameMusic').pause();
        document.getElementById('bossMusic').currentTime = 0;
        if (!muted) {
            document.getElementById('bossMusic').play();
        }
    }
    
    // Bosses
    switch (level) {
    case 10:
        bossLevel10();
        break;
    case 20:
        bossLevel20();
        break;
    case 30:
        bossLevel30();
        break; 
    case 41:
        finalBoss();
        break; 
    case 42:
        level42();
        break;
    default:
        timers.push($.timer(function () {addRandomWave(-100); }, 3040 - level * 40, true));
    
        // bonuses
        timers.push($.timer(function () {
            var delay = Math.floor(Math.random() * 10000) + 1000;
            setTimeout(function () {addRandomBonus(); }, delay);
        }, 3975 + level * 25, true));
        timers.push($.timer(function () {animateBonuses(); }, 450, true));

        // score
        timers.push($.timer(function () {score += scoreMultiplier * Math.floor(4.78 + level * 0.19); }, 300 - level * 4, true));

        // call next level
        timerLevel = $.timer(function () {triggerNextLevel(); }, 10000 + 600 * level, true);
        
        // DEBUG
        //timerLevel = $.timer(function () {triggerNextLevel(); }, 3000, true);
    }
}

/**
* Add event listeners
*/
function addEventListeners() {
    // keyboard events
    $(document).on("keydown", keyDownAction);
    $(document).on("keyup", keyUpAction);
    
    // blur event
    $(window).on("blur", blurAction);
}

/**
* Draw scene
*/
function draw() {
    // clear
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // background
    for (var i = backgrounds.length - 1; i >= 0; i--) {
        context.fillStyle = backgrounds[i].color;
        context.fillRect(0, backgrounds[i].y, canvas.width, 100);
    }
    
    // draw player
    drawPlayer();
    
    // draw bonuses
    for (var i = 0; i < bonuses.length; i++) {
        drawBonus(bonuses[i]);
    }
    
    // draw ennemies
    for (var i = 0; i < ennemies.length; i++) {
        drawEnnemy(ennemies[i]);
    }
    
    // draw HUD
    drawHUD();
    
    // bonus feedback
    if (bonusText != null) {
        context.font = "24px Arial";
        context.fillStyle = "orange";
        context.strokeStyle = "red";
        var centerX = canvas.width / 2;
        context.fillText(bonusText, centerX - context.measureText(bonusText).width / 2, canvas.height - 100);
        context.strokeText(bonusText, centerX - context.measureText(bonusText).width / 2, canvas.height - 100);
    }
    drawBonusPoints();
}

/**
* Draw player
*/
function drawPlayer() {
    context.globalAlpha=player.alpha;
    context.fillStyle = player.color;
    context.fillRect(player.positionX, player.positionY, player.width, player.height);
    context.strokeStyle = "#fe0005";
    context.strokeRect(player.positionX, player.positionY, player.width, player.height);
    context.globalAlpha=1;
}

/**
* Draw HUD
*/
function drawHUD() {
    context.fillStyle = "black";
    context.font = "24px Arial";
    context.fillText("Level " + level, 5, 20);
    context.font = "20px Arial";
    if (scoreMultiplier == 2) {
        context.font = "22px Arial";
        context.fillStyle = "red";
    }
    context.fillText("Score : " + score, canvas.width - 140, 20);
    context.fillStyle = "black";
    $('#currentScore').html(score);
    // update best score
    if (score > $('#bestScore').html()) {
        $('#bestScore').html(score);
        localStorage.setItem("bestScoreSPRedsquare", score); // store best score in browser
    }
    
    for (var i = 0; i < 10; i++) {
        context.beginPath();
        context.arc((i + 1) * 15, 35, 5, 0, 2 * Math.PI, false);
        if (i < lives) {
            context.fillStyle = "green";
            context.fill();
        }
        context.lineWidth = 1;
        context.strokeStyle = '#003300';
        context.stroke();
        context.closePath();
    }
}

/**
* Draw How to play screen
*/
function drawHowToPlay() {
    // clear
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // zones
    context.fillStyle = "#F9E0C5";
    context.fillRect(0, 0, canvas.width, 100);
    context.fillStyle = "#F9EBE1";
    context.fillRect(0, 100, canvas.width, 150);
    context.fillStyle = "#DCC6B2";
    context.fillRect(0, 250, canvas.width, 150);
    context.fillStyle = "#F9EBE1";
    context.fillRect(0, 400, canvas.width, 100);
    context.fillStyle = "#F9E0C5";
    context.fillRect(0, 500, canvas.width, 64);
    
    // zone 1 : score
    context.fillStyle = "black";
    context.font = "20px Arial";
    context.fillText("Score : 1337", canvas.width - 130, 23);
    context.strokeStyle = "red";
    context.strokeRect(canvas.width - 135, 4, 125, 25);
    context.font = "34px Arial Black";
    context.fillText("Get the best score!", 20, 70);
    
    // zone 2 : ennemies
    context.fillStyle = "black";
    context.font = "34px Arial";
    context.fillText("Avoid ennemies", 70, 140);
    var ennemy = new Ennemy(1);
    ennemy.positionX = 25;
    ennemy.positionY = 150;
    drawEnnemy(ennemy);
    ennemy = new Ennemy(3);
    ennemy.positionX = 75;
    ennemy.positionY = 190;
    drawEnnemy(ennemy);
    ennemy = new Ennemy(2);
    ennemy.positionX = 150;
    ennemy.positionY = 150;
    drawEnnemy(ennemy);
    ennemy = new Ennemy(3);
    ennemy.positionX = 275;
    ennemy.positionY = 190;
    drawEnnemy(ennemy);
    ennemy = new Ennemy(1);
    ennemy.positionX = 350;
    ennemy.positionY = 150;
    drawEnnemy(ennemy);
    
    // zone 3 : bonuses
    context.fillStyle = "black";
    context.font = "34px Arial";
    context.fillText("Collect bonuses", 70, 290);
    var bonus = new Bonus(1);
    bonus.positionX = 50;
    bonus.positionY = 310;
    drawBonus(bonus);
    context.fillStyle = "black";
    context.font = "14px Arial";
    context.fillText("+ 50 points", 90, 320);
    bonus = new Bonus(2);
    bonus.positionX = 50;
    bonus.positionY = 340;
    drawBonus(bonus);
    context.fillStyle = "black";
    context.font = "14px Arial";
    context.fillText("invincible 8s", 90, 350);
    bonus = new Bonus(3);
    bonus.positionX = 50;
    bonus.positionY = 370;
    drawBonus(bonus);
    context.fillStyle = "black";
    context.font = "14px Arial";
    context.fillText("+ 1 life", 90, 380);
    bonus = new Bonus(4);
    bonus.positionX = canvas.width / 2 + 50;
    bonus.positionY = 310;
    drawBonus(bonus);
    context.fillStyle = "black";
    context.font = "14px Arial";
    context.fillText("score x 2", canvas.width / 2 + 90, 320);
    
    // zone 4 : movements
    context.fillStyle = "black";
    context.font = "28px Arial";
    context.fillText("Move with arrows", 90, 425);
    context.fillStyle = "red";
    context.fillRect(145, 440, 50, 50);
    context.fillStyle = "black";
    context.fillText(String.fromCharCode(9668), 55, 470);
    context.fillText(String.fromCharCode(9658), 255, 470);
    context.font = "18px Arial";
    context.fillText("Pause", 320, 450);
    context.font = "28px Arial";
    context.fillText("P", 310, 480);
    context.fillText("Esc", 340, 480);
    
    // zone 5 : buttons
    context.fillStyle = "white";
    context.fillRect(50, 510, 100, 50);
    context.fillRect(250, 510, 100, 50);
    context.fillStyle = "black";
    context.font = "20px Arial";
    context.fillText("Back", 75, 540);
    context.fillText("Start", 275, 540);
    
    // clic callbacks
    $("#myCanvas").on("click", function (e) {
        var pos = getMousePos(canvas, e);
        
        if (pos.y >= 505 && pos.y <= 565) {
            if (pos.x >= 45 && pos.x <= 155) { // back
                $("#myCanvas").off("click");
                screenTitle();
            } else if (pos.x >= 245 && pos.x <= 355) { // start
                $("#myCanvas").off("click");
                startGame();
            }
        } else if (pos.x >= 8 && pos.x <= 42 && pos.y >= 1 && pos.y <= 41) { // (un)mute sound
            // TODO
        }
    });
}

/**
* Draw an ennemy
* @param ennemy the ennemy
*/
function drawEnnemy(ennemy) {
    var x = ennemy.positionX,
        y = ennemy.positionY,
        w = ennemy.width,
        h = ennemy.height;
        
    // shape
    context.fillStyle = ennemy.color;
    context.fillRect(x, y, w, h);
    context.strokeStyle = "black";
    context.strokeRect(x, y, w, h);
    
    switch (ennemy.face) {
    case 0:
        // left eye
        context.beginPath();
        context.arc(x + w / 4, y + h / 4, w / 8, 0, 2 * Math.PI, false);
        context.fillStyle = "white";
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = "black";
        context.stroke();
        context.closePath();
        context.beginPath();
        context.arc(x + w / 4, y + h / 4, w / 16, 0, 2 * Math.PI, false);
        context.fillStyle = "black";
        context.fill();
        context.closePath();

        // right eye
        context.beginPath();
        context.arc(x + 3 * w / 4, y + h / 4, w / 8, 0, 2 * Math.PI, false);
        context.fillStyle = "white";
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = "black";
        context.stroke();
        context.closePath();
        context.beginPath();
        context.arc(x + 3 * w / 4, y + h / 4, w / 16, 0, 2 * Math.PI, false); // TODO fix bigger eye bug
        context.fillStyle = "black";
        context.fill();
        context.closePath();

        // mouth
        context.fillRect(x + w / 4, y + 2 * h / 3, w / 2, h / 6);
        break;
    case 1:
        // left eye
        context.fillStyle = "white";
        context.fillRect(x + 3 * w / 10, y + h / 6, w / 10, h / 3);
        context.strokeStyle = "black";
        context.stroke();
        context.fillStyle = "black";
        context.fillRect(x + 13 * w / 40, y + h / 6, w / 20, h / 3);
            
        // right eye
        context.fillStyle = "white";
        context.fillRect(x + 3 * w / 5, y + h / 6, w / 10, h / 3);
        context.strokeStyle = "black";
        context.stroke();
        context.fillStyle = "black";
        context.fillRect(x + 5 * w / 8, y + h / 6, w / 20, h / 3);
            
        // mouth
        context.beginPath();
        context.moveTo(x + w / 10,  y + 5 * h / 6);
        context.lineTo(x + w / 10, y + 2 * h / 3);
        context.lineTo(x + 9 * w / 10, y + 2 * h / 3);
        context.lineTo(x + 9 * w / 10, y + 5 * h / 6);
        context.stroke();
            
        // beard
        context.fillRect(x + 2 * w / 5, y + 7 * h / 8, w / 5, h / 4);
        break;
    case 2:
        // left eye
        context.fillStyle = "white";
        context.fillRect(x + w / 8, y + h / 8, w / 4, h / 4);
        context.strokeStyle = "black";
        context.strokeRect(x + w / 8, y + h / 8, w / 4, h / 4);
        context.beginPath();
        context.arc(x + w / 4, y + h / 4, w / 20, 0, 2 * Math.PI, false);
        context.fillStyle = "black";
        context.fill();
            
        // right eye
        context.fillStyle = "white";
        context.fillRect(x + 5 * w / 8, y + h / 8, w / 4, h / 4);
        context.strokeStyle = "black";
        context.strokeRect(x + 5 * w / 8, y + h / 8, w / 4, h / 4);
        context.beginPath();
        context.arc(x + 3 * w / 4, y + h / 4, w / 20, 0, 2 * Math.PI, false);
        context.fillStyle = "black";
        context.fill();
            
        // left eyebrow
        context.beginPath();
        context.moveTo(x + w / 8,  y - h / 8);
        context.lineTo(x + 3 * w / 8, y + h / 8);
        context.stroke();
            
        // right eyebrow
        context.beginPath();
        context.moveTo(x + 5 * w / 8,  y + h / 8);
        context.lineTo(x + 7 * w / 8, y - h / 8);
        context.stroke();
            
        // mouth
        context.fillStyle = "white";
        context.fillRect(x + w / 4, y + 5 * h / 8, w / 2, h / 4);
        context.strokeStyle = "black";
        context.strokeRect(x + w / 4, y + 5 * h / 8, w / 2, h / 4);
            
        // tongue
        context.fillStyle = "red";
        context.fillRect(x + 3 * w / 8, y + 5 * h / 8, w / 4, h / 4);
        context.strokeStyle = "black";
        context.strokeRect(x + 3 * w / 8, y + 5 * h / 8, w / 4, h / 4);
        context.beginPath();
        context.moveTo(x + w / 2,  y + 5 * h / 8);
        context.lineTo(x + w / 2, y + 7 * h / 8);
        context.stroke();
        break;
    case 3:
        // glasses
        context.fillStyle = "purple";
        context.fillRect(x + w / 8, y + h / 16, w / 4, 3 * h / 8);
        context.fillRect(x + 5 * w / 8, y + h / 16, w / 4, 3 * h / 8);
        context.fillRect(x + 3 * w / 8, y + 3 * h / 16, w / 4, h / 8);
        context.strokeStyle = "black";
        context.strokeRect(x + w / 8, y + h / 16, w / 4, 3 * h / 8);
        context.strokeRect(x + 5 * w / 8, y + h / 16, w / 4, 3 * h / 8);
        context.strokeRect(x + 3 * w / 8, y + 3 * h / 16, w / 4, h / 8);
            
        // inner glasses
        context.fillStyle = "gray";
        context.fillRect(x + 3 * w / 20, y + h / 8, w / 5, h / 4);
        context.fillRect(x + 13 * w / 20, y + h / 8, w / 5, h / 4);
        context.strokeStyle = "black";
        context.strokeRect(x + 3 * w / 20, y + h / 8, w / 5, h / 4);
        context.strokeRect(x + 13 * w / 20, y + h / 8, w / 5, h / 4);
        
        // mouth
        context.beginPath();
        context.arc(x + w / 2, y + 7 * h / 8, w / 10, Math.PI, 2 * Math.PI, false);
        context.fillStyle = "black";
        context.fill();
        break;
    default:
        // eyes
        context.fillStyle = "black";
        context.fillRect(x + w / 5, y + h / 4, w / 10, w / 10); // left
        context.fillRect(x + 7 * w / 10, y + h / 4, w / 10, w / 10); // right
        
        // mouth
        context.beginPath();
        context.moveTo(x + w / 4,  y + 3 * h / 4);
        context.lineTo(x + w / 2, y + h / 2);
        context.lineTo(x + 3 * w / 4, y + 3 * h / 4);
        context.stroke();
    }
}

/**
* Draw a bonus
* @param bonus the bonus
*/
function drawBonus(bonus) {
    var x = bonus.positionX,
        y = bonus.positionY;
    
    // shape
    context.fillStyle = bonus.color;
    context.beginPath();
    context.arc(x, y, 14, 0, 2 * Math.PI, false);
    context.fill();
    context.lineWidth = 1;
    context.strokeStyle = 'black';
    context.stroke();
    context.closePath();

    context.textAlign = "center";
    switch(bonus.type) {
    case 1: // points
        context.fillStyle = "yellow";
        context.font = "20px Arial";
        context.fillText("$", x, y + 7);
        context.strokeStyle = "black";
        context.strokeText("$", x, y + 7);
            
        break;
    case 2: // invincible
        context.fillStyle = "green";
        context.font = "22px Arial";
        context.fillText("i", x, y + 7);
        context.strokeStyle = "black";
        context.strokeText("i", x, y + 7);
        
        break;
    case 3: // 1 UP
        context.fillStyle = "pink";
        context.font = "20px Arial";
        context.fillText(String.fromCharCode(10084), x, y + 7); // <3
        context.strokeStyle = "black";
        context.strokeText(String.fromCharCode(10084), x, y + 7);
            
        break;
    case 4: // score x 2
        context.fillStyle = "red";
        context.font = "18px Arial";
        context.fillText("x2", x, y + 7);
        context.strokeStyle = "black";
        context.strokeText("x2", x, y + 7);
            
        break;
    }
    context.textAlign = "left";
}

/**
* Draw pause menu
*/
function drawPauseMenu() {
    context.globalAlpha=0.5;
    context.fillStyle = "#7575A3";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalAlpha=1;
    
    context.fillStyle = "#868FBF";
    context.strokeStyle = "black";
    context.fillRect(0, 0, canvas.width, 60);
    context.fillRect(0, canvas.height / 2 - 120, canvas.width, 240);
    context.strokeRect(0, 0, canvas.width, 60);
    context.strokeRect(0, canvas.height / 2 - 120, canvas.width, 240);
    context.fillRect(0, canvas.height - 60, canvas.width, 60);
    context.strokeRect(0, canvas.height - 60, canvas.width, 60);
    
    context.fillStyle = "red";
    context.font = "36px Arial Black";
    context.textAlign = "center";
    context.fillText("PAUSE", canvas.width  / 2, 40);
    context.textAlign = "left";
    
    drawMute();
    
    context.fillStyle = "#112748";
    context.font = "24px Arial Black";
    context.fillText("Score: " + score, 30, canvas.height / 2 - 60);
    context.fillText("Level: " + level, 30, canvas.height / 2);
    context.fillText("Lives: ", 30, canvas.height / 2 + 60);
    for (var i = 0; i < lives; i++) {
        context.beginPath();
        context.arc((i + 1) * 17 + 110, canvas.height / 2 + 52, 5, 0, 2 * Math.PI, false);
        context.fillStyle = "green";
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = '#003300';
        context.stroke();
        context.closePath();
    }
    
    
    context.fillStyle = "#e5f1ef";
    context.fillRect(20, canvas.height - 45, canvas.width / 2 - 40, 30);
    context.strokeRect(20, canvas.height - 45, canvas.width / 2 - 40, 30);
    context.fillRect(canvas.width / 2 + 20, canvas.height - 45, canvas.width / 2 - 40, 30);
    context.strokeRect(canvas.width / 2 + 20, canvas.height - 45, canvas.width / 2 - 40, 30);
    
    context.fillStyle = "black";
    context.font = "22px Arial Black";
    context.textAlign = "center";
    context.fillText("Home menu", canvas.width / 4, canvas.height - 25);
    context.fillText("Resume", 3 * canvas.width / 4, canvas.height - 25);
    context.textAlign = "left";
}

/**
* Add bonus points
*
* @param amount the amount of points
*/
function addBonusPoints(amount) {
    score += scoreMultiplier * amount;
    pointsBonus =  scoreMultiplier * amount;
    
    timerOnce(function () {
        pointsBonus = 0;
    }, 2000);
}

/**
* Draw bonus points
*/
function drawBonusPoints() {
    if (pointsBonus >= 50) {
        var x,
            y;
        if (pointsBonus > 999) {
            context.fillStyle = "red";
            context.font = "22px Arial Black";
            x = canvas.width - 90;
            y = 50;
        } else if (pointsBonus > 499) {
            context.fillStyle = "orange";
            context.font = "20px Arial Black";
            x = canvas.width - 80;
            y = 50;
        } else if (pointsBonus > 199) {
            context.fillStyle = "#ffcc00";
            context.font = "18px Arial Black";
            x = canvas.width - 80;
            y = 45;
        } else if (pointsBonus > 99) {
            context.fillStyle = "green";
            context.font = "16px Arial Black";
            x = canvas.width - 80;
            y = 45;
        } else {
            context.fillStyle = "black";
            context.font = "14px Arial Black";
            x = canvas.width - 70;
            y = 40;
        }
        context.fillText("+ " + pointsBonus, x, y);
    }
}

/*
* GAME
*/

/**
* screen title
*/
function screenTitle() {
    // clear
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // background
    context.fillStyle = "#F9F9F8";
    context.fillRect(0, 0, canvas.width, canvas.height);
    // TODO add details (rectangles, etc.)
    
    // play and how to play buttons
    // TODO change color to red when hovering
    context.fillStyle = "#7EAA6D";
    context.fillRect(80, 320, 240, 60);
    context.fillRect(80, 400, 240, 60);
    context.strokeStyle = "black";
    context.strokeRect(80, 320, 240, 60);
    context.strokeRect(80, 400, 240, 60);
    context.fillStyle = "#F9F9F8";
    context.font = "28px Arial Black";
    context.textAlign = "center";
    context.fillText("Play", 200, 350);
    context.fillText("How to play", 200, 430);
    context.textAlign = "left";
    
    // draw title
    context.fillStyle = "#868FBF";
    context.fillRect(0, 120, canvas.width, 120);
    context.strokeStyle = "black";
    context.strokeRect(0, 120, canvas.width, 120);
    context.fillStyle = "#F9F9F8";
    context.font = "32px Arial Black";
    context.textAlign = "center";
    context.fillText("Saving private", 200, 160);
    context.fillStyle = "red";
    context.font = "52px Arial Black";
    context.fillText("RedSquare", 200, 210);
    context.textAlign = "left";
    
    // sound button
    drawMute();
    
    // TODO animate background
    
    // clic callbacks
    $("#myCanvas").on("click", function (e) {
        var pos = getMousePos(canvas, e);
        
        if (pos.x >= 75 && pos.x <= 325) {
            if (pos.y >= 315 && pos.y <= 385) { // play
                $("#myCanvas").off("click");
                startGame();
                
                //test boss
                /*
                addEventListeners();
                canvas.width = 728;
                canvas.height = 400;
                player.positionY -= 164;
                level42();
                */
                // end test
                
            } else if (pos.y >= 395 && pos.y <= 465) { // how to play
                $("#myCanvas").off("click");
                drawHowToPlay();
            }
        } else if (pos.x >= 8 && pos.x <= 42 && pos.y >= 1 && pos.y <= 41) { // (un)mute sound
            toggleMute();
            
            context.fillStyle = "#F9F9F8";
            context.fillRect(2, 2, 48, 48);
            drawMute();
        }
    });
}

/**
* draw mute button
*/
function drawMute() {
    context.fillStyle = "black";
    context.fillRect(13, 30, 9, 6);
    context.fillRect(28, 30, 9, 6);
    context.fillRect(19, 18, 3, 12);
    context.fillRect(34, 18, 3, 12);
    context.fillRect(19, 12, 18, 6);
    
    if (muted) {
        context.strokeStyle = "red";
        context.lineWidth = 2;
        
        context.beginPath();
        context.moveTo(10, 40);
        context.lineTo(40, 10);
        context.stroke();
        context.closePath();
        
        context.lineWidth = 1;
    }
}

/**
* toggles the sound
*/
function toggleMute() {
    muted = !muted;
    
    if (muted) {
        document.getElementById('gameMusic').pause();
        document.getElementById('bossMusic').pause();
    } else if (level != 10 && level != 20 && level != 30 && level != 41) {
        document.getElementById('gameMusic').play();
    } else {
        document.getElementById('bossMusic').play();
    }
}

/**
* (re)start the game
*/
function playGame() {
    // TODO poka yoke
    
    init();
}

/**
* game cycle
*/
function game() {
    movePlayer();

    draw();
    
    // refresh
    if (lives > 0) {
        if (level > 10) {
            moveHorizontaly(level * 0.019);
            if (level > 20) {
                moveVerticaly(level * 0.015);
                if (level > 30) {
                    rotateCanvas(0.10 + (level - 30) * 0.008);
                }
            }
        }
        checkBonuses();

        if (!isPause) {
            ennemyMove();
            bonusMove();
            
            // animate background
            for (var i = backgrounds.length - 1; i >= 0; i--) {
                if (backgrounds[i].y > canvas.height) {
                    backgrounds.splice(i, 1);
                } else {
                    backgrounds[i].y += 4 + 0.05 * level;
                }
            }
        }
        if (isPause) {
            drawPauseMenu();
        }
    } else {
        theEnd();
    }
}

/**
* Pause timers
*/
function pauseTimers() {
    for (var i = 0; i < timers.length; i++) {
        if (timers[i] != null) {
            timers[i].pause();
        }
    }
    if (timerLevel != null) {
        timerLevel.pause();
    }
    if (timerInvincible != null) {
        timerInvincible.pause();
    }
    for (var i = 0; i < bonusTimers.length; i++) {
        if (bonusTimers[i] != null) {
            bonusTimers[i].pause();
        }
    }
    if (bonusTextTimer != null) {
        bonusTextTimer.pause();
    }
    if (canvasGrowingTimer != null) {
        canvasGrowingTimer.pause();
    }
}

/**
* Pause the game
*/
function pause() {
    pauseTimers();
    drawPauseMenu();
    
    // manage clicks
    $("#myCanvas").on("click", function (e) {
        var pos = getMousePos(canvas, e);
        
        if (pos.y >= canvas.height - 50 && pos.y <= canvas.height - 10) {
            if (pos.x >= 15 && pos.x <= canvas.width / 2 - 35) { // menu
                init();
           } else if (pos.x >= canvas.width / 2 + 15 && pos.x <= canvas.width - 15) { // resume 
                $("#myCanvas").off("click");
                isPause = false;
                resume();
            }
        } else if (pos.x >= 8 && pos.x <= 42 && pos.y >= 1 && pos.y <= 41) { // (un)mute sound
            toggleMute();
            
            context.fillStyle = "#868FBF";
            context.fillRect(2, 2, 48, 48);
            drawMute();
        }
    });
}

/**
* Resume timers
*/
function resumeTimers() {
    for (var i = timers.length - 1; i >= 0; i--) {
        if (timers[i] != null) {
            timers[i].play(false);
        } else {
            timers.splice(i, 1);
        }
    }
    if (timerLevel != null) {
        timerLevel.play(false);
    }
    if (timerInvincible != null) {
        timerInvincible.play(false);
    }
    for (var i = bonusTimers.length - 1; i >= 0; i--) {
        if (bonusTimers[i] != null) {
            bonusTimers[i].play(false);
        }
    }
    if (bonusTextTimer != null) {
        bonusTextTimer.play(false);
    }
    if (canvasGrowingTimer != null) {
        canvasGrowingTimer.play(false);
    }
}

/**
* Resume the game
*/
function resume() {
    resumeTimers();
}

/*
* ACTIONS PERFORMED
*/

/**
* Keydown actions performed
*
* @param event the event
*/
function keyDownAction(event) {
    if (!screenTooSmall) {
        if (!isPause) {
            if (event.keyCode == '37') { // left
                keyLeftPressed = true;
            }
            if (event.keyCode == '39') { // right
                keyRightPressed = true;
            }
        }
        if (event.keyCode == '80' || event.keyCode == '27' || event.keyCode == '13') { // p or echap or enter
            if (!isPauseKeyDown) {
                isPauseKeyDown = true;
                if (isPause) {
                    resume();
                } else {
                    pause();
                }
                isPause = !isPause;
            }
        }
    }
}

/**
* Keyup actions performed
*
* @param event the event
*/
function keyUpAction(event) {
    if (event.keyCode == '37' || event.keyCode == '39') { // left or right
        acceleration = 0.0; // note that acceleration is reseted even if the game is paused
        
        /*
        // closest tile
        if ((player.positionX % 4) <= 2) { // left tile
            player.positionX = parseInt(player.positionX / 4) * 4;
        } else {
            player.positionX = (parseInt(player.positionX / 4) + 1) * 4;
        } */
        
        if (event.keyCode == '37') {
            keyLeftPressed = false;
        }
        if (event.keyCode == '39') {
            keyRightPressed = false;
        }
    }
    if (event.keyCode == '80' || event.keyCode == '27' || event.keyCode == '13') { // p or echap or enter
        isPauseKeyDown = false;
    }
}
    
/**
* Blur action performed
*
* @param event the event
*/
function blurAction(event) {
    if (!screenTooSmall && !isPause) {
        pause();
        isPause = true;
    }
}

/*
* FUNCTIONS
*/

/**
* Move all enemies once
*/
function ennemyMove() {
    for (var i = ennemies.length - 1; i >= 0; i--) {
        // In order to have level 42 around 8 times faster than level 1
        ennemies[i].positionY += (ennemies[i].speed / 2) * (0.725 + 0.075 * level);
        if (ennemies[i].positionY >= canvas.height) { // off screen
            ennemies.splice(i, 1);
        }
    }
}

/**
* Move all bonuses once
*/
function bonusMove() {
    for (var i = bonuses.length - 1; i >= 0; i--) {
        bonuses[i].positionY += bonuses[i].speed / 1.8;
        if (bonuses[i].positionY >= canvas.height) { // off screen
            bonuses.splice(i, 1);
        }
    }
}

/**
* Animate bonuses
*/
function animateBonuses() {
    for (var i = bonuses.length - 1; i >= 0; i--) {
        var colorTemp = bonuses[i].color;
        
        // swap color 1 and color 2
        bonuses[i].color = bonuses[i].color2;
        bonuses[i].color2 = colorTemp;
    }
}

/**
* Create a pausable timer and trigger it once
* @param callback the function to trigger
* @param delay the delay in ms
*/
function timerOnce(callback, delay) {
    var tempTimer = $.timer(function () {
        if (tempTimer != null) {
            callback();
            tempTimer.stop();
            tempTimer = null;
        }
    }, delay, true);
    timers.push(tempTimer);
}

/**
* Check if the player collides with an ennemy
*
* @return true | false
*/
function isCollision() {
    for (var i = ennemies.length - 1; i >= 0; i--) {
        var ennemy = ennemies[i];
        if (player.positionX < ennemy.positionX + ennemy.width &&
            player.positionX + player.width > ennemy.positionX &&
            player.positionY < ennemy.positionY + ennemy.height &&
            player.positionY + player.height > ennemy.positionY) {
            // remove ennemy
            ennemies.splice(i, 1);
            
            return true;
        }
    }
    return false;
}

/**
* Operate movement
*/
function movePlayer() {
    // check if player has moved
    var delta = 2.25 + acceleration + 0.043 * level;
    if (keyLeftPressed && !keyRightPressed) {
        if (player.positionX > delta) {
            player.positionX -= delta;
            if (acceleration <= 7) {
                acceleration += 0.2;
            }
        } else {
            player.positionX = 0;
        }
    }
    if (keyRightPressed && !keyLeftPressed) {
        if (player.positionX < canvas.width - player.width - delta) {
            player.positionX += delta;
            if (acceleration <= 7) {
                acceleration += 0.2;
            }
        } else {
            player.positionX = canvas.width - player.width;
        }
    }
    
    if (isCollision() && !invincible) {
        lives -= 1;
        // play sound
        if (!muted) {
            document.getElementById('failSound').play();
        }

        // invicible frames
        invicibleDelay(1500);
    }
    
    // modify alpha if invincible
    if (invincible) {
        if (player.alphaUp) {
            if (player.alpha >= 0.96) {
                player.alpha = 1.0;
                player.alphaUp = false;
            } else {
                player.alpha += 0.04;
            }
        } else {
            if (player.alpha <= 0.04) {
                player.alpha = 0.0;
                player.alphaUp = true;
            } else {
                player.alpha -= 0.04;
            }
        }
    }
}

/**
* Check if the player gets a bonus
*/
function checkBonuses() {
    for (var i = bonuses.length - 1; i >= 0; i--) {
        var bonus = bonuses[i];
        if (player.positionX < bonus.positionX + 12 &&
            player.positionX + player.width > bonus.positionX - 12&&
            player.positionY < bonus.positionY + 12 &&
            player.positionY + player.height > bonus.positionY - 12) {
            // play sound
            if (!muted) {
                document.getElementById('bonusSound').play();
            }
            
            // if same bonus is active, clear the first one
            if (bonusTimers[bonus.type - 1] != null) { // TODO invincible + bonus  (not hit by an ennemy) -> USE FLAGS !
                bonusTimers[bonus.type - 1].stop();
                bonusTimers[bonus.type - 1] = null;
            }
            lastBonusType = bonus.type;
            
            switch (bonus.type) {
            case 1:
                addBonusPoints(200);
                bonusText = "+ " + 200 * scoreMultiplier;
                break;
            case 2:
                invicibleDelay(8000);
                bonusRemainingTime = 8;
                bonusText = "yolo invicible 8s";
                bonusTimers[1] = $.timer(function (){
                    if (bonusRemainingTime > 0) {
                        bonusRemainingTime -= 1;
                        bonusText = "yolo invicible " + bonusRemainingTime + "s";
                    } else {
                        bonusText = null;
                        if (bonusTimers[1] != null) {
                            bonusTimers[1].stop();
                            bonusTimers[1] = null;
                        }
                    }
                }, 1000, true);
                break;
            case 3:
                if (lives < 10) {
                    lives += 1;
                    bonusText = "+ 1 life";
                } else {
                    bonusText = "full lives " + String.fromCharCode(10084);
                }
                break;
            case 4:
                bonusText = "score x 2";
                scoreMultiplier = 2;
                timerOnce(function () { scoreMultiplier = 1; }, 10000);
                bonusTimers[3] = $.timer(function (){
                    scoreMultiplier = 1;
                    if (bonusTimers[3] != null) {
                        bonusTimers[3].stop();
                        bonusTimers[3] = null;
                    }
                }, 10000, true);
                break;
            default:
                addBonusPoints(100);
                bonusText = "+ 100";
            }
            
            // clear previous text timer
            if (bonusTextTimer != null) {
                bonusTextTimer.stop();
                bonusTextTimer = null;
            }
            
            bonusTextTimer = $.timer(function () { 
                if (bonusTextTimer != null) {
                    bonusTextTimer.stop();
                    bonusTextTimer = null;
                    bonusText = null; 
                }
            }, 1600, true);
            
            // remove bonus
            bonuses.splice(i, 1);
        }
    }
}

/**
* invicibleDelay
*
* @param delay the duration of the invincibility
*/
function invicibleDelay(delay) {
    invincible = true;
    if (timerInvincible != null) {
        timerInvincible.stop();
    }
    timerInvincible = $.timer(function () {invincible = false; player.alpha = 1.0; timerInvincible.stop(); }, delay, true);
}

/**
* Calculate the sum of widths
*
* @param elementList the list of elements
* @return the sum of elements' width
*/
function sumOfWidths(elementList) {
    var sum = 0;
    
    for (var i = 0; i < elementList.length; i++) {
        sum += elementList[i].width;
    }
    
    return sum;
}

/**
* Create a random wave of ennemies
*
* @param ySlowest the y position of the slowest ennemy
*/
function addRandomWave(ySlowest) {
    var waveEnnemies = [];
    
    // Models
    var slow = new Ennemy(2);
    var normal = new Ennemy(3);
    var fast = new Ennemy(1);
    // TODO other types when level higher
    
    var slowestEnnemy;
    
    var spaceForPlayer = {width: parseInt(player.width + 52.56 - level * 0.56), height: -1};
    
    var nb_slow = 0;
    var nb_normal = 0;
    var nb_fast = 0;
    
    var remainingSpace = canvas.width - spaceForPlayer.width;
    
    // put a random number of slow ennemies
    var max = Math.floor(remainingSpace / slow.width);
    nb_slow = Math.floor((Math.random() * (max + 1))); // between 0 and max
    
    remainingSpace -= nb_slow * slow.width;
    
    // put a random number of normal ennemies
    max = Math.floor(remainingSpace / normal.width);
    nb_normal = Math.floor((Math.random() * (max + 1)));
    
    remainingSpace -= nb_normal * normal.width;
    
    // put a random number of fast ennemies
    max = Math.floor(remainingSpace / fast.width);
    nb_fast = Math.floor((Math.random() * (max + 1)));
    
    // store ennemies
    for (var i = 0; i < nb_slow; i++) {
        waveEnnemies.push(new Ennemy(2));
    }
    for (var i = 0; i < nb_normal; i++) {
        waveEnnemies.push(new Ennemy(3));
    }
    for (var i = 0; i < nb_fast; i++) {
        waveEnnemies.push(new Ennemy(1));
    }
    
    // finish simultaneously
    slow.positionY = ySlowest;
    for (var i = 0; i < waveEnnemies.length; i++) {
        SetFinishSimultaneously(slow, waveEnnemies[i]);
    }
    
    var xMin = 0;
    waveEnnemies.push(spaceForPlayer); // push the space as if it was an ennemy, so the player can always go through the wave
    while (waveEnnemies.length > 0) {
        var index = Math.floor((Math.random() * waveEnnemies.length)); // take a random ennemy of the list
        var currentEnnemy = waveEnnemies[index];
        if (currentEnnemy.height != -1) { // if this is a real ennemy
            var xMax = canvas.width - sumOfWidths(waveEnnemies);
            currentEnnemy.positionX = parseInt(Math.floor(Math.random() * (xMax - xMin + 1) + xMin) / 4) * 4; // set a random position
            xMin = currentEnnemy.positionX + currentEnnemy.width + 2;
            ennemies.push(currentEnnemy);
        } else { // if this is the space for the player
            xMin += currentEnnemy.width;
        }
        waveEnnemies.splice(index, 1); // remove ennemy of the temp list
    }
}

/**
* Create a random bonus
*/
function addRandomBonus() {
    var randomNumber = Math.floor(Math.random() * 1000);
    var type;
    if (randomNumber < 450) { // type 1 : 45%
        type = 1;
    } else if (randomNumber < 650) { // type 2 : 20%
        type = 2;
    }else if (randomNumber < 750) { // type 3 : 10%
        type = 3;
    } else { // type 4 : 25%
        type = 4;
    }
    
    var bonus = new Bonus(type);
    bonus.positionX = Math.floor((Math.random() * (canvas.width - bonus.width)));
    bonuses.push(bonus);
}

/**
* Check if the player has enough space to go through the wave without colliding
*
* @param sortedEnnemyList the sorted list of ennemies
* @return true | false
*/
function isPossible(sortedEnnemyList) {
    var enough = player.width + 10;
    if (sortedEnnemyList[0].positionX >= enough) {
        return true;
    }
    for (var i = 1; i < sortedEnnemyList.length - 1 ; i++) {
        if ((sortedEnnemyList[i+1].positionX - (sortedEnnemyList[i].positionX + sortedEnnemyList[i].width)) >= enough) {
            return true;
        }
    }
    var lastEnnemy = sortedEnnemyList[sortedEnnemyList.length - 1];
    if ((canvas.width - (lastEnnemy.positionX + lastEnnemy.width)) >= enough) {
        return true;
    }
    return false;
}

/**
* Trigger next level
*/
function triggerNextLevel() {
    if (timerLevel != null) {
        timerLevel.stop();
        timerLevel = null;
    }
    if (lives > 0 && level < 42) {
        level += 1;
        if (!muted) {
            document.getElementById('blop').play();
        }
        startLevel();
    }
}

/**
* Move canvas left
* 
* @param deltaX the distance in pixels
*/
function moveCanvasLeft(deltaX) {
    var newMargin = parseInt(marginLeft - deltaX),
        minPosition = canvas.width - 800;
    if (newMargin >= minPosition) {
        canvas.style.marginLeft = newMargin + "px";
        marginLeft -= deltaX;
    } else {
        canvas.style.marginLeft = minPosition + "px";
        marginLeft = minPosition;
        canvasMovingRight = true;
    }
}

/**
* Move canvas right
* 
* @param deltaX the distance in pixels
*/
function moveCanvasRight(deltaX) {
    var newMargin = parseInt(marginLeft + deltaX),
        maxPosition = 800 - canvas.width;
    if (newMargin <= maxPosition) {
        canvas.style.marginLeft = newMargin + "px";
        marginLeft += deltaX;
    } else {
        canvas.style.marginLeft = maxPosition + "px";
        marginLeft = maxPosition;
        canvasMovingRight = false;
    }
}

/**
* Move canvas right or left
* 
* @param deltaX the distance in pixels
*/
function moveHorizontaly(deltaX) {
    if (canvasMovingRight) {
        moveCanvasRight(deltaX);
    } else {
        moveCanvasLeft(deltaX);
    }
}

/**
* Move canvas bottom
* 
* @param deltaX the distance in pixels
*/
function moveCanvasBottom(deltaX) {
    var newMargin = parseInt(marginTop + deltaX),
        maxPosition = 600 - canvas.height;
    if (newMargin <= maxPosition) {
        canvas.style.marginTop = newMargin + "px";
        marginTop += deltaX;
    } else {
        canvas.style.marginTop = maxPosition + "px";
        marginTop = maxPosition;
        canvasMovingTop = true;
    }
}

/**
* Move canvas top
* 
* @param deltaX the distance in pixels
*/
function moveCanvasTop(deltaX) {
    var newMargin = parseInt(marginTop - deltaX),
        minPosition = 0;
    if (newMargin >= minPosition) {
        canvas.style.marginTop = newMargin + "px";
        marginTop -= deltaX;
    } else {
        canvas.style.marginTop = minPosition + "px";
        marginTop = minPosition;
        canvasMovingTop = false;
    }
}

/**
* Move canvas top or bottom
* 
* @param deltaX the distance in pixels
*/
function moveVerticaly(deltaX) {
    if (canvasMovingTop) {
        moveCanvasTop(deltaX);
    } else {
        moveCanvasBottom(deltaX);
    }
}

/**
* Move canvas
* 
* @param alpha the angle in degrees
*/
function rotateCanvas(alpha) {
    if (!clockwise) {
        if ((angle + alpha) <= 16) {
            angle += alpha;
        } else {
            angle = 16;
            clockwise = true;
        }
    } else {
        if ((angle - alpha) >= -16) {
            angle -= alpha;
        } else {
            angle = -16;
            clockwise = false;
        }
    }
    var value = "rotate(" + parseInt(angle) + "deg)";
    $("#myCanvas").css({
        "webkitTransform": value,
        "MozTransform": value,
        "msTransform": value,
        "OTransform": value,
        "transform": value
    });
}

/**
* Display the end
*/
function theEnd() {
    // stop timers
    for (var i = 0; i < timers.length; i++) {
        timers[i].stop();
    }
    timers = [];
    
    // remove listeners
    keyLeftPressed = false;
    keyRightPressed = false;
    $(document).off("keydown");
    $(document).off("keyup");
    $(window).off("blur");
    $("#myCanvas").off("click");
    
    // reset rotation
    rotateCanvas(-angle);
    
    // draw screen
    context.globalAlpha=0.8;
    context.fillStyle = "#7575A3";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalAlpha=1;
    
    context.fillStyle = "#868FBF";
    context.strokeStyle = "black";
    context.fillRect(0, 0, canvas.width, 60);
    context.fillRect(0, canvas.height / 2 - 60, canvas.width, 120);
    context.strokeRect(0, 0, canvas.width, 60);
    context.strokeRect(0, canvas.height / 2 - 60, canvas.width, 120);
    context.fillRect(0, canvas.height - 60, canvas.width, 60);
    context.strokeRect(0, canvas.height - 60, canvas.width, 60);
    
    context.fillStyle = "red";
    context.font = "36px Arial Black";
    context.textAlign = "center";
    if (level == 42) {
        context.fillText("YOU WON!", canvas.width  / 2, 40);
    } else {
        context.fillText("GAME OVER", canvas.width  / 2, 40);
    }
    context.textAlign = "left";
    
    context.fillStyle = "#006B24";
    context.font = "24px Arial Black";
    
    drawMute();
    
    context.fillText("Your score: " + score, 30, canvas.height / 2 - 20);
    
    context.fillText("Level reached: " + level, 30, canvas.height / 2 + 30);
    
    context.fillStyle = "#e5f1ef";
    context.fillRect(20, canvas.height - 45, canvas.width / 2 - 40, 30);
    context.strokeRect(20, canvas.height - 45, canvas.width / 2 - 40, 30);
    context.fillRect(canvas.width / 2 + 20, canvas.height - 45, canvas.width / 2 - 40, 30);
    context.strokeRect(canvas.width / 2 + 20, canvas.height - 45, canvas.width / 2 - 40, 30);
    
    context.fillStyle = "black";
    context.font = "22px Arial Black";
    context.textAlign = "center";
    context.fillText("Share score", canvas.width / 4, canvas.height - 25);
    context.fillText("Play again", 3 * canvas.width / 4, canvas.height - 25);
    context.textAlign = "left";
    
    // manage clicks
    $("#myCanvas").on("click", function (e) {
        var pos = getMousePos(canvas, e);
        
        if (pos.y >= canvas.height - 50 && pos.y <= canvas.height - 10) {
            if (pos.x >= 15 && pos.x <= canvas.width / 2 - 35) { // share score
                var tweetText = "I%20reached%20level%20" + level + "%20and%20scored%20" + score +
                    "%20points%20at%20Saving%20Private%20Redsquare!%20http://bit.ly/1VPxa17";
                $("#shareScore").attr("href", "https://twitter.com/intent/tweet?text=" + tweetText + "&hashtags=SPRedsquare");
                $("#shareScore")[0].click();
            } else if (pos.x >= canvas.width / 2 + 15 && pos.x <= canvas.width - 15) { // replay 
                init();
                $("#myCanvas").off("click");
                startGame();
            }
        } else if (pos.x >= 8 && pos.x <= 42 && pos.y >= 1 && pos.y <= 41) { // (un)mute sound
            toggleMute();
            
            context.fillStyle = "#868FBF";
            context.fillRect(2, 2, 48, 48);
            drawMute();
        }
    });
}

/**
* Reset timers, ennemies, bonuses, but keep player and level infos
*/
function resetAll() {
    // stop timers
    for (var i = 0; i < timers.length; i++) {
        timers[i].stop();
    }
    
    timers = [];
    ennemies = [];
    bonuses = [];
    
    if (canvasGrowingTimer != null) {
        canvasGrowingTimer.stop();
        canvasGrowingTimer = null;
    }
    if (timerLevel != null) {
        timerLevel.stop();
        timerLevel = null;
    }
    for (var i = 0; i < bonusTimers.length; i++) {
        if (bonusTimers[i] != null) {
            bonusTimers[i].stop();
            bonusTimers[i] = null;
        }
    }
    if (bonusTextTimer != null) {
        bonusTextTimer.stop();
        bonusTextTimer = null;
    }
    if (timerInvincible != null) {
        timerInvincible.stop();
        timerInvincible = null;
    }
    
    // clear bonus effects
    invincible = false;
    scoreMultiplier = 1;
    player.alpha = 1.0;
}

/**
* get the mouse position on a mouse event
*/
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

/**
* checks if the player collides with a circle
* @param x the x position of the center of the circle
* @param y the y position of the center of the circle
* @param radius the radius of the circle
* @return true if collision
*/
function isCollisionWithCircle(xc, yc, radius) {
    var w = player.width / 2,
        h = player.height / 2;
    
    var centerPlayer = {
        x: player.positionX + w,
        y: player.positionY + h
    };
    
    var dx = Math.abs(xc - centerPlayer.x),
        dy = Math.abs(yc - centerPlayer.y);
    
    if (dx > (radius + w) || dy > (radius + h)) {
        return false;
    }
    
    var circleDistance = {
        x: Math.abs(xc - player.positionX - player.width),
        y: Math.abs(yc - player.positionY - player.height)
    };
    
    if (circleDistance.x <= w || circleDistance.y <= h) {
        return true
    }
    
    var cornerDistanceSquare = Math.pow(circleDistance.x - w, 2) + Math.pow(circleDistance.y - h, 2);
    
    return (cornerDistanceSquare <= Math.pow(radius, 2));
}

/*
* BOSSES
*/

/**
* Initiate the first boss
*/
function bossLevel10() { // TODO animate arrival, reduce size
    // remove ennemies and bonuses
    resetAll();
    
    // instanciate Boss
    boss = new Boss1();
    
    drawBoss1();
    
    startPhaseBoss1(1);
    
    // game loop
    if (refreshTimer != null) {
        clearInterval(refreshTimer);
    }
    refreshTimer = setInterval(function () {
        if (!isPause && !screenTooSmall) {
            requestAnimId = window.requestAnimationFrame(refreshBoss1);
        }
    }, 1000 / fps);
}

/**
* Initiate the second boss
*/
function bossLevel20() {
    // remove ennemies and bonuses
    resetAll();
    
    // instanciate Boss
    boss = new Boss2();
    
    drawBoss2();
    
    startPhaseBoss2(1);
    
    // game loop
    if (refreshTimer != null) {
        clearInterval(refreshTimer);
    }
    refreshTimer = setInterval(function () {
        if (!isPause && !screenTooSmall) {
            requestAnimId = window.requestAnimationFrame(refreshBoss2);
        }
    }, 1000 / fps);
}

/*
* Initiate the third boss
*/
function bossLevel30() {
    // remove ennemies and bonuses
    resetAll();
    
    // instanciate Boss
    boss = new Boss3();
    
    drawBoss3();
    
    startPhaseBoss3(1);
    
    // game loop
    if (refreshTimer != null) {
        clearInterval(refreshTimer);
    }
    refreshTimer = setInterval(function () {
        if (!isPause && !screenTooSmall) {
            requestAnimId = window.requestAnimationFrame(refreshBoss3);
        }
    }, 1000 / fps);
}

/*
* Initiate the final boss
*/
function finalBoss() {
    // remove ennemies and bonuses
    resetAll();
    
    // instanciate Boss
    boss = new FinalBoss();
    
    // reset angle of canvas
    rotateCanvas(-angle);
    
    drawFinalBoss();
    
    startPhaseFinalBoss(1);
    
    // game loop
    if (refreshTimer != null) {
        clearInterval(refreshTimer);
    }
    refreshTimer = setInterval(function () {
        if (!isPause && !screenTooSmall) {
            requestAnimId = window.requestAnimationFrame(refreshFinalBoss);
        }
    }, 1000 / fps);
}

/*
* Trigger the final level
*/
function level42() {
    // remove ennemies and bonuses
    resetAll();
    
    boss = new Chest();
    
    // draw chest
    drawChest();
    
    // Generate coins timers
    timers.push($.timer(function () {
        var randomNumber = Math.floor(Math.random() * 1000),
            aiming = {x: Math.floor(Math.random() * canvas.width), y: canvas.height + 120},
            randomX = canvas.width / 2 + Math.floor(Math.random() * 240) - 120;
        
        if (randomNumber < 500) { // bronze coin
            boss.bronzeCoins.push({x: randomX, y: 140, target: aiming});
        } else if (randomNumber < 720) { // silver coin
            boss.silverCoins.push({x: randomX, y: 140, target: aiming});
        } else if (randomNumber < 920) { // gold coin
            boss.goldenCoins.push({x: randomX, y: 140, target: aiming});
        } else { // platinium coin
            boss.platiniumCoins.push({x: randomX, y: 140, target: aiming});
        }
    }, 100, true));
    
    // Trigger the end of the game
    timerOnce(function () {
        boss.ended = true;
    }, 10000);
    
    // game loop
    if (refreshTimer != null) {
        clearInterval(refreshTimer);
    }
    refreshTimer = setInterval(function () {
        if (!isPause && !screenTooSmall) {
            requestAnimId = window.requestAnimationFrame(refreshLevel42);
        }
    }, 1000 / fps);
}

/**
* Start boss 1 phase
* @param phase the phase to start
*/
function startPhaseBoss1(phase) {
    
    // remove tentacles and phase timers
    boss.tentacles = [];
    for (var i = 0; i < timers.length; i++) {
        timers[i].stop();
    }
    timers = [];
    
    // switch phase
    boss.phase = phase;
    
    switch (phase) {
    case 1:
        timers.push($.timer(function () {
            var randomX = Math.random() * (canvas.width - 36);
            boss.tentacles.push({x: randomX, y: 400.0, w: 36.0, h: 1.0, top: false, bot: true, left: false, right: false});
        }, 1150, true));
        
        // start phase 2
        timers.push($.timer(function () {
            startPhaseBoss1(2);
        }, 15000, true));
        break;
    case 2:
        addBonusPoints(250);
        boss.tentacles.push({x: 40, y: 400.0, w: 48.0, h: 0.1, top: false, bot: false, left: false, right: false});
        boss.tentacles.push({x: canvas.width - 88, y: 400.0, w: 48.0, h: 0.1, top: false, bot: false, left: false, right: false});
        // TODO use timerOnce(..., ...)
        var timerTentacle1 = $.timer(function () {
            boss.tentacles[0].bot = true;
            timerTentacle1.stop();
        }, 2000, true);
            
        var timerTentacle2 = $.timer(function () {
            boss.tentacles[1].bot = true;
            timerTentacle2.stop();
        }, 4000, true);
            
        var timerTentacle3 = $.timer(function () {
            boss.tentacles[0].right = true;
            timerTentacle3.stop();
        }, 6000, true);
            
        var timerTentacle4 = $.timer(function () {
            boss.tentacles[1].left = true;
            timerTentacle4.stop();
        }, 6000, true);
        
        timers.push(timerTentacle1, timerTentacle2, timerTentacle3, timerTentacle4);
            
        // start phase 3
        timers.push($.timer(function () {
            startPhaseBoss1(3);
        }, 25000, true));
        break;
    case 3:
        addBonusPoints(250);
        var nbTentaculesMax = parseInt((canvas.width - player.width - 36) / 36); // should be 10
            
        // wave of tentacles from left to right
        for (var i = 0; i < nbTentaculesMax; i++) {
            boss.tentacles.push({x: 40 * i, y: 400.0, w: 36.0, h: 0.1, top: false, bot: false, left: false, right: false});
        }
        timerOnce(function () {boss.tentacles[0].bot = true;}, 250);
        timerOnce(function () {boss.tentacles[1].bot = true;}, 500);
        timerOnce(function () {boss.tentacles[2].bot = true;}, 750);
        timerOnce(function () {boss.tentacles[3].bot = true;}, 1000);
        timerOnce(function () {boss.tentacles[4].bot = true;}, 1250);
        timerOnce(function () {boss.tentacles[5].bot = true;}, 1500);
        timerOnce(function () {boss.tentacles[6].bot = true;}, 1750);
        timerOnce(function () {boss.tentacles[7].bot = true;}, 2000);
        timerOnce(function () {boss.tentacles[8].bot = true;}, 2250);
        timerOnce(function () {boss.tentacles[9].bot = true;}, 2500);
            
        // remove slowly the tentacles
        var clearTimer = $.timer(function () {
            for (var i = boss.tentacles.length - 1; i >= 0; i--) {
                boss.tentacles[i].top = true;
            }
        }, 5000, true);
        timers.push(clearTimer);
            
        // wave of tentacles from right to left
        timers.push($.timer(function () {
            boss.tentacles = []; // remove tentacles
            for (var i = nbTentaculesMax - 1; i >= 0; i--) {
                var xPos = canvas.width - 40.0 * (nbTentaculesMax - i);
                boss.tentacles.push({x: xPos, y: 400.0, w: 36.0, h: 0.1, top: false, bot: false, left: false, right: false});
            }
        }, 7500, true));
        timerOnce(function () {boss.tentacles[0].bot = true;}, 7750);
        timerOnce(function () {boss.tentacles[1].bot = true;}, 8000);
        timerOnce(function () {boss.tentacles[2].bot = true;}, 8250);
        timerOnce(function () {boss.tentacles[3].bot = true;}, 8500);
        timerOnce(function () {boss.tentacles[4].bot = true;}, 8750);
        timerOnce(function () {boss.tentacles[5].bot = true;}, 9000);
        timerOnce(function () {boss.tentacles[6].bot = true;}, 9250);
        timerOnce(function () {boss.tentacles[7].bot = true;}, 9500);
        timerOnce(function () {boss.tentacles[8].bot = true;}, 9750);
        timerOnce(function () {boss.tentacles[9].bot = true;}, 10000);
            
        // remove slowly the tentacles
        var clearTimer = $.timer(function () {
            for (var i = boss.tentacles.length - 1; i >= 0; i--) {
                boss.tentacles[i].top = true;
            }
        }, 13000, true);
        timers.push(clearTimer);
            
        // start level 11
        timers.push($.timer(function () {
            level += 1;
            resetAll();
            addBonusPoints(250);
            // game loop
            if (refreshTimer != null) {
                clearInterval(refreshTimer);
            }
            refreshTimer = setInterval(function () {
                if (!isPause && !screenTooSmall) {
                    requestAnimId = window.requestAnimationFrame(game);
                }
            }, 1000 / fps);
            startLevel();
        }, 18000, true));
        break;
    }
}

/**
* Start boss 2 phase
* @param phase the phase to start
*/
function startPhaseBoss2(phase) {
    timers = [];
    
    // switch phase
    boss.previousPhase = boss.phase;
    boss.phase = phase;
    
    switch (phase) {
    case 1:
        boss.directions.right = true;
        break;
            
    case 2:
        addBonusPoints(250);
        timers.push($.timer(function () {
            boss.minions.push({x: 0, y: 0, angle: boss.angle, direction: 0});
            boss.minions.push({x: 0, y: 0, angle: boss.angle, direction: 1});
            boss.minions.push({x: 0, y: 0, angle: boss.angle, direction: 2});
            boss.minions.push({x: 0, y: 0, angle: boss.angle, direction: 3});
        }, 650, true));
            
        timerOnce(function () {
            timers.push($.timer(function () {
                boss.minions.push({x: 0, y: 0, angle: boss.angle, direction: 0});
                boss.minions.push({x: 0, y: 0, angle: boss.angle, direction: 1});
                boss.minions.push({x: 0, y: 0, angle: boss.angle, direction: 2});
                boss.minions.push({x: 0, y: 0, angle: boss.angle, direction: 3});
            }, 1950, true));
        }, 975);
            
        timerOnce(function () {
            startPhaseBoss2(5);
        }, 21000);
            
        break;
            
    case 3:
        addBonusPoints(250);
        boss.directions.top = true;
        boss.directions.bot = false;
            
        timers.push($.timer(function () {
            boss.shadows.push({x: Math.random() * canvas.width, y: -50.0, w: 64, h: 96});
        }, 360, true));
            
        timerOnce(function () {
            boss.coord.x = player.positionX + player.width / 2; // aim player
            boss.directions.bot = true;
        }, 20000);
            
        break;
            
    case 4:
        addBonusPoints(500);
        var bx = boss.coord.x,
            by = boss.coord.y, 
            bw = boss.w / 2,
            bh = boss.h / 2;
        timerOnce(function () {
            boss.guards.push({x: bx + bw + 30, y: by, aiming: {x: 0, y: 0}, dx: 0, dy: 0}); 
        }, 350);
        timerOnce(function () {
            boss.guards.push({x: bx + bw + 15, y: by - bh + 15, aiming: {x: 0, y: 0}, dx: 0, dy: 0}); 
        }, 700);
        timerOnce(function () {
            boss.guards.push({x: bx, y: by - bh - 30, aiming: {x: 0, y: 0}, dx: 0, dy: 0}); 
        }, 1050);
        timerOnce(function () {
            boss.guards.push({x: bx - bw - 15, y: by - bh + 15, aiming: {x: 0, y: 0}, dx: 0, dy: 0}); 
        }, 1400);
        timerOnce(function () {
            boss.guards.push({x: bx - bw - 30, y: by, aiming: {x: 0, y: 0}, dx: 0, dy: 0}); 
        }, 1750);
        timerOnce(function () {
            boss.guards.push({x: bx - bw - 15, y: by + bh - 15, aiming: {x: 0, y: 0}, dx: 0, dy: 0}); 
        }, 2100);
        timerOnce(function () {
            boss.guards.push({x: bx, y: by + bh + 30, aiming: {x: 0, y: 0}, dx: 0, dy: 0}); 
        }, 2450);
        timerOnce(function () {
            boss.guards.push({x: bx + bw + 15, y: by + bh - 15, aiming: {x: 0, y: 0}, dx: 0, dy: 0}); 
        }, 2800);
            
        // attack
        timerOnce(function () {
            timers.push($.timer(function () {
                if (boss.guards.length > 0) {
                    var index = boss.guards[0].aiming.y > 0 ? 1 : 0;
                    if (boss.guards.length > index) {
                        boss.guards[index].aiming.x = player.positionX + player.width / 2;
                        boss.guards[index].aiming.y = player.positionY + player.height / 2;

                        // set dx and dy
                        var ratio = 12.4 / Math.sqrt(Math.pow(boss.guards[index].aiming.x - boss.guards[index].x, 2) + 
                                                Math.pow(boss.guards[index].aiming.y - boss.guards[index].y, 2));
                        boss.guards[index].dx = (boss.guards[index].aiming.x - boss.guards[index].x) * ratio;
                        boss.guards[index].dy = (boss.guards[index].aiming.y - boss.guards[index].y) * ratio;
                    }
                }
            }, 1000, true));
        }, 3800);
            
        timerOnce(function () {
            boss.directions.bot = true;
        }, 18000);
            
        break;
            
    case 5:
        // go back to initial position
        if (boss.coord.x > 277) {
            boss.directions.left = true;
            boss.directions.right = false;
        } else {
            boss.directions.left = false;
            boss.directions.right = true;
        }
        if (boss.coord.y > 160) {
            boss.directions.bot = false;
            boss.directions.top = true;
        } else {
            boss.directions.bot = true;
            boss.directions.top = false;
        }
        
        // initial angle
        while (boss.angle > Math.PI) {
            boss.angle -= Math.PI;
        }
        
        // reset minions
        boss.minions = [];
            
        // reset shadows
        boss.shadows = [];
            
        break;
    }
}

/**
* Start boss 3 phase
* @param phase the phase to start
*/
function startPhaseBoss3(phase) {
    timers = [];
    boss.triangles = [];
    // switch phase
    boss.phase = phase;
    
    switch (phase) {
    case 1:
        var w = canvas.width,
            midL = (w - 280) / 2,
            midR = w - midL;
        boss.triangles.push([{x: 0, y: 0}, {x: midL, y: -600}, {x: 0, y: -600}]);
        boss.triangles.push([{x: w, y: 0}, {x: midR, y: -600}, {x: w, y: -600}]);
        
        boss.triangles.push([{x: 0, y: -600}, {x: midL, y: -600}, {x: midL, y: -1600}]);
        boss.triangles.push([{x: 0, y: -600}, {x: midL, y: -1600}, {x: 0, y: -1600}]);
        boss.triangles.push([{x: w, y: -600}, {x: midR, y: -600}, {x: w, y: -1600}]);
        boss.triangles.push([{x: midR, y: -600}, {x: midR, y: -1600}, {x: w, y: -1600}]);

        boss.triangles.push([{x: 0, y: -1600}, {x: midL, y: -1600}, {x: 0, y: -1800}]);
        boss.triangles.push([{x: midR, y: -1598}, {x: 280, y: -1800}, {x: w, y: -1998}]);
        boss.triangles.push([{x: midR, y: -1600}, {x: w, y: -1600}, {x: w, y: -2000}]);  

        boss.triangles.push([{x: 0, y: -1800}, {x: w - 280, y: -2000}, {x: 0, y: -2200}]);
        boss.triangles.push([{x: w, y: -2000}, {x: 280, y: -2200}, {x: w, y: -2400}]);
            
        boss.triangles.push([{x: 0, y: -2200}, {x: w - 280, y: -2400}, {x: 210, y: -2500}]);
        boss.triangles.push([{x: 0, y: -2200}, {x: 210, y: -2500}, {x: 0, y: -2500}]);
        boss.triangles.push([{x: 210, y: -2700}, {x: 210, y: -2500}, {x: 0, y: -2500}]);
        boss.triangles.push([{x: 210, y: -2698}, {x: 0, y: -3300}, {x: 0, y: -2498}]);
            
        boss.triangles.push([{x: w, y: -2400}, {x: w - 210, y: -2500}, {x: w - 210, y: -2700}]);
        boss.triangles.push([{x: w, y: -2400}, {x: w - 210, y: -2700}, {x: w, y: -3300}]);
            
        timerOnce(function () {
            startPhaseBoss3(2);
        }, 16000);
            
        break;
    case 2:
        addBonusPoints(500);
        boss.speed = 4.3;
            
        var w = canvas.width,
            midL = (w - 240) / 2,
            midR = w - midL;
        boss.triangles.push([{x: 0, y: 0}, {x: midL, y: -400}, {x: 0, y: -800}]);
        boss.triangles.push([{x: w, y: 0}, {x: midR, y: -400}, {x: w, y: -800}]);
        
        boss.triangles.push([{x: 0, y: -800}, {x: midL + 40, y: -1200}, {x: 0, y: -1400}]);
        boss.triangles.push([{x: w, y: -800}, {x: midR - 40, y: -1200}, {x: w, y: -1400}]);
        boss.triangles.push([{x: midL + 40, y: -1402}, {x: midL + 40, y: -1198}, {x: 0, y: -1402}]);
        boss.triangles.push([{x: midR - 40, y: -1402}, {x: midR - 40, y: -1198}, {x: w, y: -1402}]);
        boss.triangles.push([{x: midL + 40, y: -1400}, {x: midL - 120, y: -1550}, {x: 0, y: -1400}]);
        boss.triangles.push([{x: midR - 40, y: -1400}, {x: midR + 120, y: -1550}, {x: w, y: -1400}]);
        boss.triangles.push([{x: 0, y: -1550}, {x: midL - 120, y: -1550}, {x: 0, y: -1400}]);
        boss.triangles.push([{x: w, y: -1550}, {x: midR + 120, y: -1550}, {x: w, y: -1400}]);
        boss.triangles.push([{x: 0, y: -1552}, {x: midL - 120, y: -1548}, {x: midL + 40, y: -1702}]);
        boss.triangles.push([{x: w, y: -1552}, {x: midR + 120, y: -1548}, {x: midR - 40, y: -1702}]);
        boss.triangles.push([{x: 0, y: -1550}, {x: midL + 40, y: -1800}, {x: midL + 40, y: -1700}]);
        boss.triangles.push([{x: w, y: -1550}, {x: midR - 40, y: -1800}, {x: midR - 40, y: -1700}]);
        boss.triangles.push([{x: 0, y: -1548}, {x: midL + 40, y: -1800}, {x: midL - 142, y: -2002}]);
        boss.triangles.push([{x: w, y: -1548}, {x: midR - 40, y: -1800}, {x: midR + 142, y: -2002}]);
        boss.triangles.push([{x: 0, y: -1548}, {x: 0, y: -2000}, {x: midL - 139, y: -2000}]);
        boss.triangles.push([{x: w, y: -1548}, {x: w, y: -2000}, {x: midR + 139, y: -2000}]);
        boss.triangles.push([{x: midL, y: -2200}, {x: 0, y: -2000}, {x: midL - 140, y: -2000}]);
        boss.triangles.push([{x: midR, y: -2200}, {x: w, y: -2000}, {x: midR + 140, y: -2000}]);
        boss.triangles.push([{x: midL, y: -2200}, {x: 0, y: -2000}, {x: midL, y: -2300}]);
        boss.triangles.push([{x: midR, y: -2200}, {x: w, y: -2000}, {x: midR, y: -2300}]);
        boss.triangles.push([{x: 0, y: -2700}, {x: 0, y: -2000}, {x: midL, y: -2300}]);
        boss.triangles.push([{x: w, y: -2700}, {x: w, y: -2000}, {x: midR, y: -2300}]);
            
        boss.triangles.push([{x: 180, y: -800}, {x: w / 2, y: -560}, {x: w - 180, y: -800}]);
        boss.triangles.push([{x: 180, y: -798}, {x: w / 2, y: -1040}, {x: w - 180, y: -798}]);
            
        boss.triangles.push([{x: (w / 2) - 60, y: -1550}, {x: w / 2, y: -1520}, {x: (w / 2) + 60, y: -1550}]);
        boss.triangles.push([{x: (w / 2) - 60, y: -1548}, {x: w / 2, y: -1580}, {x: (w / 2) + 60, y: -1548}]);
            
        boss.triangles.push([{x: (w / 2) - 80, y: -1998}, {x: w / 2, y: -2040}, {x: (w / 2) + 80, y: -1998}]);
        boss.triangles.push([{x: (w / 2) - 80, y: -2000}, {x: w / 2, y: -1960}, {x: (w / 2) + 80, y: -2000}]);
            
        timerOnce(function () {
            startPhaseBoss3(3);
        }, 14000);    
           
        break;
            
    case 3:
        addBonusPoints(500);
        boss.speed = 3.1;
        
        var wc = canvas.width;
            
        boss.lines.push({y: -400});
        boss.lines.push({y: -800});
        boss.lines.push({y: -2700});
            
        boss.rectangles.push({x: 0, y: -3100, w: 116, h:3100, color: "#0e0e0e"});
        boss.rectangles.push({x: wc - 116, y: -3100, w: 116, h:3100, color: "#0e0e0e"});
            
        boss.rectangles.push({x: 196, y: -1300, w: 80, h:200, color: "#0e0e0e"});
        boss.rectangles.push({x: wc - 276, y: -1300, w: 80, h:200, color: "#0e0e0e"});
            
        boss.rectangles.push({x: 116, y: -1700, w: 60, h:100, color: "#0e0e0e"});
        boss.rectangles.push({x: wc - 176, y: -1700, w: 60, h:100, color: "#0e0e0e"});
        boss.rectangles.push({x: 116, y: -2000, w: 110, h:100, color: "#0e0e0e"});
        boss.rectangles.push({x: wc - 226, y: -2000, w: 110, h:100, color: "#0e0e0e"});
        boss.rectangles.push({x: 116, y: -2300, w: 160, h:100, color: "#0e0e0e"});
        boss.rectangles.push({x: wc - 276, y: -2300, w: 160, h:100, color: "#0e0e0e"});
            
        timers.push($.timer(function () {
            boss.losanges.push({x: -50, y: boss.lines[0].y, w: 90, h: 150});
            boss.losanges.push({x: wc + 150, y: boss.lines[1].y, w: 90, h: 150});
            boss.losanges.push({x: -100, y: boss.lines[2].y, w: 100, h: 180});
        }, 1800, true));
            
        timerOnce(function () {
            startPhaseBoss3(4);
        }, 20000); 
        
        break;
            
    case 4:
        addBonusPoints(750);
        for (var i = 0; i < 24; i++) {
            for (var j = 0; j < 20; j++) {
                boss.rectangles.push({x: 50 + j * 160, y: -100 - i * 160, w: 16, h:16, color: "#0e0efe"});
            }
        }
           
        // start level 31
        timers.push($.timer(function () {
            level += 1;
            resetAll();
            addBonusPoints(750);
            // game loop
            if (refreshTimer != null) {
                clearInterval(refreshTimer);
            }
            refreshTimer = setInterval(function () {
                if (!isPause && !screenTooSmall) {
                    requestAnimId = window.requestAnimationFrame(game);
                }
            }, 1000 / fps);
            startLevel();
        }, 26000, true));
        break;
    }
}

/**
* Start final boss phase
* @param phase the phase to start
*/
function startPhaseFinalBoss(phase) {
    // stop timers
    for (var i = 0; i < timers.length; i++) {
        timers[i].stop();
    }
    timers = [];
    boss.waves = [];
    boss.bullets = [];
    // switch phase
    boss.phase = phase;
    
    switch (phase) {
    case 1:
        // move boss
        timerOnce(function () {
            boss.directions.top = true;
        }, 1500);
            
        // wave 1
        timerOnce(function () {
            var wave1 = {
                waveInfo: {w: 70, h: 40, speed: 14.0, color: "#6495ED", moving: false},
                minions: [{x: 10, y: -20}, {x: 100, y: -20}, {x: 190, y: -20}, 
                          {x: 280, y: -20}, {x: 370, y: -20}, {x: 460, y: -20}, {x: 640, y: -20}]
            };
            boss.waves.push(wave1);
        }, 3000);
            
        timerOnce(function () {
            if (boss.waves.length > 0) {
                boss.waves[0].waveInfo.moving = true;
            }
        }, 4000);
            
        // wave 2
        timerOnce(function () {
            var wave2 = {
                waveInfo: {w: 70, h: 40, speed: 16.0, color: "#2E8B57", moving: false},
                minions: [{x: 10, y: -20}, {x: 100, y: -20}, {x: 280, y: -20}, {x: 370, y: -20}, 
                          {x: 460, y: -20}, {x: 550, y: -20}, {x: 640, y: -20}]
            };
            boss.waves.push(wave2);
        }, 6000);
            
        timerOnce(function () {
            if (boss.waves.length > 1) {
                boss.waves[1].waveInfo.moving = true;
            }
        }, 7000);
            
        // wave 3
        timerOnce(function () {
            var wave3 = {
                waveInfo: {w: 70, h: 40, speed: 16.0, color: "#DC143C", moving: false},
                minions: [{x: 60, y: -20}, {x: 190, y: -20}, {x: 280, y: -20}, {x: 370, y: -20}, {x: 460, y: -20}, {x: 550, y: -20}]
            };
            boss.waves.push(wave3);
        }, 9000);
            
        timerOnce(function () {
            if (boss.waves.length > 2) {
                boss.waves[2].waveInfo.moving = true;
            }
        }, 9950);
            
        // wave 4
        timerOnce(function () {
            var wave4 = {
                waveInfo: {w: 70, h: 40, speed: 16.0, color: "#FFD700", moving: false},
                minions: [{x: 10, y: -20}, {x: 100, y: -20}, {x: 190, y: -20}, {x: 280, y: -20}, 
                          {x: 460, y: -20}, {x: 550, y: -20}, {x: 640, y: -20}]
            };
            boss.waves.push(wave4);
        }, 11500);
            
        timerOnce(function () {
            if (boss.waves.length > 3) {
                boss.waves[3].waveInfo.moving = true;
            }
        }, 12400);
            
        // wave 5
        timerOnce(function () {
            var wave5 = {
                waveInfo: {w: 70, h: 40, speed: 16.0, color: "#4B0082", moving: false},
                minions: [{x: 10, y: -20}, {x: 190, y: -20}, {x: 280, y: -20}, {x: 370, y: -20}, {x: 460, y: -20},
                          {x: 550, y: -20}, {x: 640, y: -20}]
            };
            boss.waves.push(wave5);
        }, 13500);
            
        timerOnce(function () {
            if (boss.waves.length > 4) {
                boss.waves[4].waveInfo.moving = true;
            }
        }, 14400);
            
        // wave 6
        timerOnce(function () {
            var wave6 = {
                waveInfo: {w: 70, h: 40, speed: 17.0, color: "#9ACD32", moving: false},
                minions: [{x: 10, y: -20}, {x: 100, y: -20}, {x: 190, y: -20}, {x: 280, y: -20}, {x: 370, y: -20},
                          {x: 550, y: -20}, {x: 640, y: -20}]
            };
            boss.waves.push(wave6);
        }, 15200);
            
        timerOnce(function () {
            if (boss.waves.length > 5) {
                boss.waves[5].waveInfo.moving = true;
            }
        }, 16000);
            
        // waves 7-14 : skull
        timerOnce(function () {
            var yw = - 1160; // TO FIX don't use the same waveX.waveInfo.y
            var info = {y: - 320, w: 60, h: 40, speed: 8.0, color: "black", moving: false},
                wave7 = {waveInfo: info, minions: [{x: 285, y: -320}, {x: 375, y: -320}]},
                wave8 = {waveInfo: info, minions: [{x: 225, y: -280}, {x: 435, y: -280}]},
                wave9 = {waveInfo: info, minions: [{x: 165, y: -240}, {x: 330, y: -240}, {x: 495, y: -240}]},
                wave10 = {waveInfo: info, minions: [{x: 165, y: -200}, {x: 330, y: -200}, {x: 495, y: -200}]},
                wave11 = {waveInfo: info, minions: [{x: 225, y: -160}, {x: 285, y: -160}, {x: 375, y: -160}, {x: 435, y: -160}]},
                wave12 = {waveInfo: info, minions: [{x: 270, y: -120}, {x: 330, y: -120}, {x: 390, y: -120}]},
                wave13 = {waveInfo: info, minions: [{x: 270, y: -80}, {x: 330, y: -80}, {x: 390, y: -80}]},
                wave14 = {waveInfo: info, minions: [{x: 270, y: -40}, {x: 390, y: -40}]};
            boss.waves.push(wave7);
            boss.waves.push(wave8);
            boss.waves.push(wave9);
            boss.waves.push(wave10);
            boss.waves.push(wave11);
            boss.waves.push(wave12);
            boss.waves.push(wave13);
            boss.waves.push(wave14);
        }, 17500);
            
        timerOnce(function () {
            if (boss.waves.length > 13) {
                boss.waves[6].waveInfo.moving = true;
                boss.waves[7].waveInfo.moving = true;
                boss.waves[8].waveInfo.moving = true;
                boss.waves[9].waveInfo.moving = true;
                boss.waves[10].waveInfo.moving = true;
                boss.waves[11].waveInfo.moving = true;
                boss.waves[12].waveInfo.moving = true;
                boss.waves[13].waveInfo.moving = true;
            }
        }, 18000);
        
        // start phase 2
        timerOnce(function () {
            startPhaseFinalBoss(2);
        }, 22000);
            
        break;
    case 2:
        addBonusPoints(500);
        // wave 1
        timerOnce(function () {
            var wave1 = {
                waveInfo: {w: 60, h: 20, speed: 12, color: "#6495ED", moving: true},
                minions: [{x: 70, y: -290},
                          {x: 35, y: -260}, {x: 105, y: -260},
                          {x: 0, y: -230}, {x: 70, y: -230}, {x: 140, y: -230},
                          {x: -35, y: -200}, {x: 35, y: -200}, {x: 105, y: -200}, {x: 175, y: -200},
                          {x: -70, y: -170}, {x: 0, y: -170}, {x: 70, y: -170}, {x: 140, y: -170}, {x: 210, y: -170}, 
                          {x: -70, y: -140}, {x: 0, y: -140}, {x: 70, y: -140}, {x: 140, y: -140}, {x: 210, y: -140}, 
                          {x: -35, y: -110}, {x: 35, y: -110}, {x: 105, y: -110}, {x: 175, y: -110},
                          {x: 0, y: -80}, {x: 70, y: -80}, {x: 140, y: -80},
                          {x: 35, y: -50}, {x: 105, y: -50},
                          {x: 70, y: -20},
                         ]
            };
            boss.waves.push(wave1);
        }, 1000);
            
        // wave 2
        timerOnce(function () {
            var wc = canvas.width;
            var wave2 = {
                waveInfo: {w: 60, h: 20, speed: 12, color: "#2E8B57", moving: true},
                minions: [{x: wc - 70, y: -290},
                          {x: wc - 35, y: -260}, {x: wc - 105, y: -260},
                          {x: wc - 0, y: -230}, {x: wc - 70, y: -230}, {x: wc - 140, y: -230},
                          {x: wc + 35, y: -200}, {x: wc - 35, y: -200}, {x: wc - 105, y: -200}, {x: wc - 175, y: -200},
                          {x: wc + 70, y: -170}, {x: wc - 0, y: -170}, {x: wc - 70, y: -170}, {x: wc - 140, y: -170}, {x: wc - 210, y: -170}, 
                          {x: wc + 70, y: -140}, {x: wc - 0, y: -140}, {x: wc - 70, y: -140}, {x: wc - 140, y: -140}, {x: wc - 210, y: -140}, 
                          {x: wc + 35, y: -110}, {x: wc - 35, y: -110}, {x: wc - 105, y: -110}, {x: wc - 175, y: -110},
                          {x: wc - 0, y: -80}, {x: wc - 70, y: -80}, {x: wc - 140, y: -80},
                          {x: wc - 35, y: -50}, {x: wc - 105, y: -50},
                          {x: wc - 70, y: -20},
                         ]
            };
            boss.waves.push(wave2);
        }, 3000);
            
        var wave3 = {
                waveInfo: {w: 20, h: 15, speed: 8, color: "#DC143C", moving: true},
                minions: []
            },
            wave4 = {
                waveInfo: {w: 20, h: 15, speed: 8, color: "#4B0082", moving: true},
                minions: []
            },
            wave5 = {
                waveInfo: {w: 20, h: 15, speed: 8, color: "#DC143C", moving: true},
                minions: []
            },
            wave6 = {
                waveInfo: {w: 20, h: 15, speed: 8, color: "#4B0082", moving: true},
                minions: []
            };
        for (var i = 0; i < 10; i++) {
            for (var j = 0; j < 24; j++) {
                wave3.minions.push({x: -240 + i * 260 - j * 40, y: - 20 - j * 30});
                wave4.minions.push({x: -240 + i * 260 + j * 40, y: - 20 - j * 30});
                
                wave5.minions.push({x: -1590 + i * 350 - j * 40, y: - 20 - j * 170});
                wave6.minions.push({x: -890 + i * 350 + j * 40, y: - 20 - j * 170});
            }
        }
            
        timerOnce(function () {
            boss.waves.push(wave3);
        }, 6000);
            
        timerOnce(function () {
            boss.waves.push(wave4);
        }, 10000);
            
        timerOnce(function () {
            boss.waves.push(wave5);
            boss.waves.push(wave6);
        }, 14000);
            
        // start phase 3
        timerOnce(function () {
            startPhaseFinalBoss(3);
        }, 27000);
        
        break;
            
    case 3:
        addBonusPoints(750);
        // bring boss back in the center
        boss.directions.bot = true;
            
        // bring scepter
        timerOnce(function () {
            boss.scepter.directions.bot = true;
        }, 2000);
            
        // attack
        timerOnce(function () {
            timers.push($.timer(function () {
                var aiming = {x: Math.floor(Math.random() * canvas.width), y: canvas.height + 50};
                boss.bullets.push({x: boss.position.x + 150, y: boss.position.y + 140, target: aiming, color:"#48D1CC"});
            }, 1000, true));
        }, 4000);
            
        // start phase 4
        timerOnce(function () {
            startPhaseFinalBoss(4);
        }, 20000);
            
        break;
            
    case 4:
        addBonusPoints(1000);
        // move out scepter
        boss.scepter.directions.bot = false;
        boss.scepter.directions.top = true;
            
        // accelerate boss
        timers.push($.timer(function () {
            if (boss.speed < 17.5) {
                boss.speed += 0.7;
            }
        }, 1000, true));
            
        // attack
        timers.push($.timer(function () {
            var aiming = {x: player.positionX + player.width / 2, y: canvas.height + 50};
            boss.bullets.push({x: boss.position.x + 90, y: boss.position.y + 90, target: aiming, color:"#DC143C"});
        }, 1800, true));
        timerOnce(function () {
            timers.push($.timer(function () {
                var aiming = {x: player.positionX + player.width / 2, y: canvas.height + 50};
                boss.bullets.push({x: boss.position.x + 210, y: boss.position.y + 90, target: aiming, color:"#4B0082"});
            }, 1800, true));
        }, 2700);
            
        // anvil 1
        timerOnce(function () {
            var wave1 = {
                waveInfo: {w: 150, h: 400, speed: 14.0, color: "black", moving: false},
                minions: [{x: 70, y: -380}]
            };
            boss.waves.push(wave1);
        }, 12000);
            
        timerOnce(function () {
            if (boss.waves.length > 0) {
                boss.waves[0].waveInfo.moving = true;
            }
        }, 13000);
            
        // anvil 2
        timerOnce(function () {
            var wave2 = {
                waveInfo: {w: 150, h: 400, speed: 14.0, color: "black", moving: false},
                minions: [{x: 420, y: -380}]
            };
            boss.waves.push(wave2);
        }, 17000);
            
        timerOnce(function () {
            if (boss.waves.length > 1) {
                boss.waves[1].waveInfo.moving = true;
            }
        }, 17800);
            
        // anvil 3
        timerOnce(function () {
            var wave3 = {
                waveInfo: {w: 250, h: 400, speed: 14.0, color: "black", moving: false},
                minions: [{x: canvas.width / 2 - 150, y: -380}]
            };
            boss.waves.push(wave3);
        }, 26000);
            
        timerOnce(function () {
            if (boss.waves.length > 2) {
                boss.waves[2].waveInfo.moving = true;
            }
        }, 26700); 
            
        // start phase 5
        timerOnce(function () {
            startPhaseFinalBoss(5);
        }, 29000);
            
        break;
            
    case 5:
        addBonusPoints(1500);
        boss.speed = 12.0;
        boss.madness += 1;
            
        break;
    }
}

/**
* Game loop of the first boss
*/
function refreshBoss1() {
    movePlayer();
    
    drawBoss1();
    
    for (var i = boss.tentacles.length - 1; i >= 0; i--) { // TODO fix
        var tentacle = boss.tentacles[i];
        if (player.positionX < tentacle.x + tentacle.w &&
            player.positionX + player.width > tentacle.x &&
            player.positionY <= tentacle.y + tentacle.h - 4 &&
            player.positionY + player.height > tentacle.y) { // collision
            if (!invincible) {
                lives -= 1;
                // play sound
                if (!muted) {
                    document.getElementById('failSound').play();
                }
                // invicible frames
                invicibleDelay(1500);
            }
        }
    }
    
    // refresh
    if (lives > 0) {

        if (!isPause) {
            // move not fixed parts
            animateBoss1();
        }
        if (isPause) {
            drawPauseMenu();
        }
    } else {
        theEnd();
    }
}

/**
* Game loop of the second boss
*/
function refreshBoss2() {
    movePlayer();
    
    drawBoss2();
    
    // refresh
    if (lives > 0) {

        if (!isPause) {
            animateBoss2();
        }
        if (isPause) {
            drawPauseMenu();
        }
    } else {
        theEnd();
    }
}

/**
* Game loop of the third boss
*/
function refreshBoss3() {
    movePlayer();
    
    drawBoss3();
    
    // refresh
    if (lives > 0) {

        if (!isPause) {
            animateBoss3();
        }
        if (isPause) {
            drawPauseMenu();
        }
    } else {
        theEnd();
    }
}

/**
* Game loop of the final boss
*/
function refreshFinalBoss() {
    movePlayer();
    
    drawFinalBoss();
    
    // refresh
    if (lives > 0) {

        if (!isPause) {
            animateFinalBoss();
        }
        if (isPause) {
            drawPauseMenu();
        }
    } else {
        theEnd();
    }
}

/**
* Game loop of the final level
*/
function refreshLevel42() {
    movePlayer();
    
    drawChest();
    
    // refresh
    if (!boss.ended) {
        if (!isPause) {
            animateLevel42();
        }
        if (isPause) {
            drawPauseMenu();
        }
    } else {
        theEnd();
    }
}

/**
* Draw the first boss' scene
*/
function drawBoss1() { 
    // clear
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#e5f1ef";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // draw player
    drawPlayer();
    
    // draw HUD
    drawHUD();
    
    // draw fixed part
    for (var i = 0; i < boss.fixedPart.length; i++) {
        var part = boss.fixedPart[i];
        context.fillStyle = "purple";
        context.fillRect(part.x, part.y, part.w, part.h);
        // TODO cell shading
        //context.strokeStyle = "black";
        //context.strokeRect(part.x, part.y, part.w, part.h);
    } // TODO context.save ?
    
    // draw eyes
    context.fillStyle = "yellow";
    context.fillRect(boss.eyes[0].x, boss.eyes[0].y, boss.eyes[0].w, boss.eyes[0].h);
    context.fillRect(boss.eyes[1].x, boss.eyes[1].y, boss.eyes[1].w, boss.eyes[1].h);
    context.strokeStyle = "black";
    context.strokeRect(boss.eyes[0].x, boss.eyes[0].y, boss.eyes[0].w, boss.eyes[0].h);
    context.strokeRect(boss.eyes[1].x, boss.eyes[1].y, boss.eyes[1].w, boss.eyes[1].h);
    
    // draw pupils
    context.fillStyle = "black";
    context.fillRect(boss.pupils[0].x, boss.pupils[0].y, boss.pupils[0].w, boss.pupils[0].h);
    context.fillRect(boss.pupils[1].x, boss.pupils[1].y, boss.pupils[1].w, boss.pupils[1].h);
    
    // draw nostrils
    context.fillStyle = "yellow"; // TODO follow player
    context.fillRect(boss.nostrils[0].x, boss.nostrils[0].y, boss.nostrils[0].w, boss.nostrils[0].h);
    context.fillRect(boss.nostrils[1].x, boss.nostrils[1].y, boss.nostrils[1].w, boss.nostrils[1].h);
    context.strokeStyle = "black";
    context.strokeRect(boss.nostrils[0].x, boss.nostrils[0].y, boss.nostrils[0].w, boss.nostrils[0].h);
    context.strokeRect(boss.nostrils[1].x, boss.nostrils[1].y, boss.nostrils[1].w, boss.nostrils[1].h);
    
    // draw tentacles
    for (var i = 0; i < boss.tentacles.length; i++) {
        var tentacle = boss.tentacles[i];
        context.fillStyle = "purple";
        context.fillRect(tentacle.x, tentacle.y, tentacle.w, tentacle.h);
    }
    
    // bonus points
    drawBonusPoints();
}

/**
* Update the first boss
*/
function animateBoss1() {
    if (boss.growing) {
        boss.nostrils[0].x -= 0.03;
        boss.nostrils[0].w += 0.06;
        boss.nostrils[1].x -= 0.03;
        boss.nostrils[1].w += 0.06;
        if (boss.nostrils[0].w >= 26) {
            boss.growing = false;
        }
    } else {
        boss.nostrils[0].x += 0.03;
        boss.nostrils[0].w -= 0.06;
        boss.nostrils[1].x += 0.03;
        boss.nostrils[1].w -= 0.06;
        if (boss.nostrils[0].w <= 14) {
            boss.growing = true;
        }
    }
    
    // move pupils
    boss.pupils[0].x = player.positionX * (boss.eyes[0].w - boss.pupils[0].w) / (canvas.width - player.width) + boss.eyes[0].x;
    boss.pupils[1].x = player.positionX * (boss.eyes[1].w - boss.pupils[1].w) / (canvas.width - player.width) + boss.eyes[1].x;
    
    // move tentacles
    switch (boss.phase) {
    case 1: // TODO accelerate
        for (var i = boss.tentacles.length - 1; i >= 0; i--) {
            // vertical
            if (boss.tentacles[i].bot) { // growing
                boss.tentacles[i].h += 1.2;
                if ((boss.tentacles[i].h + boss.tentacles[i].y) >= canvas.height) {
                    boss.tentacles[i].bot = false;
                    boss.tentacles[i].top = true;
                }
            } else if (boss.tentacles[i].top) { // reducing
                boss.tentacles[i].h -= 1.2;
                if (boss.tentacles[i].h <= 0) {
                    boss.tentacles.splice(i, 1); // remove tentacle
                }
            } 
        }
        break;
    case 2:
        for (var i = boss.tentacles.length - 1; i >= 0; i--) {
            // vertical
            if ((boss.tentacles[i].h + boss.tentacles[i].y) < canvas.height && boss.tentacles[i].bot) { // growing
                boss.tentacles[i].h += 1.2;
            }
            if (boss.tentacles[i].right) {
                var delta =  2.1 * Math.random();
                var leftTentaculeMovingRight = (i == 0) && 
                    (boss.tentacles[0].x + boss.tentacles[0].w + delta < boss.tentacles[1].x - player.width - 40);
                var rightTentaculeMovingRight = (boss.tentacles[i].x > player.positionX) && 
                    (boss.tentacles[i].x + boss.tentacles[i].w + delta <= canvas.width);
                var randomNumber = Math.floor(Math.random() * 1000); // random turn around
                
                if ((leftTentaculeMovingRight || rightTentaculeMovingRight) && (randomNumber < 995)) {
                    boss.tentacles[i].x += delta;
                } else {
                    boss.tentacles[i].right = false;
                    boss.tentacles[i].left = true;
                }
            } else if (boss.tentacles[i].left) {
                var delta =  2.2 * Math.random();
                var leftTentaculeMovingLeft = (boss.tentacles[i].x < player.positionX) && (boss.tentacles[i].x - delta >= 0);
                var rightTentaculeMovingLeft = (i == 1) && 
                    (boss.tentacles[1].x - delta > boss.tentacles[0].x + boss.tentacles[0].w + player.width + 40);
                var randomNumber = Math.floor(Math.random() * 1000);
                
                if ((leftTentaculeMovingLeft || rightTentaculeMovingLeft) && (randomNumber < 995)) {
                    boss.tentacles[i].x -= delta;
                } else {
                    boss.tentacles[i].right = true;
                    boss.tentacles[i].left = false;
                }
            }
        }
        break;
    case 3:
        for (var i = boss.tentacles.length - 1; i >= 0; i--) {
            if (boss.tentacles[i].bot) { // growing
                boss.tentacles[i].h += 1.2;
                if ((boss.tentacles[i].h + boss.tentacles[i].y) >= canvas.height) {
                    boss.tentacles[i].bot = false;
                }
            } else if (boss.tentacles[i].top) { // reducing
                if (boss.tentacles[i].h >= 1.1) {
                    boss.tentacles[i].h -= 1.2;
                } else {
                    boss.tentacles[i].h = -0.1;
                }
            }
        }
        break;
    }
}

/**
* Draw the second boss' scene
*/
function drawBoss2() {
    // clear
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#e5f1ef";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // draw shadows
    for (var i = boss.shadows.length - 1; i >= 0; i--) {
        drawLosange({x: boss.shadows[i].x, y: boss.shadows[i].y}, boss.shadows[i].w, boss.shadows[i].h, "#004444"); 
    }
    
    context.save();
    context.translate(boss.coord.x, boss.coord.y);
    context.rotate(boss.angle);
    
    // draw minions
    for (var i = boss.minions.length - 1; i >= 0; i--) {
        drawLosange({x: boss.minions[i].x, y: boss.minions[i].y}, 32, 32, "gray");
    }
    
    // draw losange
    drawLosange({x: 0, y: 0}, boss.w, boss.h, "green"); 
    
    var x = 0,
        y = 0,
        u = boss.w / 16; // 1 unit : 10 pixels
    if (!boss.isVulnerable) {
        // draw eyes
        context.fillStyle = "white";
        context.fillRect(x - 4 * u, y - 4 * u, 2 * u, 3 * u);
        context.fillRect(x + 2 * u, y - 4 * u, 2 * u, 3 * u);
        context.strokeStyle = "black";
        context.strokeRect(x - 4 * u, y - 4 * u, 2 * u, 3 * u);
        context.strokeRect(x + 2 * u, y - 4 * u, 2 * u, 3 * u);

        // draw pupils
        context.fillStyle = "red";
        context.fillRect(x - 4 * u, y - 2 * u, 2 * u, u);
        context.fillRect(x + 2 * u, y - 2 * u, 2 * u, u);
        context.strokeStyle = "black";
        context.strokeRect(x - 4 * u, y - 2 * u, 2 * u, u);
        context.strokeRect(x + 2 * u, y - 2 * u, 2 * u, u);
    } else {
        // draw eyes
        context.fillStyle = "red";
        context.fillRect(x - 4 * u, y - 4 * u, 2 * u, 3 * u);
        context.fillRect(x + 2 * u, y - 4 * u, 2 * u, 3 * u);
        context.strokeStyle = "black";
        context.strokeRect(x - 4 * u, y - 4 * u, 2 * u, 3 * u);
        context.strokeRect(x + 2 * u, y - 4 * u, 2 * u, 3 * u);

        // draw pupils
        context.fillStyle = "yellow";
        context.fillRect(x - 4 * u, y - 2 * u, 2 * u, u);
        context.fillRect(x + 2 * u, y - 2 * u, 2 * u, u);
        context.strokeStyle = "black";
        context.strokeRect(x - 4 * u, y - 2 * u, 2 * u, u);
        context.strokeRect(x + 2 * u, y - 2 * u, 2 * u, u);
    }
    
    // draw mustache
    context.fillStyle = "brown";
    context.strokeStyle = "black";
  
    context.beginPath();
    context.moveTo(x - 6 * u, y + 4 * u);
    context.lineTo(x - 6 * u, y + 10 * u);
    context.lineTo(x - 4 * u, y + 10 * u);
    context.lineTo(x - 4 * u, y + 6 * u);
    context.lineTo(x + 4 * u, y + 6 * u);
    context.lineTo(x + 4 * u, y + 10 * u);
    context.lineTo(x + 6 * u, y + 10 * u);
    context.lineTo(x + 6 * u, y + 4 * u);
    context.closePath();
    context.fill();
    context.stroke();
    
    // draw eyebows
    context.strokeStyle = "brown";
    context.lineWidth = 8;
    
    context.beginPath();
    context.moveTo(x - 4 * u, y - 8 * u);
    context.lineTo(x - 2 * u, y - 6 * u);
    context.closePath();
    context.stroke();
    
    context.beginPath();
    context.moveTo(x + 4 * u, y - 8 * u);
    context.lineTo(x + 2 * u, y - 6 * u);
    context.closePath();
    context.stroke();
    
    context.lineWidth = 1;
    
    context.restore();
    
    // draw player
    drawPlayer();
    
    // draw guards
    for (var i = boss.guards.length - 1; i >= 0; i--) {
        drawLosange({x: boss.guards[i].x, y: boss.guards[i].y}, 28, 40, "#660000"); 
    }
    
    // draw HUD
    drawHUD();
    
    // bonus points
    drawBonusPoints();
}

/**
* Draw losange
*
* @param center the position of the center
* @param width the width
* @param height the height
* @param the fill color
*/
function drawLosange(center, width, height, color) {
    var x0 = center.x,
        y0 = center.y - (height / 2),
        x1 = center.x + (width / 2),
        y1 = center.y,
        x2 = center.x,
        y2 = center.y + (height / 2),
        x3 = center.x - (width / 2),
        y3 = center.y;
    
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.lineTo(x2, y2);
    context.lineTo(x3, y3);
    
    context.lineWidth = 1;
    context.fillStyle = color;
    context.strokeStyle = "blue"; // TODO modify
    
    context.closePath();
    
    context.fill();
    context.stroke();
}

/**
* Update the second boss
*/
function animateBoss2() {   
    switch (boss.phase) {
    case 1:
        if (boss.directions.right) {
            if ((boss.coord.x + boss.speed + boss.w / 2) < canvas.width) {
                boss.coord.x += boss.speed;
            } else {
                boss.coord.x = canvas.width - boss.w / 2;
                boss.directions.right = false;
                boss.directions.left = true;
                boss.speed = Math.min(boss.speed + 0.6, 8);
            }
        } else if (boss.directions.left) {
            if ((boss.coord.x - boss.speed - boss.w / 2) > 0) {
                boss.coord.x -= boss.speed;
            } else {
                boss.coord.x = boss.w / 2;
                boss.directions.left = false;
                boss.directions.right = true;
                boss.speed = Math.min(boss.speed + 0.6, 8);
            }
        }
        if ((boss.directions.right || boss.directions.left) 
            && boss.coord.x >= player.positionX - 40 
            && boss.coord.x <= player.positionX + player.width + 40 
            && Math.random() < 0.025) {
            boss.directions.right = false;
            boss.directions.left = false;
            boss.directions.bot = true;
        }
        if (boss.directions.bot) {
            boss.coord.y += 2.2 * boss.speed;
            if (isCollisionWithCircle(boss.coord.x, boss.coord.y, Math.min(boss.w / 2, boss.h / 2))) { // Boss hits the player
                boss.directions.bot = false;
                boss.directions.top = true;
                lives -= 1;
                // play sound
                if (!muted) {
                    document.getElementById('failSound').play();
                }
                invicibleDelay(1500);
            } else if (boss.coord.y >= canvas.height) {
                boss.directions.bot = false;
                boss.isVulnerable = true;
            }
        } else if (boss.directions.top) { // Boss is going up again
            boss.coord.y -= 3.8;
            if (boss.coord.y <= 160) {
                boss.directions.top = false;
                boss.directions.right = true;
                boss.speed = 3.2;
                boss.isVulnerable = false;
            }
        } else if (boss.isVulnerable) {
            if (isCollisionWithCircle(boss.coord.x, boss.coord.y, Math.min(boss.w / 2, boss.h / 2))) { // Player hits the boss
                hitBoss();
            }
        }
        break;
            
    case 2: // TODO invulnerable frames
        boss.angle += 0.01;
        for (var i = boss.minions.length - 1; i >= 0; i--) {
            
            // check collision between minion and player
            var minion = boss.minions[i];
            var xInCanvas = boss.coord.x + minion.x * Math.cos(-boss.angle) + minion.y * Math.sin(-boss.angle),
                yInCanvas = boss.coord.y - minion.x * Math.sin(-boss.angle) + minion.y * Math.cos(-boss.angle);
            if (isCollisionWithCircle(xInCanvas, yInCanvas, 16)) {
                lives -= 1;
                // play sound
                if (!muted) {
                    document.getElementById('failSound').play();
                }
                invicibleDelay(1500);
                boss.minions.splice(i, 1);
            } else {
                // update minion
                switch (boss.minions[i].direction) {
                case 0:
                    boss.minions[i].x += 2.1;//Math.cos(boss.minions[i].angle);
                    boss.minions[i].y += 2.3;//Math.sin(boss.minions[i].angle);
                    break;
                case 1:
                    boss.minions[i].x += 2.1;
                    boss.minions[i].y -= 2.3;
                    break;
                case 2:
                    boss.minions[i].x -= 2.1;
                    boss.minions[i].y += 2.3;
                    break;
                case 3:
                    boss.minions[i].x -= 2.1;
                    boss.minions[i].y -= 2.3;
                }

                // remove minion if out of bounds
                if ((Math.abs(boss.minions[i].x) + boss.coord.x > 1.5 * canvas.width) // margin because of rotation
                   || (Math.abs(boss.minions[i].y) + boss.coord.y > 1.5 * canvas.height)) { 
                    boss.minions.splice(i, 1);
                }
            }
        }
        break;
        
    case 3:
        // move shadows
        for (var i = boss.shadows.length - 1; i >= 0; i--) {
            if (isCollisionWithCircle(boss.shadows[i].x, boss.shadows[i].y, Math.min(boss.shadows[i].w / 2, boss.shadows[i].h / 2))) {
                lives -= 1;
                // play sound
                if (!muted) {
                    document.getElementById('failSound').play();
                }
                invicibleDelay(1500);
                boss.shadows.splice(i, 1);
            } else if (boss.shadows[i].y > canvas.height + boss.shadows[i].h / 2) {
                boss.shadows.splice(i, 1);
            } else {
                boss.shadows[i].y += 7.5;
            }
        }
            
        // move boss
        if (boss.directions.top) {
            boss.coord.y -= 3.2;
            if (boss.coord.y <= -160) {
                boss.directions.top = false;
            }
        } else if (boss.directions.bot) {
            boss.coord.y += 9.2;
            if (isCollisionWithCircle(boss.coord.x, boss.coord.y, Math.min(boss.w / 2, boss.h / 2))) { // Boss hits the player
                boss.directions.bot = false;
                boss.directions.top = true;
                lives -= 1;
                // play sound
                if (!muted) {
                    document.getElementById('failSound').play();
                }
                invicibleDelay(1500);
                timerOnce(function () {
                    boss.coord.x = player.positionX + player.width / 2;
                    boss.directions.bot = true;
                }, 9000);
            } else if (boss.coord.y >= canvas.height) {
                boss.directions.bot = false;
                boss.isVulnerable = true;
            }
        } else if (boss.isVulnerable) {
            if (isCollisionWithCircle(boss.coord.x, boss.coord.y, Math.min(boss.w / 2, boss.h / 2))) { // Boss hits the player
                hitBoss();
            }
        }
        break;
            
    case 4:
        // move guards
        for (var i = boss.guards.length - 1; i >= 0; i--) {
            if (isCollisionWithCircle(boss.guards[i].x, boss.guards[i].y, 14)) {
                lives -= 1;
                // play sound
                if (!muted) {
                    document.getElementById('failSound').play();
                }
                invicibleDelay(1500);
                boss.guards.splice(i, 1);
            } else if (boss.guards[i].y > canvas.height + 20) {
                boss.guards.splice(i, 1);
            } else if (boss.guards[i].aiming.y > 0) {
                var ratio = 10.4 / Math.sqrt(Math.pow(boss.guards[i].aiming.x - boss.guards[i].x, 2) + 
                                            Math.pow(boss.guards[i].aiming.y - boss.guards[i].y, 2));
                boss.guards[i].x += boss.guards[i].dx;
                boss.guards[i].y += boss.guards[i].dy;
            }
        }
            
        // move boss
        if (boss.directions.top) {
            boss.coord.y -= 5.4;
            if (boss.coord.y <= -160) {
                boss.directions.top = false;
            }
        } else if (boss.directions.bot) {
            boss.coord.y += 10.8;
            if (isCollisionWithCircle(boss.coord.x, boss.coord.y, Math.min(boss.w / 2, boss.h / 2))) { // Boss hits the player
                boss.directions.bot = false;
                boss.directions.top = true;
                lives -= 1;
                // play sound
                if (!muted) {
                    document.getElementById('failSound').play();
                }
                invicibleDelay(1500);
                timerOnce(function () {
                    boss.coord.x = player.positionX + player.width / 2;
                    boss.directions.bot = true;
                }, 8000);
            } else if (boss.coord.y >= canvas.height) {
                boss.directions.bot = false;
                boss.isVulnerable = true;
            }
        } else if (boss.isVulnerable) {
            if (isCollisionWithCircle(boss.coord.x, boss.coord.y, Math.min(boss.w / 2, boss.h / 2))) { // Boss hits the player
                hitBoss();
                timerOnce(function () {
                    level += 1;
                    resetAll();
                    addBonusPoints(500);
                    // game loop
                    if (refreshTimer != null) {
                        clearInterval(refreshTimer);
                    }
                    refreshTimer = setInterval(function () {
                        if (!isPause && !screenTooSmall) {
                            requestAnimId = window.requestAnimationFrame(game);
                        }
                    }, 1000 / fps);
                    startLevel();
                }, 4000);
            }
        }
        break;
            
    case 5: // back to initial position phase
        if (boss.coord.x != 277) {
            if (boss.directions.right) {
                boss.coord.x = (boss.coord.x + 0.8 * boss.speed <= 277) ? boss.coord.x + 0.8 * boss.speed : 277;
            }
            if (boss.directions.left) {
                boss.coord.x = (boss.coord.x - 0.8 * boss.speed >= 277) ? boss.coord.x - 0.8 * boss.speed : 277;
            }
        }
        if (boss.coord.y != 160) {
            if (boss.directions.bot) {
                boss.coord.y = (boss.coord.y + 1.4 * boss.speed <= 160) ? boss.coord.y + 1.4 * boss.speed : 160;
            }
            if (boss.directions.top) {
                boss.coord.y = (boss.coord.y - 1.4 * boss.speed >= 160) ? boss.coord.y - 1.4 * boss.speed : 160;
            }
        }
            
        // initial angle
        if (boss.angle > 0.0) {
            boss.angle = (boss.angle > 0.015) ? boss.angle - 0.015 : 0.0;
        }
            
        if (boss.coord.x == 277 && boss.coord.y == 160 && boss.angle == 0.0) {
            boss.directions.top = false;
            boss.directions.bot = false;
            boss.directions.left = false;
            boss.directions.right = false;
            startPhaseBoss2(boss.previousPhase + 1);
        }
        break;
    }
}

/**
* Hit boss
*/
function hitBoss() {
    boss.hp -= 1;
    boss.isVulnerable = false;
    startPhaseBoss2(5);
}

/**
* Draw the third boss' scene
*/
function drawBoss3() {
    // clear
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#e5f1ef";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // draw triangles
    for (var i = boss.triangles.length - 1; i >= 0; i--) {
        drawTriangle(boss.triangles[i]); 
    }
    
    // draw rectangles
    for (var i = boss.rectangles.length - 1; i >= 0; i--) {
        context.fillStyle = boss.rectangles[i].color;
        context.fillRect(boss.rectangles[i].x, boss.rectangles[i].y, boss.rectangles[i].w, boss.rectangles[i].h);
    }
    
    // draw losanges
    for (var i = boss.losanges.length - 1; i >= 0; i--) {
        drawLosange({x: boss.losanges[i].x, y: boss.losanges[i].y}, boss.losanges[i].w, boss.losanges[i].h, "#ababab");
    }
    
    // draw player
    drawPlayer();
    
    // draw HUD
    drawHUD();
    
    // bonus points
    drawBonusPoints();
}

/**
* Draw a boss' triangle
*
* @param triangle the list of points to build the triangle
*/
function drawTriangle(triangle) {
    context.beginPath();
    
    context.fillStyle = "#0e0e0e";
    context.strokeStyle = "#0e0e0e";
    context.lineWidth = 2;
    
    if (triangle.length > 0) {
        context.moveTo(triangle[0].x, triangle[0].y);
    }
    
    for (var i = 1; i < triangle.length; i++) {
        context.lineTo(triangle[i].x, triangle[i].y);
    }
    
    context.fill();
    context.stroke();
    context.closePath();
    
    context.lineWidth = 1;
}

/**
* Update the third boss
*/
function animateBoss3() {   
    switch (boss.phase) {
    case 1:
        for (var i = 0; i < boss.triangles.length; i++) {
            if (!invincible && IsCollisionWithTriangle(boss.triangles[i])) {
                lives -= 1;
                // play sound
                if (!muted) {
                    document.getElementById('failSound').play();
                }
                invicibleDelay(1500);
            }
            for (var j = 0; j < boss.triangles[i].length; j++) {
                boss.triangles[i][j].y += boss.speed;
            }
        }
        
        break;
            
    case 2: 
        for (var i = 0; i < boss.triangles.length; i++) {
            if (!invincible && IsCollisionWithTriangle(boss.triangles[i])) {
                lives -= 1;
                // play sound
                if (!muted) {
                    document.getElementById('failSound').play();
                }
                invicibleDelay(1500);
            }
            for (var j = 0; j < boss.triangles[i].length; j++) {
                boss.triangles[i][j].y += boss.speed;
            }
        }
            
        break;
        
    case 3:
        for (var i = 0; i < boss.rectangles.length; i++) {
            if (!invincible && 
                player.positionX < boss.rectangles[i].x + boss.rectangles[i].w && 
                player.positionX + player.width > boss.rectangles[i].x && 
                player.positionY < boss.rectangles[i].y + boss.rectangles[i].h && 
                player.positionY + player.height > boss.rectangles[i].y) { 
                lives -= 1;
                // play sound
                if (!muted) {
                    document.getElementById('failSound').play();
                }
                invicibleDelay(1500);
            }
            boss.rectangles[i].y += boss.speed;
        }
            
        // update lines
        for (var i = 0; i < boss.lines.length; i++) {
            boss.lines[i].y += boss.speed;
        }    
        
        for (var i = 0; i < boss.losanges.length; i++) {
            var xc = boss.losanges[i].x,
                yc = boss.losanges[i].y,
                w = boss.losanges[i].w,
                h = boss.losanges[i].h;
            if (!invincible && isCollisionWithCircle(xc, yc, Math.min(w, h))) {
                lives -= 1;
                // play sound
                if (!muted) {
                    document.getElementById('failSound').play();
                }
                invicibleDelay(1500);
            }
            boss.losanges[i].y += boss.speed;
            if (boss.losanges[i].y == boss.lines[1].y) {
                boss.losanges[i].x -= 3.6;
            } else {
                boss.losanges[i].x += 3.6;
            }
        }
        
        break;
            
    case 4:
        for (var i = 0; i < boss.rectangles.length; i++) {
            if (!invincible && 
                player.positionX < boss.rectangles[i].x + boss.rectangles[i].w && 
                player.positionX + player.width > boss.rectangles[i].x && 
                player.positionY < boss.rectangles[i].y + boss.rectangles[i].h && 
                player.positionY + player.height > boss.rectangles[i].y) { 
                lives -= 1;
                // play sound
                if (!muted) {
                    document.getElementById('failSound').play();
                }
                invicibleDelay(1500);
            }
            boss.rectangles[i].y += boss.speed + Math.floor(Math.random() * 8) - 4;
            boss.rectangles[i].x += Math.floor(Math.random() * 6) - 4;
        }
            
        break;
    }
}

/**
* Checks collision between a line segment and the player
*
* @param x1 the x coordinate of extremity 1
* @param y1 the y coordinate of extremity 1
* @param x2 the x coordinate of extremity 2
* @param y2 the y coordinate of extremity 2
*/
function IsSegmentIntersectingPlayer(x1, y1, x2, y2) {
    // Find min and max X for the segment
    var minX = x1,
        maxX = x2;
    if (x1 > x2) {
      minX = x2;
      maxX = x1;
    }

    // Find the intersection of the segment's and rectangle's x-projections
    if (maxX > player.positionX + player.width) {
      maxX = player.positionX + player.width;
    }

    if (minX < player.positionX) {
      minX = player.positionX;
    }

    // If their projections do not intersect return false
    if (minX > maxX) {
      return false;
    }

    // Find corresponding min and max Y for min and max X we found before
    var minY = y1,
        maxY = y2,
        dx = x2 - x1;

    if (Math.abs(dx) > 0.00001) {
      var a = (y2 - y1) / dx,
          b = y1 - a * x1;
      minY = a * minX + b;
      maxY = a * maxX + b;
    }

    if (minY > maxY) {
      var tmp = maxY;
      maxY = minY;
      minY = tmp;
    }

    // Find the intersection of the segment's and rectangle's y-projections
    if (maxY > player.positionY + player.height) {
      maxY = player.positionY + player.height;
    }

    if (minY < player.positionY) {
      minY = player.positionY ;
    }

    // If Y-projections do not intersect return false
    if (minY > maxY) {
      return false;
    }

    return true;
}

/**
* Checks collision between a triangle and the player
*
* @param triangle the array of 3 points
*/
function IsCollisionWithTriangle(triangle) {
    return (IsSegmentIntersectingPlayer(triangle[0].x, triangle[0].y, triangle[1].x, triangle[1].y) ||
        IsSegmentIntersectingPlayer(triangle[0].x, triangle[0].y, triangle[2].x, triangle[2].y) ||
        IsSegmentIntersectingPlayer(triangle[1].x, triangle[1].y, triangle[2].x, triangle[2].y));
}

/**
* Draw the final boss' scene
*/
function drawFinalBoss() {
    var xb = boss.position.x,
        yb = boss.position.y;
    
    // clear
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#e5f1ef";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.strokeStyle = "black";
    
    // draw body
    context.fillStyle = "#FFE4E1";
    context.fillRect(xb, yb + 50, 320, 150);
    context.strokeRect(xb, yb + 50, 320, 150);
    
    // draw hair and beard
    context.fillStyle = "#8B4513";
    context.fillRect(xb - 10, yb + 50, 20, 40);
    context.fillRect(xb + 310, yb + 50, 20, 40);
    context.fillRect(xb - 10, yb + 110, 20, 100);
    context.fillRect(xb + 310, yb + 110, 20, 100);
    context.fillRect(xb, yb + 160, 320, 50);
    
    // draw eyebrows
    context.fillRect(xb + 50, yb + 40, 80, 15);
    context.fillRect(xb + 190, yb + 40, 80, 15);
    
    // draw mouth
    context.fillStyle = "black";
    context.fillRect(xb + 130, yb + 130, 60, 20);
    
    // draw eyes
    if (boss.isdead) {
        context.strokeStyle = "black";
        context.lineWidth = 4;
        
        context.beginPath();
        context.moveTo(xb + 50, yb + 60);
        context.lineTo(xb + 130, yb + 100);
        context.stroke();
        context.closePath();
        
        context.beginPath();
        context.moveTo(xb + 190, yb + 60);
        context.lineTo(xb + 270, yb + 100);
        context.stroke();
        context.closePath();
        
        context.beginPath();
        context.moveTo(xb + 50, yb + 100);
        context.lineTo(xb + 130, yb + 60);
        context.stroke();
        context.closePath();
        
        context.beginPath();
        context.moveTo(xb + 190, yb + 100);
        context.lineTo(xb + 270, yb + 60);
        context.stroke();
        context.closePath();
        
        context.lineWidth = 1;
    } else {
        var eyesColor,
            pupilsColor;
        switch (boss.madness) {
        case 0:
            eyesColor = "#FFFAF0";
            pupilsColor = "#800000";
            break;
        case 1:
            eyesColor = "#FDF9C9";
            pupilsColor = "#990000";
            break;
        case 2:
            eyesColor = "#FCF8A2";
            pupilsColor = "#B20000";
            break;
        case 3:
            eyesColor = "#FBF77C";
            pupilsColor = "#CC0000";
            break;
        case 4:
            eyesColor = "#FAF655";
            pupilsColor = "#E50000";
            break;
        default:
            eyesColor = "#F9F52F";
            pupilsColor = "#FF0000";
        }
        context.fillStyle = eyesColor; //"#FFFAF0";
        context.fillRect(xb + 50, yb + 60, 80, 40);
        context.fillRect(xb + 190, yb + 60, 80, 40);

        // draw pupils
        context.fillStyle = pupilsColor; //"#800000";
        context.fillRect(xb + 80, yb + 80, 40, 20);
        context.fillRect(xb + 200, yb + 80, 40, 20);
    }
    
    // draw crown
    context.fillStyle = "#DC143C";
    context.fillRect(xb, yb + 10, 320, 10);
    
    context.fillStyle = "#FFD700";
    context.fillRect(xb, yb + 20, 320, 30);
    context.fillRect(xb, yb, 20, 20);
    context.fillRect(xb + 60, yb, 40, 20);
    context.fillRect(xb + 140, yb, 40, 20);
    context.fillRect(xb + 220, yb, 40, 20);
    context.fillRect(xb + 300, yb, 20, 20);
    
    context.fillStyle = "#48D1CC";
    context.fillRect(xb + 20, yb + 30, 40, 10);
    context.fillRect(xb + 100, yb + 30, 40, 10);
    context.fillRect(xb + 180, yb + 30, 40, 10);
    context.fillRect(xb + 260, yb + 30, 40, 10);
    
    // draw scepter
    drawScepter();
    
    // draw waves
    for (var i = 0; i < boss.waves.length; i++) {
        context.fillStyle = boss.waves[i].waveInfo.color;
        
        // draw minions
        for (var j = 0; j < boss.waves[i].minions.length; j++) {
            var minion = boss.waves[i].minions[j],
                waveInfo = boss.waves[i].waveInfo;
            context.fillRect(minion.x, minion.y, waveInfo.w, waveInfo.h);
        }
    }
    
    // draw bullets
    context.strokeStyle = "black";
    for (var i = 0; i < boss.bullets.length; i++) {
        var b = boss.bullets[i];
        context.fillStyle = b.color;
        context.fillRect(b.x, b.y, 20, 30);
        context.strokeRect(b.x, b.y, 20, 30);
    } 
    
    // draw player
    drawPlayer();
    
    // draw HUD
    drawHUD();
    
    // bonus points
    drawBonusPoints();
}

/**
* Draw scepter
*/
function drawScepter() { 
    var x = boss.scepter.x,
        y = boss.scepter.y;
    
    // draw body
    context.fillStyle = "#FFD700";
    context.strokeStyle = "black";
    context.fillRect(x + 60, y + 10, 20, 200);
    context.strokeRect(x + 60, y + 10, 20, 200);
    
    context.fillRect(x + 50, y, 40, 10);
    context.strokeRect(x + 50, y, 40, 10);
    context.fillRect(x + 50, y + 90, 40, 10);
    context.strokeRect(x + 50, y + 90, 40, 10);
    context.fillRect(x + 50, y + 160, 40, 10);
    context.strokeRect(x + 50, y + 160, 40, 10);
    context.fillRect(x + 45, y + 210, 50, 20);
    context.strokeRect(x + 45, y + 210, 50, 20);
    
    // draw golden head
    context.fillRect(x, y + 50, 140, 10);
    context.strokeRect(x, y + 50, 140, 10);
    context.fillRect(x + 20, y + 20, 20, 30);
    context.strokeRect(x + 20, y + 20, 20, 30);
    context.fillRect(x + 60, y + 20, 20, 30);
    context.strokeRect(x + 60, y + 20, 20, 30);
    context.fillRect(x + 100, y + 20, 20, 30);
    context.strokeRect(x + 100, y + 20, 20, 30);
    
    // draw inside of the head
    context.fillStyle = "#DC143C";
    context.fillRect(x, y + 20, 20, 30);
    context.strokeRect(x, y + 20, 20, 30);
    context.fillRect(x + 40, y + 20, 20, 30);
    context.strokeRect(x + 40, y + 20, 20, 30);
    context.fillRect(x + 80, y + 20, 20, 30);
    context.strokeRect(x + 80, y + 20, 20, 30);
    context.fillRect(x + 120, y + 20, 20, 30);
    context.strokeRect(x + 120, y + 20, 20, 30);
    
    // draw jewels
    context.fillStyle = "#48D1CC";
    context.fillRect(x + 6, y + 53, 8, 4);
    context.strokeRect(x + 6, y + 53, 8, 4);
    context.fillRect(x + 26, y + 53, 8, 4);
    context.strokeRect(x + 26, y + 53, 8, 4);
    context.fillRect(x + 46, y + 53, 8, 4);
    context.strokeRect(x + 46, y + 53, 8, 4);
    context.fillRect(x + 66, y + 53, 8, 4);
    context.strokeRect(x + 66, y + 53, 8, 4);
    context.fillRect(x + 86, y + 53, 8, 4);
    context.strokeRect(x + 86, y + 53, 8, 4);
    context.fillRect(x + 106, y + 53, 8, 4);
    context.strokeRect(x + 106, y + 53, 8, 4);
    context.fillRect(x + 126, y + 53, 8, 4);
    context.strokeRect(x + 126, y + 53, 8, 4);
    
    context.fillRect(x + 66, y + 93, 8, 4);
    context.strokeRect(x + 66, y + 93, 8, 4);
    context.fillRect(x + 66, y + 163, 8, 4);
    context.strokeRect(x + 66, y + 163, 8, 4);
    
    context.fillRect(x + 26, y + 33, 8, 4);
    context.strokeRect(x + 26, y + 33, 8, 4);
    context.fillRect(x + 66, y + 33, 8, 4);
    context.strokeRect(x + 66, y + 33, 8, 4);
    context.fillRect(x + 106, y + 33, 8, 4);
    context.strokeRect(x + 106, y + 33, 8, 4);
}

/**
* Update the final boss
*/
function animateFinalBoss() {  
    // move boss
    if (boss.directions.top) {
        boss.position.y -= boss.speed;
        if (boss.position.y <= 0 - boss.h) {
            boss.directions.top = false;
        }
    } else if (boss.directions.bot) {
        boss.position.y += boss.speed;
        if (boss.position.y > canvas.height) {
            boss.directions.bot = false;
        }
    }
    if (boss.directions.right) {
        boss.position.x += boss.speed;
        if (boss.position.x > canvas.width - boss.w + 70) {
            boss.directions.right = false;
            boss.directions.left = true;
        }
    } else if (boss.directions.left) {
        boss.position.x -= boss.speed;
        if (boss.position.x < - 140) {
            boss.directions.left = false;
            boss.directions.right = true;
        }
    }
    
    // move scepter
    if (boss.scepter.directions.top) {
        boss.scepter.y -= boss.scepter.speed * 0.8;
        if (boss.scepter.y <= -230) {
            boss.scepter.directions.top = false;
        }
    } else if (boss.scepter.directions.bot) {
        boss.scepter.y += boss.scepter.speed;
        if (boss.scepter.y > canvas.height) {
            boss.scepter.directions.bot = false;
        }
    }
    if (boss.scepter.directions.right) {
        boss.scepter.x += boss.scepter.speed * 1.2;
        if ((boss.scepter.x > canvas.width - boss.w) || (Math.floor(Math.random() * 1000) < 10)) {
            boss.scepter.directions.right = false;
            boss.scepter.directions.left = true;
        }
    } else if (boss.scepter.directions.left) {
        boss.scepter.x -= boss.scepter.speed * 1.2;
        if ((boss.scepter.x < -80) || (Math.floor(Math.random() * 1000) < 10)) {
            boss.scepter.directions.left = false;
            boss.scepter.directions.right = true;
        }
    }
    
    switch (boss.phase) {
    case 1:
        // move waves
        for (var i = 0; i < boss.waves.length; i++) {
            if (boss.waves[i].waveInfo.moving) {
                // check collision
                for (var j = 0; j < boss.waves[i].minions.length; j++) {
                    var x = boss.waves[i].minions[j].x,
                        y = boss.waves[i].minions[j].y,
                        w = boss.waves[i].waveInfo.w,
                        h = boss.waves[i].waveInfo.h;
                    if (!invincible && 
                        player.positionX < x + w && 
                        player.positionX + player.width > x && 
                        player.positionY < y + h && 
                        player.positionY + player.height > y) { 
                        lives -= 1;
                        // play sound
                        if (!muted) {
                            document.getElementById('failSound').play();
                        }
                        invicibleDelay(1500);
                    }
                    
                    // move minions
                    boss.waves[i].minions[j].y += (boss.waves[i].minions[j].y > canvas.height) ? 0 : boss.waves[i].waveInfo.speed;
                }
            }
        }
            
        break;
            
    case 2:
        // move waves
        for (var i = 0; i < boss.waves.length; i++) {
            // check collision
            for (var j = 0; j < boss.waves[i].minions.length; j++) {
                var x = boss.waves[i].minions[j].x,
                    y = boss.waves[i].minions[j].y,
                    w = boss.waves[i].waveInfo.w,
                    h = boss.waves[i].waveInfo.h;
                if (!invincible && 
                    player.positionX < x + w && 
                    player.positionX + player.width > x && 
                    player.positionY < y + h && 
                    player.positionY + player.height > y) { 
                    lives -= 1;
                    // play sound
                    if (!muted) {
                        document.getElementById('failSound').play();
                    }
                    invicibleDelay(1500);
                }
                
                // move minions
                boss.waves[i].minions[j].y += (boss.waves[i].minions[j].y > canvas.height) ? 0 : boss.waves[i].waveInfo.speed * 0.5;
                if (i % 2 == 0) {
                    boss.waves[i].minions[j].x += (boss.waves[i].minions[j].x > canvas.width + 3000) ? 0 : boss.waves[i].waveInfo.speed * 0.5;
                } else {
                    boss.waves[i].minions[j].x -= (boss.waves[i].minions[j].x > canvas.width + 3000) ? 0 : boss.waves[i].waveInfo.speed * 0.5;
                }
                
            }
        }
           
        break;
        
    case 3:
        // stop boss at its original position then move
        if (boss.directions.bot && boss.position.y >= 30) {
            boss.directions.bot = false;
            boss.directions.right = true;
        }
            
        // move scepter
        if (boss.scepter.directions.bot && boss.scepter.y >= canvas.height - 230) {
            boss.scepter.directions.bot = false;
            boss.scepter.directions.right = false;
            boss.scepter.directions.left = false;
            timerOnce(function () {
                boss.scepter.directions.top = true;
                if ((Math.floor(Math.random()) * 100) < 50) { // 50 % to go right or left
                    boss.scepter.directions.right = true;
                } else {
                    boss.scepter.directions.left = true;
                }
            }, 1000);
        }
            
        if (boss.scepter.directions.top && boss.scepter.y < 0) {
            boss.scepter.directions.top = false;
            var delay = Math.floor(Math.random()) * 6 + 3; 
            timerOnce(function () {
                boss.scepter.directions.bot = true;
                boss.scepter.directions.right = false;
                boss.scepter.directions.left = false;
            }, delay * 1000);
        }
            
        // check collision with scepter 
        var x = boss.scepter.x + 60,
            y = boss.scepter.y + 160,
            w = 20,
            h = 70,
            hit = false;
        if (!invincible && player.positionX < x + w && player.positionX + player.width > x && 
             player.positionY < y + h && player.positionY + player.height > y) { 
            hit = true;
        }
        x = boss.scepter.x + 45;
        y = boss.scepter.y + 210;
        w = 50;
        h = 20;
        if (!invincible && player.positionX < x + w && player.positionX + player.width > x && 
             player.positionY < y + h && player.positionY + player.height > y) { 
            hit = true;
        }
        if (hit) {
            lives -= 1;
            // play sound
            if (!muted) {
                document.getElementById('failSound').play();
            }
            invicibleDelay(1500);
        }
        
        // move bullets
        for (var i = boss.bullets.length - 1; i >= 0; i--) {
            if (boss.bullets[i].x > canvas.width) {
                boss.bullets.splice(i, 1);
            } else if (!invincible && 
                        player.positionX < boss.bullets[i].x + 20 && 
                        player.positionX + player.width > boss.bullets[i].x && 
                        player.positionY < boss.bullets[i].y + 30 && 
                        player.positionY + player.height > boss.bullets[i].y) { 
                        lives -= 1;
                        // play sound
                        if (!muted) {
                            document.getElementById('failSound').play();
                        }
                        invicibleDelay(1500);
            } else {
                var ratio = 6 / Math.sqrt(Math.pow(boss.bullets[i].target.x - boss.bullets[i].x, 2) + 
                                                    Math.pow(boss.bullets[i].target.y - boss.bullets[i].y, 2));
                boss.bullets[i].x += (boss.bullets[i].target.x - boss.bullets[i].x) * ratio;
                boss.bullets[i].y += (boss.bullets[i].target.y - boss.bullets[i].y) * ratio;
            }
        } 
        
        break;
            
    case 4:
        // move bullets
        for (var i = boss.bullets.length - 1; i >= 0; i--) {
            if (boss.bullets[i].x > canvas.width) {
                boss.bullets.splice(i, 1);
            } else if (!invincible && 
                        player.positionX < boss.bullets[i].x + 20 && 
                        player.positionX + player.width > boss.bullets[i].x && 
                        player.positionY < boss.bullets[i].y + 30 && 
                        player.positionY + player.height > boss.bullets[i].y) { 
                        lives -= 1;
                        // play sound
                        if (!muted) {
                            document.getElementById('failSound').play();
                        }
                        invicibleDelay(1500);
            } else {
                var ratio = 8.6 / Math.sqrt(Math.pow(boss.bullets[i].target.x - boss.bullets[i].x, 2) + 
                                                    Math.pow(boss.bullets[i].target.y - boss.bullets[i].y, 2));
                boss.bullets[i].x += (boss.bullets[i].target.x - boss.bullets[i].x) * ratio;
                boss.bullets[i].y += (boss.bullets[i].target.y - boss.bullets[i].y) * ratio;
            }
        } 
            
        // move waves
        for (var i = 0; i < boss.waves.length; i++) {
            if (boss.waves[i].waveInfo.moving) {
                // check collision
                for (var j = 0; j < boss.waves[i].minions.length; j++) {
                    var x = boss.waves[i].minions[j].x,
                        y = boss.waves[i].minions[j].y,
                        w = boss.waves[i].waveInfo.w,
                        h = boss.waves[i].waveInfo.h;
                    if (!invincible && 
                        player.positionX < x + w && 
                        player.positionX + player.width > x && 
                        player.positionY < y + h && 
                        player.positionY + player.height > y) { 
                        lives -= 1;
                        // play sound
                        if (!muted) {
                            document.getElementById('failSound').play();
                        }
                        invicibleDelay(1500);
                    }
                    
                    // move minions
                    boss.waves[i].minions[j].y += (boss.waves[i].minions[j].y > canvas.height) ? 0 : boss.waves[i].waveInfo.speed;
                }
            }
        }
        
        break;
            
    case 5:
        if ((boss.directions.right || boss.directions.left) 
            && boss.position.x > player.positionX - boss.w + player.width 
            && boss.position.x < player.positionX
            && Math.random() < 0.035) {
            boss.directions.right = false;
            boss.directions.left = false;
            timerOnce(function (){
                boss.directions.bot = true;
            }, 500);
        }
        if (boss.directions.bot) {
            // check collision
            if (player.positionX < boss.position.x + boss.w &&
                player.positionX + player.width > boss.position.x &&
                player.positionY <= boss.position.y + boss.h &&
                player.positionY + player.height > boss.position.y) { // collision
                if (!invincible) {
                    lives -= 1;
                    // play sound
                    if (!muted) {
                        document.getElementById('failSound').play();
                    }
                    invicibleDelay(1500);
                }
            }
            
            if (boss.position.y >= canvas.height - boss.h + 20) {
                boss.directions.bot = false;
                
                if (boss.hits < 5) {
                    boss.hits += 1;
                    boss.madness += 1;
                    boss.speed += 0.8;
                    timerOnce(function (){
                        boss.directions.top = true;
                    }, 550);
                } else {
                    boss.isdead = true;
                    
                    // trigger level 42
                    timerOnce(function () {
                        level += 1;
                        resetAll();
                        addBonusPoints(3000);
                        // game loop
                        if (refreshTimer != null) {
                            clearInterval(refreshTimer);
                        }
                        refreshTimer = setInterval(function () {
                            if (!isPause && !screenTooSmall) {
                                requestAnimId = window.requestAnimationFrame(game);
                            }
                        }, 1000 / fps);
                        startLevel();
                    }, 4000);
                }
            }
        } else if (boss.directions.top && boss.position.y <= 30) {
            boss.directions.top = false;
            boss.directions.right = true;
        }
        
        break;
    }
}

/**
* Draw the chest
*/
function drawChest() {
    // clear
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#e5f1ef";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // draw player
    drawPlayer();
    
    // draw HUD
    drawHUD();
    
    // draw won message
    context.fillStyle = "red";
    context.font = "40px Lucida Console";
    var msg = "You won!";
    context.fillText(msg, canvas.width / 2 - context.measureText(msg).width / 2, 60);
    
    // draw chest
    var x = canvas.width / 2 - 120,
        y = 110;
    
    // draw inside chest
    context.fillStyle = "#290A00";
    context.strokeStyle = "black";
    context.fillRect(x, y + 30, 240, 30);
    context.strokeRect(x, y + 30, 240, 30);
    
    // draw coins inside chest
    context.fillStyle = "#FFD700";
    context.lineWidth = 1;
    for (var i = 0; i < 7; i++) {
        context.beginPath();
        context.arc(x + (i + 1) * 30, y + 60, 15, 0, Math.PI, true);
        context.fill();
        context.stroke();
        context.closePath();
    }
    for (var i = 0; i < 8; i++) {
        context.beginPath();
        context.arc(x + i * 30 + 15, y + 60, 15, 0, Math.PI, true);
        context.fill();
        context.stroke();
        context.closePath();
    }
    
    context.fillStyle = "#9A3A19";
    context.fillRect(x, y, 240, 30);
    context.strokeRect(x, y, 240, 30);
    
    context.fillRect(x, y + 60, 240, 60);
    context.strokeRect(x, y + 60, 240, 60);
    
    // draw lock
    context.fillStyle = "#FFD700";
    context.fillRect(x + 110, y + 20, 20, 20);
    context.strokeRect(x + 110, y + 20, 20, 20);
    
    context.fillStyle = "black";
    context.fillRect(x + 116, y + 22, 8, 16);
    
    // draw edges
    context.fillStyle = "#FFD700";
    context.fillRect(x, y, 15, 15);
    context.strokeRect(x, y, 15, 15);
    
    context.fillRect(x, y + 105, 15, 15);
    context.strokeRect(x, y + 105, 15, 15);
    
    context.fillRect(x + 225, y, 15, 15);
    context.strokeRect(x + 225, y, 15, 15);
    
    context.fillRect(x + 225, y + 105, 15, 15);
    context.strokeRect(x + 225, y + 105, 15, 15);
    
    // draw coins
    // bronze coins
    context.fillStyle = "#CD7F32";
    for (var i = boss.bronzeCoins.length - 1; i >= 0; i--) {
        context.beginPath();
        context.arc(boss.bronzeCoins[i].x, boss.bronzeCoins[i].y, 15, 0, 2 * Math.PI, true);
        context.fill();
        context.stroke();
        context.closePath();
    }
    
    // silver coins
    context.fillStyle = "#C0C0C0";
    for (var i = boss.silverCoins.length - 1; i >= 0; i--) {
        context.beginPath();
        context.arc(boss.silverCoins[i].x, boss.silverCoins[i].y, 25, 0, 2 * Math.PI, true);
        context.fill();
        context.stroke();
        context.closePath();
    }
    
    // gold coins
    context.fillStyle = "#FFD700";
    for (var i = boss.goldenCoins.length - 1; i >= 0; i--) {
        context.beginPath();
        context.arc(boss.goldenCoins[i].x, boss.goldenCoins[i].y, 40, 0, 2 * Math.PI, true);
        context.fill();
        context.stroke();
        context.closePath();
    }
    
    // platinium coins
    context.fillStyle = "#E5E4E2";
    for (var i = boss.platiniumCoins.length - 1; i >= 0; i--) {
        context.beginPath();
        context.arc(boss.platiniumCoins[i].x, boss.platiniumCoins[i].y, 60, 0, 2 * Math.PI, true);
        context.fill();
        context.stroke();
        context.closePath();
    }
    
    // bonus points
    drawBonusPoints();
}

/**
* Update the final level
*/
function animateLevel42() {
    // Move coins
    for (var i = boss.bronzeCoins.length - 1; i >= 0; i--) {
        // check collision
        if (isCollisionWithCircle(boss.bronzeCoins[i].x, boss.bronzeCoins[i].y, 15)) {
            boss.bronzeCoins.splice(i, 1);
            addBonusPoints(50);
        } else {
            var ratio = 4 / Math.sqrt(Math.pow(boss.bronzeCoins[i].target.x - boss.bronzeCoins[i].x, 2) + 
                        Math.pow(boss.bronzeCoins[i].target.y - boss.bronzeCoins[i].y, 2));
            boss.bronzeCoins[i].x += (boss.bronzeCoins[i].target.x - boss.bronzeCoins[i].x) * ratio;
            boss.bronzeCoins[i].y += (boss.bronzeCoins[i].target.y - boss.bronzeCoins[i].y) * ratio;

            if (boss.bronzeCoins[i].y > canvas.height + 100) {
                boss.bronzeCoins.splice(i, 1);
            }
        }
    }
    for (var i = boss.silverCoins.length - 1; i >= 0; i--) {
        // check collision
        if (isCollisionWithCircle(boss.silverCoins[i].x, boss.silverCoins[i].y, 25)) {
            boss.silverCoins.splice(i, 1);
            addBonusPoints(100);
        } else {
            var ratio = 5.5 / Math.sqrt(Math.pow(boss.silverCoins[i].target.x - boss.silverCoins[i].x, 2) + 
                        Math.pow(boss.silverCoins[i].target.y - boss.silverCoins[i].y, 2));
            boss.silverCoins[i].x += (boss.silverCoins[i].target.x - boss.silverCoins[i].x) * ratio;
            boss.silverCoins[i].y += (boss.silverCoins[i].target.y - boss.silverCoins[i].y) * ratio;

            if (boss.silverCoins[i].y > canvas.height + 100) {
                boss.silverCoins.splice(i, 1);
            }
        }
    }
    for (var i = boss.goldenCoins.length - 1; i >= 0; i--) {
        if (isCollisionWithCircle(boss.goldenCoins[i].x, boss.goldenCoins[i].y, 40)) {
            boss.goldenCoins.splice(i, 1);
            addBonusPoints(200);
        } else {
            var ratio = 7 / Math.sqrt(Math.pow(boss.goldenCoins[i].target.x - boss.goldenCoins[i].x, 2) + 
                        Math.pow(boss.goldenCoins[i].target.y - boss.goldenCoins[i].y, 2));
            boss.goldenCoins[i].x += (boss.goldenCoins[i].target.x - boss.goldenCoins[i].x) * ratio;
            boss.goldenCoins[i].y += (boss.goldenCoins[i].target.y - boss.goldenCoins[i].y) * ratio;

            if (boss.goldenCoins[i].y > canvas.height + 100) {
                boss.goldenCoins.splice(i, 1);
            }
        }
    }
    for (var i = boss.platiniumCoins.length - 1; i >= 0; i--) {
        if (isCollisionWithCircle(boss.platiniumCoins[i].x, boss.platiniumCoins[i].y, 60)) {
            boss.platiniumCoins.splice(i, 1);
            addBonusPoints(500);
        } else {
            var ratio = 9 / Math.sqrt(Math.pow(boss.platiniumCoins[i].target.x - boss.platiniumCoins[i].x, 2) + 
                        Math.pow(boss.platiniumCoins[i].target.y - boss.platiniumCoins[i].y, 2));
            boss.platiniumCoins[i].x += (boss.platiniumCoins[i].target.x - boss.platiniumCoins[i].x) * ratio;
            boss.platiniumCoins[i].y += (boss.platiniumCoins[i].target.y - boss.platiniumCoins[i].y) * ratio;

            if (boss.platiniumCoins[i].y > canvas.height + 100) {
                boss.platiniumCoins.splice(i, 1);
            }
        }
    }
}

/*
* CONSTRUCTORS
*/

/**
* Constructs an ennemy
*
* @param type the type
*/
function Ennemy(type) {
    var newEnnemy;
    
    var randomNumber = Math.floor(Math.random() * 5);
    switch (type) {
    case 1 : // fast ennemy
        newEnnemy = {positionX: 0, positionY: 0, width: 24, height: 16, color: "#14C814", speed: 4, face: randomNumber};
        break;
    case 2 : // slow ennemy
        newEnnemy = {positionX: 0, positionY: 0, width: 96, height: 40, color: "#35a6f2", speed: 2, face: randomNumber};
        break;
    case 3 : // normal ennemy
        newEnnemy = {positionX: 0, positionY: 0, width: 48, height: 24, color: "#000096", speed: 3, face: randomNumber};
        break;
    default: // normal ennemy by default
        newEnnemy = {positionX: 0, positionY: 0, width: 48, height: 24, color: "#14C814", speed: 3, face: randomNumber};
    }
    
    return newEnnemy;
}

/**
* Constructs a bonus
*
* @param type the type
*/
function Bonus(type) {
    var newBonus;
    
    switch (type) {
    case 1 : // points
        newBonus = {positionX: 0, positionY: 0, width: 14, height: 14, color: "#006400", color2: "#7CFC00", speed: 5, type: 1};
        break;
    case 2 : // invicible
        newBonus = {positionX: 0, positionY: 0, width: 8, height: 16, color: "#E100E1", color2: "#FF1493", speed: 6, type: 2};
        break;
    case 3 : // 1UP
        newBonus = {positionX: 0, positionY: 0, width: 12, height: 12, color: "#C81432", color2: "#FF4500", speed: 8, type: 3};
        break;
    case 4 : // score x 2
        newBonus = {positionX: 0, positionY: 0, width: 12, height: 12, color: "#66FFFF", color2: "#42A3A3", speed: 8, type: 4};
        break;
    default: // points
        newBonus = {positionX: 0, positionY: 0, width: 10, height: 10, color: "#006400", color2: "#7CFC00", speed: 6, type: 0};
    }
    
    return newBonus;
}

/**
* Constructs a new background
*
*/
function Background() {
    var newColor,
        newY,
        newBackground;
    
    switch (currentBackground) {
    case 0 : 
        newColor = "#FFFDE7";
        break;
    case 1 : 
        newColor = "#FFF9C4";
        break;
    case 2 : 
        newColor = "#FFF59D";
        break;
    case 3 : 
        newColor = "#FFF176";
        break;
    case 4 : 
        newColor = "#FFEE58";
        break;
    case 5 : 
        newColor = "#FFEB3B";
        break;
    case 6 : 
        newColor = "#FFEE58";
        break;
    case 7 : 
        newColor = "#FFF176";
        break;
    case 8 : 
        newColor = "#FFF59D";
        break;
    case 9 : 
        newColor = "#FFF9C4";
        break;
    default: 
        newColor = "#FFFDE7";
    }
    
    if (backgrounds.length <= 0) {
        newY = canvas.height - 100;
    } else {
        newY = backgrounds[backgrounds.length - 1].y - 100;
    }
    
    newBackground = {y: newY, color: newColor};
    currentBackground = (currentBackground + 1) % 10;
    
    return newBackground;
}

/**
* Constructs the first boss
*/
function Boss1() {
    return {
        fixedPart: [{x: 180, y: 20, w: 120, h: 80}, 
                    {x: 40, y: 100, w: 400, h: 120}, 
                    {x: 120, y: 220, w: 240, h: 80}, 
                    {x: 80, y: 300, w: 320, h: 40}, 
                    {x: 0, y: 340, w: 480, h: 60}], 
        eyes: [{x: 100.0, y: 120.0, w: 100.0, h: 80.0}, {x: 280.0, y: 120.0, w: 100.0, h: 80.0}],
        pupils: [{x: 140.0, y: 160.0, w: 40.0, h: 40.0}, {x: 300.0, y: 160.0, w: 40.0, h: 40.0}],
        nostrils: [{x: 200.0, y: 240.0, w: 20.0, h: 100.0}, {x: 260.0, y: 240.0, w: 20.0, h: 100.0}],
        eyebrows: [{x: 80.0, y: 60.0, w: 80.0, h: 20.0}, {x: 320.0, y: 60.0, w: 80.0, h: 20.0}],
        tentacles: [],
        growing: false,
        phase: 0
    }
}

/**
* Constructs the second boss (losange)
*/
function Boss2() {
    return {
        // on level 20, canvas is 554 * 488
        coord: {x: 277.0, y: 160.0},
        //    0
        //  3   1
        //    2
        // x0 = x, y + 120
        // x1 = x + 80, y1 = y
        // x2 = x, y2 = y + 120
        // x3 = x - 80, y3 = y
        w: 160,
        h: 240,
        angle: 0.0, 
        speed: 2.4,
        minions: [], 
        shadows: [], 
        guards: [], 
        directions: {left: false, right: false, top: false, bot: false}, 
        isVulnerable: false, 
        hp: 8, 
        phase: 0, 
        previousPhase: -1
    }
}

/**
* Constructs the third boss
*/
function Boss3() {
    return {
        triangles: [], 
        rectangles: [], 
        losanges: [], 
        speed: 4.0, 
        lines: []
    }
}

/**
* Constructs the third boss
*/
function FinalBoss() {
    return {
        position: {x:180, y:30},
        waves: [],
        directions: {left: false, right: false, top: false, bot: false},
        h: 220,
        w: 320,
        speed: 2.8,
        scepter: {x:60, y:-240, speed: 6.8, directions: {left: false, right: false, top: false, bot: false}},
        bullets: [],
        hits: 0,
        isdead: false,
        madness: 0
    }
}

function Chest() {
    return {
        platiniumCoins: [],
        goldenCoins: [],
        silverCoins: [],
        bronzeCoins: [],
        ended: false
    }
}

/*
* SETTERS
*/

/**
* Sets an element to a position
*
* @param element the element
* @param newX the X-position
* @param newY the Y-position
*/
function setPosition(element, newX, newY) {
    element.positionX = newX;
    element.positionY = newY;
}

/**
* Sets the e2 to arrive at the bottom of the screen at the same time than e1
*
* @param e1 the ref element
* @param e2 the 2nd element
*/
function SetFinishSimultaneously(e1, e2) {
    var nb_hit = (canvas.height - e1.positionY - e1.height) / e1.speed;
    e2.positionY = canvas.height - e2.speed * nb_hit - e2.height;
}
