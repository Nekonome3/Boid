enchant();

// シーンの幅、高さ
var GameWidth = 480;
var GameHeight = 320;
// 背景色
var SceneBackgroundColor = '#3388ff';

// boidの数
var BoidNum = 100;
// boidの色
var BoidRed = 255;
var BoidGreen = 33;
var BoidBlue = 33;

// 接近とみなす距離
var CollisionNearDistance = 10;
// ほどほどの距離
var CollisionMiddleDistance = 30;
// 離れているとみなす距離
var CollisionFarDistance = 60;

// 方向転換するときの最大速度
var MaxSpeed = 3;

// デバッグ用カウンタ
var refreshCount = 0;

window.onload = function() {
    var game = new Game( GameWidth, GameHeight );
    
    game.fps = 60;
    game.rootScene.backgroundColor = SceneBackgroundColor;
    var srf = new Surface( GameWidth, GameHeight );
    game.rootScene.addChild( srf );
    // boidsの初期化
    var boids = new Array();
    
    for( var i = 0; i < BoidNum; i++ ) {
        var xl = myRandom( GameWidth );
        var yl = myRandom( GameHeight );
        var xv = Math.cos( Math.random() * Math.PI * 2.0 );
        var yv = Math.sin( Math.random() * Math.PI * 2.0 );
        var pl = new Point( xl, yl );
        var pv = new Point( xv, yv );
        
        if( i == 0 ) {	// Leader
            boids[i] = new Boid( pl, pv, 0, 0, 0 );
        }else {
            boids[i] = new Boid( pl, pv, BoidRed, BoidGreen, BoidBlue );
        }
        boids[i].distance[i] = 0;
    }
    // Game#onload
    game.onload = function() {
        srf.addEventListener( "enterframe", function() {
            srf.clear();
            for( var i = 0; i < BoidNum; i++ ) {
                srf.setPixel( boids[i].location.x, boids[i].location.y, boids[i].red, boids[i].green, boids[i].blue, 255 );
                // Update Location
                escapeCollision( boids );
            }
            for( var i = 0; i < BoidNum; i++ ) {
                updateLocation( boids[i] );
            }
            refreshCount++;
        } );
    }
    
    game.start();
}

/**
 点同士の接近判定を行い、反発させます
 
 @param boid : boidを管理するクラス
*/
function escapeCollision( boids ) {
    var ncnt, fcnt, mcnt;
    var tmp;
    
    // 点同士の距離を更新
    getDistance( boids );
    // 点同士の接近を判定
    for( var i=0; i<BoidNum; i++ ) {
        var nd = new Point( 0, 0 );
        var fd = new Point( 0, 0 );
        var md = new Point( 0, 0 );
        
        ncnt = fcnt = mcnt = 0;
        for( var j=0; j<BoidNum; j++ ) {
            if( i == j ) continue;
            // 各点との接近を判定
            if( boids[i].distance[j] < CollisionNearDistance ) {	// 距離が近い
                tmp = new Point( ( boids[i].location.x - boids[j].location.x ), ( boids[i].location.y - boids[j].location.y ) );
                var z = Math.sqrt( ( tmp.x * tmp.x ) + ( tmp.y * tmp.y ) );
                
                if( z == 0 ) {
                    tmp.x = Math.cos( Math.random() * Math.PI * 2.0 );
                    tmp.y = Math.sin( Math.random() * Math.PI * 2.0 );
                }else {
                    tmp.x = tmp.x / z;
                    tmp.y = tmp.y / z;
                }
                
                nd.x += tmp.x;
                nd.y += tmp.y;
                ncnt++;
            }else if( boids[i].distance[j] < CollisionMiddleDistance ) {	// ほどほどの距離
                tmp = new Point( boids[j].vector.x, boids[j].vector.y );
                
                md.x += tmp.x;
                md.y += tmp.y;
                mcnt++;
            }else if( boids[i].distance[j] < CollisionFarDistance ) {	// 距離が遠い
                tmp = new Point( ( boids[i].location.x - boids[j].location.x ), ( boids[i].location.y - boids[j].location.y ) );
                var z = Math.sqrt( ( tmp.x * tmp.x ) + ( tmp.y * tmp.y ) );
                
                tmp.x = tmp.x / z;
                tmp.y = tmp.y / z;
                
                fd.x += tmp.x;
                fd.y += tmp.y;
                fcnt++;
            }
        }
        // 接近あり
        setCollisionVector( boids, i, nd, ncnt, fd, fcnt, md, mcnt );
    }
}

/**
 点同士の接近を受けて方向転換します
 
 @param boids : boid配列
 @param i : 配列番号
 @param nd : 接近方向転換ベクトル
 @param ncnt : 接近した点の数
 @param fd : 離脱方向転換ベクトル
 @param fcnt : 離脱した点の数
 @param md : 並行方向転換ベクトル
 @param mcnt : 並行した点の数
*/
function setCollisionVector( boids, i, nd, ncnt, fd, fcnt, md, mcnt ) {
    if( ncnt > 0 ) {
        boids[i].vector.x += ( nd.x / ncnt );
        boids[i].vector.y += ( nd.y / ncnt );
    }
    if( fcnt > 0 ) {
        boids[i].vector.x -= ( fd.x / fcnt );
        boids[i].vector.y -= ( fd.y / fcnt );
    }
    if( mcnt > 0 ) {
        boids[i].vector.x += ( md.x / mcnt );
        boids[i].vector.y += ( md.y / mcnt );
    }
    if( Math.abs( boids[i].vector.x ) > MaxSpeed ) {
        if( boids[i].vector.x > 0 ) {
            boids[i].vector.x = Math.random();
        }else {
            boids[i].vector.x = Math.random() * (-1);
        }
    }
    if( Math.abs( boids[i].vector.y ) > MaxSpeed ) {
        if( boids[i].vector.y > 0 ) {
            boids[i].vector.y = Math.random();
        }else {
            boids[i].vector.y = Math.random() * (-1);
        }
    }
}

/**
 各点と点の距離を更新します
 
 @param boids : boid配列
*/
function getDistance( boids ) {
    for( var i=0; i<(BoidNum-1); i++ ) {
        for( var j=(i+1); j<BoidNum; j++ ) {
            var x = boids[i].location.x - boids[j].location.x;
            var y = boids[i].location.y - boids[j].location.y;
            var dis = Math.sqrt( ( x * x ) + ( y * y ) );
            
            boids[i].distance[j] = dis;
            boids[j].distance[i] = dis;
        }
    }
}

/**
 boidの座標を更新します
 
 @param boid : boidを管理するクラス
*/
function updateLocation( boid ) {
    boid.location.x += boid.vector.x;
    boid.location.y += boid.vector.y;
    // 画面外判定
    wallHitCheck( boid );
}

/**
 画面外へのあたり判定を行います
 
 @param boid : boidを管理するクラス
*/
function wallHitCheck( boid ) {
    if( boid.location.x < 0 ) {
        boid.location.x = 0;
        boid.vector.x = boid.vector.x * (-1);
    }else if( boid.location.x > GameWidth ) {
        boid.location.x = GameWidth;
        boid.vector.x = boid.vector.x * (-1);
    }
    if( boid.location.y < 0 ) {
        boid.location.y = 0;
        boid.vector.y = boid.vector.y * (-1);
    }else if( boid.location.y > GameHeight ) {
        boid.location.y = GameHeight;
        boid.vector.y = boid.vector.y * (-1);
    }
}

/**
 0〜maxの乱数を返却します。
 
 @return 乱数
*/
function myRandom( max ) {

    if( max == 0 ) {
        return 0;
    }
    var add;
    
    if( max > 0 ) {
        add = 1;
    }else {
        add = -1;
    }
    rt = Math.floor( Math.random() * (max + add) );
    
    return rt;
}

/**
 座標を管理するクラス
 
 @param x : x座標
 @param y : y座標
*/
function Point( x, y ) {
    this.x = x;
    this.y = y;
    
    return this;
}

/**
 boidを管理するクラス
 
 @param pl : x, y座標
 @param pv : x, y方向
 @param red : 赤色
 @param green : 緑色
 @param blue : 青色
*/
function Boid( pl, pv, red, green, blue ) {
    // 位置・方向
    this.location = pl;
    this.vector = pv;
    // その他のboidとの距離
    this.distance = new Array( BoidNum );
    // 点の色
    this.red = red;
    this.green = green;
    this.blue = blue;
    
    return this;
}
