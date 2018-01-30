/*
   Author:   Nedislav Denev
   Version:  0.3.0
*/
!function(window, document, TweenMax, $) {

    function ScannerGame() {
        _this = this;

        this.foods = [];
        this.choices = [];

        /* Food move Speed in seconds */
        this.foodMoveSpeed        =   0;
        /* Determine Length of the Scan Zone */
        this.triggerZoneLength    =   0;
        this.currentGameId        =   8;
        /* Starting Score */
        this.gameScore            =   0;
        this.gameTimer            =   {};
        /* Default active product batch */
        this.currentPart          =   2;
        this.timePassed           =   false;

        /* Animation Declarations */
        this.scanAnim             =   {};
        this.pointPos20           =   {};
        this.pointPos10           =   {};
        this.pointNeg20           =   {};
        this.pointNeg10           =   {};

        this.firstLevelTimer      =   {};
        this.secondLevelTimer     =   {};

        this.productAnimation     =   {};
        this.convAnim             =   {};
        this.frontConvAnim        =   {};

        this.init();
    }

    ScannerGame.prototype.init = function() {
        var self = this;

        this.foods = [
            '<div class="product fish" data-type="fish" data-score="20" data-flag="0"></div>',
            '<div class="product vegetables" data-type="vegetables" data-score="10" data-flag="0"></div>',
            '<div class="product canned-food" data-type="canned-food" data-score="-20" data-flag="0"></div>',
            '<div class="product soft-drink" data-type="soft-drink" data-score="-10" data-flag="0"></div>'
        ];

        this.choices = [
            { productClass: 'fish',         score:  20 },
            { productClass: 'vegetables',   score:  10 },
            { productClass: 'canned-food',  score: -20 },
            { productClass: 'soft-drink',   score: -10 }
        ];

        this.validate = function(prod) {
            var $prod, type, score;
                $prod = $(prod);
                type = $prod.data('type');
                score = $prod.data('score');

            for(var prop in _this.choices) {
                if(_this.choices[prop].productClass == type) {
                    if(_this.choices[prop].score != score) {
                        $prod.data('score', _this.choices[prop].score).attr('data-score', _this.choices[prop].score);
                    }
                }
            }
        };

        /* DOM Caching */
        this.$body                 =   $('body');
        this.$productLine          =   $('.product-line');
        this.$firstBatch           =   $('.first-batch');
        this.$secondBatch          =   $('.second-batch');
        this.$productLine          =   $('.product-line');
        this.$gameScene            =   $('.game-scene');
        this.$scanZone             =   $('.scan-zone');
        this.$scanClicker          =   $('.scan-clicker');
        this.$scoreboardEl         =   $('.scoreboard-score');
        this.$scoreboardAnimWrap   =   $('.scoreboard-animations');
        this.$timerContainer       =   $('.game-instructions');
        this.$convLineAnimCont     =   $('.product-line-background');
        this.$frontConveyorAnim    =   $('.conveyor-background');
        this.$popinStartContainer  =   $('.scanner-popin-start');
        this.$startGameButton      =   this.$popinStartContainer.find('.start-game');
        this.$popinEndContainer    =   $('.scanner-popin-end');
        this.$popinEndScoreCont    =   this.$popinEndContainer.find('.end-score');
        this.$popinEndRestartBtn   =   this.$popinEndContainer.find('.restart-game');
        this.$facebookShareBtn     =   $('.share-score');
        this.productLineWidth      =   parseInt( $('.product-line').width(), 10);

        // The left property of the scan zone
        this.triggerZoneStart    = parseInt(this.$scanZone.offset().left, 10);
        // console.log(this.triggerZoneStart)
        // increashed in order to make the game easier
        this.triggerZoneLength   = parseInt(this.$scanZone.width(), 10) + 50;
        this.triggerZoneEnd      = this.triggerZoneStart + this.triggerZoneLength;

        /* Timer Related Variables */
        this.timerStep        =   1;
        this.timerStartTime   =   0;
        this.timerDuration    =   60;

        this.productWidth     =   null;

        this.scanFlag         =   0;
        // Main product line animation speed in seconds
        this.foodMoveSpeed       = 10;
        this.conveyorAnimSpeed   = 3.75;

        /*
           ======================================
                        GAME DIFFICULTY
           ======================================
        */
            this.defaultAnimSpeed = 1;
            this.animSpeed = this.defaultAnimSpeed;
            // scale the animation speed
            this.animSpeed2 = 1.75;
            this.animSpeed3 = 2.5;

            this.scoreAnimationDefaultSpeed = 500;
            this.scoreAnimationSpeed = this.scoreAnimationDefaultSpeed;
            this.scoreAnimationSpeed2 = 375;
            this.scoreAnimationSpeed3 = 250;

        /*
           ======================================
                    GAME SPEED UP STAGES
           ======================================
        */                  //milliseconds
            // first step
            this.diffStepOne = 20000;

            // second step
            this.diffStepTwo = 40000;

        // bind restart
        this.eventsBinder(_this.$popinEndRestartBtn, _this.restartGame);
        // bind elements
        this.bindElements();

        // crucial for product line starting outside view range
        this.firstStart = true;
        _this.secondStart = false;

        // init popin manager
        this.popinManager();

        this.initTimer();

    };

    ScannerGame.prototype.startGame = function(e) {
        console.log('game starting');
        e.preventDefault();

        /* hide start game popin */
        _this.popinStart.hide();

        // fire the animations
        _this.productManager();

        // Start Timer
        _this.gameTimer.run();

        // init sprite animations
        _this.initSpriteAnimations();
    };

    /* Scan Functionality
        ~ on click cycles through each element and checks if one of them is in the scan zone
    */
    ScannerGame.prototype.scanner = function(e) {
        /* Add flash animation here */
        e.preventDefault();
        var productCenter       = _this.productWidth / 2,
            currentX            = 0,
            productScore        = 0,
            allProducts         = null;

        allProducts = _this.$productLine.find('.product');

        $.each(allProducts, function(index, product) {
                currentX = parseInt($(product).offset().left, 10) + productCenter - 30;

                // Check if the product is scanned already
                if($(product).data('flag') === 0) {
                    // console.log(currentX)
                    // Check if the center of the product is in the scan zone
                    if (currentX >= _this.triggerZoneStart && currentX <= _this.triggerZoneEnd) {
                        // console.log([$(product).data('type'), productScore]);
                        // Set the scanned flag
                        $(product).data('flag', 1);

                        _this.validate(product);

                        productScore = $(product).data('score');

                        _this.scoreBoardUpdater(productScore);
                        // TweenMax.pauseAll();

                        if (_this.scanFlag === 0) {
                            _this.scanFlag = 1;

                            _this.spriteAnimationHandler(_this.scanAnim, 300, function() {
                                _this.scanFlag = 0;
                            });
                        }
                    }
                }
        });
    };

    // Fires all product related methods/functions
    ScannerGame.prototype.productManager = function() {
        /* Generate 2 batches of 5 elements*/
        this.productGenerator(5, this.$firstBatch,  'batch_1');
        this.productGenerator(5, this.$secondBatch, 'batch_2');

        // Cache product width
        this.productWidth = parseInt($('.product').outerWidth(true), 10);

        // Cache width of a single batch
        this.productBatchWidth = parseInt(this.$firstBatch.width(), 10);

        this.$cloneBatch = this.$firstBatch.clone();
        this.$productLine.append(this.$cloneBatch);
        this.$productLine.width( this.productBatchWidth *3 );

        // Fire up the PRODUCT LINE
        this.switchParts(- this.productLineWidth, 0, false);

        // initiates difficulty countdown
        this.difficultyManager();

        this.conveyorAnimations();
    };

    // Builds and plays the conveyor animations
    ScannerGame.prototype.conveyorAnimations = function() {
        /* PRODUCT LINE ANIMATION */
        TweenMax.set(_this.$convLineAnimCont, {backgroundPosition:'0px 0px'});
        _this.convAnim = new TweenMax.to(_this.$convLineAnimCont, _this.conveyorAnimSpeed, {backgroundPosition:'1280px 0px', repeat: -1, ease:Linear.easeNone});
        _this.convAnim.play();

        /* Front product line animation*/
        TweenMax.set(_this.$frontConveyorAnim, {backgroundPosition:'0px 0px'});
        _this.frontConvAnim = new TweenMax.to(_this.$frontConveyorAnim, _this.conveyorAnimSpeed, {backgroundPosition:'-1280px 0px', repeat: -1, ease:Linear.easeNone});
        _this.frontConvAnim.play();
    };

    // Speeds up timeScale of the TweenMax timelines according to game difficulty at a preset difficulty increase time
    ScannerGame.prototype.difficultyManager = function() {

        /* DIFFICULTY LEVEL 2 */
        this.firstLevelTimer = setTimeout(function() {
            _this.animSpeed      = _this.animSpeed2;
            _this.scoreAnimationSpeed = _this.scoreAnimationSpeed2;

            _this.productAnimation.timeScale( _this.animSpeed );
            _this.convAnim.timeScale( _this.animSpeed2 );
            _this.frontConvAnim.timeScale( _this.animSpeed2 );
            console.info('LEVEL 2 Reached!');

        }, _this.diffStepOne);

        /* DIFFICULTY LEVEL 3 */
        this.secondLevelTimer = setTimeout(function() {
            _this.animSpeed           = _this.animSpeed3;
            _this.scoreAnimationSpeed = _this.scoreAnimationSpeed3;

            _this.productAnimation.timeScale( _this.animSpeed );
            _this.convAnim.timeScale( _this.animSpeed3 );
            _this.frontConvAnim.timeScale( _this.animSpeed3 );
            console.info('LEVEL 3 Reached!');

        }, _this.diffStepTwo);
    };

    /*
            Creates a tween max object that slides an element to a
            position executing a callback on completion
    */
    ScannerGame.prototype.animateProducts = function (slider, position, callback) {
        if (_this.productAnimation === null) {
            TweenMax.killTweensOf(_this.productAnimation);
            // console.log('killing in the name off');

            _this.productAnimation.to(slider, _this.foodMoveSpeed, {
                x: position,
                ease:Linear.easeNone,
                onComplete: function() {
                    callback();
                }
            });

        } else {
            _this.productAnimation = new TweenMax.to(slider, _this.foodMoveSpeed, {
                x: position,
                ease:Linear.easeNone,
                onComplete: function() {
                    callback();
                }
            });

        }
        _this.productAnimation.timeScale( _this.animSpeed );
        _this.productAnimation.play();
        // console.log(_this.productAnimation);
    };

    /*
       Randomization of product batches
       * accepts a dom element with the products
       * an object with the different product combinations
       * the sliding element that holds the batches
     */
    ScannerGame.prototype.changeProductBatch = function (products, choices) {
        var randomProperties = {};

        $(products).children('.product').each(function(index, item) {
            randomProperties = _this.chooseRandomArrayEl(choices, false);
            $(this).data('score', randomProperties.score);
            $(this).data('type', randomProperties.productClass).attr('data-type', randomProperties.productClass);
            $(this).removeClass();
            $(this).addClass('product ' + randomProperties.productClass);
        });
    };

    /*
            Switches between batches of products,
            you can enter starting and ending coordinates
            and decide whether you're going to append the batch to the parent
    */
    ScannerGame.prototype.switchParts = function(startX, endX, appendItems) {
        var _this = this;

        //changes to start product line outside the screen
        if ( _this.firstStart ) {
            startX = startX - 1480;
            _this.animSpeed = 0.7;
            _this.firstStart = false;
            _this.secondStart = true;

        } else if ( _this.secondStart ) {
            _this.secondStart = false;
            _this.animSpeed = _this.defaultAnimSpeed;
        }

        // set the slider position to 0 - reset
        TweenMax.set(_this.$productLine, {x: startX });

        // Fire first batch
        if(_this.currentPart == 1) {

            // change the currently visible part to this.$secondBatch
            _this.currentPart = 2;

            // console.log('Being switched: Blue')
            // console.log('Should be visible: Red')

            _this.$productLine.find('.product').data('flag', 0);
            // animate the slider with this.$secondBatch.width amount
            _this.animateProducts( _this.$productLine, endX, function() {
                _this.switchParts( -_this.productBatchWidth*2, 0, true);

                if(appendItems === true) {
                    _this.changeProductBatch(_this.$firstBatch, _this.choices);


                }
            });

        // Fire second batch
        } else if ( _this.currentPart == 2) {

            // change the currently visible part to this.$firstBatch
            _this.currentPart = 1;

            // console.log('Being switched: Red')
            // console.log('Should be visible: Blue')

            _this.$productLine.find('.product').data('flag', 0);
            _this.animateProducts(_this.$productLine, endX, function() {
                _this.switchParts( -_this.productBatchWidth*2, 0, true);

                if(appendItems === true) {
                    _this.changeProductBatch(_this.$secondBatch, _this.choices);
                    _this.$cloneBatch.html(_this.$firstBatch.html());
                }
            });
        }
    };

    /* Generates product DOM elements and appends them to a parent element */
    ScannerGame.prototype.productGenerator = function(amount, parent, batch) {
        var products = [];
        var prod = '';

        for( var i = 0; i < amount; i++ ) {
            prod = _this.chooseRandomArrayEl(this.foods, true);

            prod.element.attr('id', 'product_' + batch + '_' + i);

            products[i] = prod.element;
        }

        $(parent).append(products);
    };

    /* Generates random product from an array */
    ScannerGame.prototype.chooseRandomArrayEl = function(arr, domEl) {
        var item = arr[Math.floor(Math.random() * arr.length)];
        var product = $(item);

        if (domEl != true) {
            return item;
        } else {
            return {
                element: product,
            };
        }
    };

    /* Updates the Scoreboard */
    ScannerGame.prototype.scoreBoardUpdater = function(score) {
        // console.log(score);

        /* trigger score zone animation */
        switch(score) {
            case 20:
                // console.log('fire animation +20');
                _this.spriteAnimationHandler(_this.pointPos20, _this.scoreAnimationSpeed, function() {
                    _this.pointPos20.$obj.hide();
                }, true);
                break;
            case 10:
                // console.log('fire animation +10');
                _this.spriteAnimationHandler(_this.pointPos10, _this.scoreAnimationSpeed, function() {
                    _this.pointPos10.$obj.hide();
                }, true);
                break;
            case -20:
                // console.log('fire animation -20');
                _this.spriteAnimationHandler(_this.pointNeg20, _this.scoreAnimationSpeed, function() {
                    _this.pointNeg20.$obj.hide();
                }, true);
                break;
            case -10:
                // console.log('fire animation -10');
                _this.spriteAnimationHandler(_this.pointNeg10, _this.scoreAnimationSpeed, function() {
                    _this.pointNeg10.$obj.hide();
                }, true);
                break;
        }
        if ( this.gameScore > 0 && score > 0 ) {

            this.$scoreboardEl.html('+' + this.gameScore);
        }

        this.gameScore += score;

        if ( this.gameScore > 0 ) {

            this.$scoreboardEl.html('+' + this.gameScore);
        // dont allow negative score to be added
        } else if ( this.gameScore < 0 ) {

            this.gameScore = 0;
            this.$scoreboardEl.html(this.gameScore);
        // dont submit a plus sign if the score equals 0
        } else if (this.gameScore === 0) {

            this.$scoreboardEl.html(this.gameScore);
        }

    };

    /* Plays animation for a set amount of time and then fires a callback */
    ScannerGame.prototype.spriteAnimationHandler = function(animation, duration, onComplete, points) {
        animation.play();
        if (points === true) {
            animation.$obj.show();
        }
        // console.log(animation);
        setTimeout(function() {
            animation.reset();
            if (onComplete != null) {
                onComplete();
            }
        }, duration);
    };


    ScannerGame.prototype.initSpriteAnimations = function() {
        this.scanAnim = new CanvasSprite(_this.$scanZone, flashAnimation, {
            width: 133,
            height: 120,
            duration: 3,
            repeat: true,
        });

        this.pointPos20 = new CanvasSprite(_this.$scoreboardAnimWrap.children('.pos20'), pointPos20Animation, {
            width: 200,
            height: 200,
            duration: 1,
            repeat: true,
        });
        this.pointPos10 = new CanvasSprite(_this.$scoreboardAnimWrap.children('.pos10'), pointPos10Animation, {
            width: 200,
            height: 200,
            duration: 1,
            repeat: true,
        });
        this.pointNeg20 = new CanvasSprite(_this.$scoreboardAnimWrap.children('.neg20'), pointNeg20Animation, {
            width: 200,
            height: 200,
            duration: 1,
            repeat: true,
        });
        this.pointNeg10 = new CanvasSprite(_this.$scoreboardAnimWrap.children('.neg10'), pointNeg10Animation, {
            width: 200,
            height: 200,
            duration: 1,
            repeat: true,
        });
    };

    ScannerGame.prototype.bindElements = function() {
        this.eventsBinder(_this.$scanClicker, _this.scanner);
        this.eventsBinder(_this.$startGameButton, _this.startGame);
    };

    /* Binds events differently whether you're on mobile or desktop */
    ScannerGame.prototype.eventsBinder = function(el, fn) {
        if (Modernizr.touch) {
            // console.log('bound on touchend');
            el.on('touchend', function(event) {
                fn(event);
            });
        } else {
            // console.log('bound on click');

            el.on('click', function(event) {
                fn(event);
            });
        }
    };

    ScannerGame.prototype.unbindElements = function() {
        this.$scanClicker.off();
    };

    /* Initiates the timer */
    ScannerGame.prototype.initTimer = function() {

        this.gameTimer = new Timer(_this.$timerContainer, _this.timerStartTime, _this.timerDuration, _this.timerStep, function() {
            _this.endGame();
        });
    };

    ScannerGame.prototype.popinManager = function() {
        this.popinStart = new Popin(_this.$popinStartContainer);
        this.popinEnd   = new Popin(_this.$popinEndContainer);

        this.popinStart.show();
        this.popinEnd.hide();
    };

    /* End Game Screen + Logic goes here */
    ScannerGame.prototype.endGame = function(exit) {
        $.ajax({
            url: '/game-is-played',
            method: 'POST',
            dataType: 'json',
            data: {
                game: _this.currentGameId,
                data: this.gameScore,
                status: 'win'
            },
            success: function(response) {
                if (response.success) {
                    self.currentGameId = response.id;
                }
            }
        });

        console.log('YOUR TIME HAS RUN OUT');
        // Clear timeouts
        clearTimeout(this.firstLevelTimer);
        clearTimeout(this.secondLevelTimer);
        // Clear products
        _this.$firstBatch.children().remove();
        _this.$secondBatch.children().remove();
        // End the clone wars
        _this.$cloneBatch.remove();
        _this.$cloneBatch = null;
        // Kill animations
        TweenMax.killAll();
        // unbind events
        this.unbindElements();
        // add score to popin
        this.$popinEndScoreCont.html(_this.gameScore);

        this.$facebookShareBtn.on('click', function() {
            FB.ui({
                method: 'feed',
                link: 'http://carrefourmarketfetesesclients.fr',
                picture: window.baseUrl + '/assets/images/social/FB1new.png',
                caption: 'J&rsquo;ai r&eacute;alis&eacute; un score de ' + _this.gameScore + ' points &agrave; l&rsquo;animation du jour, essayer de me battre en vous connectant sur www.carrefourmarket.fr ? &Agrave; gagner une carte cadeau de 20 &euro; !',
            }, function(response){});
        });

        this.popinEnd.show();
    };

    /* End Game Screen + Logic goes here */
    ScannerGame.prototype.restartGame = function(e) {
        console.log('restarting');
        e.preventDefault();
        // reset timer
        _this.gameTimer.reset();
        _this.firstStart = true;
        _this.secondStart = false;
        // _this.currentPart = 2;
        // reset score
        _this.gameScore = 0;
        _this.scoreBoardUpdater(_this.gameScore);
        // bind elements
        _this.bindElements();
        // hide popin
        _this.popinEnd.hide();
        // reset score animation speed
        _this.scoreAnimationSpeed = _this.scoreAnimationDefaultSpeed;

        // Set anim speed to default
        _this.animSpeed = _this.defaultAnimSpeed;

        /* start game */
        _this.startGame(e);
    };

    $(function() {
        if (document.querySelector('#game-scanner')) {
            window._scanner = new ScannerGame();
        }
    });

}(window, document, TweenMax, jQuery);