const Canvas = document.querySelector('.Game-Screen')

const Engine = new CanvasEngine(Canvas, { CanvasWorld, Vector2D, Velocity2D })

const { World, Vector, Velocity } = Engine

const Mouse = new MouseEvent(Canvas)
const Keyboard = new KeyboardEvent()

const { tank: Player, barrel: PlayerBarrel } = World.createTank({
    tankName: 'Player',
    tankColor: 'rgb(80, 120, 250)', barrelColor: 'rgb(70, 100, 200)',
    Mouse: Mouse, Keyboard: Keyboard
})

const { tank: Bot, barrel: BotBarrel } = World.createTank({
    tankName: 'Bot',
    tankColor: 'rgb(250, 100, 80)', barrelColor: 'rgb(200, 80, 70)',
    offsetY: 400
})

const bulletVelocityRate = 300

// const Music = new Tone.Player(`${location.origin}/wii_tanks.mp3`).toDestination()

Engine.Initialize(async () => {
    let pressedKeys = []

    // Tone.loaded().then(() => {
    //     Music.start()
    // })

    // animation renderer
    Engine.Render(props => {
        if(Player.Properties.isMouseConnected && Player.Properties.isKeyboardConnected) {
            Player.Controller.keyboard.listener((pressed=[]) => pressedKeys = pressed)
            Player.Controller.mouse.listener(playerMouseEvents)

            for(let index = 0, length = pressedKeys.length; index < length; index++) {
                let key = pressedKeys[index]
                
                let [ centerX, centerY ] = Vector.getCenter(Player.vector)
                let angle = Vector.toDegree(math.atan2(Player.clientY - centerY-5, Player.clientX - centerX-5))
                
                // reverse the angle because the y-axis is flipped
                Velocity.setRotation(PlayerBarrel, -angle, [ centerX, centerY ])

                let quadrant = Vector.getQuadrantByRotation(Player.rotation)

                console.log(quadrant)

                switch(key) {
                    case 'w': {
                        
                        Velocity.rotate(Player, Engine.fps.delta * 200, Vector.getCenter(Player.vector))
                        Velocity.move(Player, 0, Engine.fps.delta * -200)
                    
                        break
                    } case 'a': {

                        Velocity.rotate(Player, Engine.fps.delta * 200, Vector.getCenter(Player.vector))
                        Velocity.move(Player, Engine.fps.delta * -200, 0)
                        
                        break
                    } case 's': {
                        
                        Velocity.rotate(Player, Engine.fps.delta * -200, Vector.getCenter(Player.vector))
                        Velocity.move(Player, 0, Engine.fps.delta * 200)
                        
                        break
                    } case 'd': {
                        
                        Velocity.rotate(Player, Engine.fps.delta * -200, Vector.getCenter(Player.vector))
                        Velocity.move(Player, Engine.fps.delta * 200, 0)
                        
                        break
                    }
                }
            }
        }

        // move bullets
        animateBullets()
    })
    
    function animateBullets() {
        let bullets = World.bodiesList.filter(v => v.name.includes('@Bullet'))
        let tanks = World.bodiesList.filter(v => v.name.includes('@Tank '))

        for(let index = 0, length = bullets.length; index < length; index++) {
            let bullet = bullets[index]
            let parent = bullet.Properties.Bullet.parent.autoGet
            let killTank

            let [ x, y ] = Vector.moveFromRotation(bulletVelocityRate * Engine.fps.delta, bullet.rotation)
            let { collided: outOfBounds, x: xCheck } = World.isOutOfBounds(bullet, World.getCanvasSize(Canvas), { offsetX: x, offsetY: y })

            // check for all tanks & soon obstacles <<< TODO
            for(let tIndex = 0, tLength = tanks.length; tIndex < tLength; tIndex++) {
                let tank = tanks[tIndex]

                if(Vector.collisionCheck(bullet.SATVector, tank.SATVector)) {
                    killTank = tank
                    break
                }
            }

            // kill the tank and remove bullet
            if(killTank) {
                parent.Properties.Bullet.shootCount -= 1
                World.remove(killTank, bullet)

                continue
            }


            // detect for borders, obsticles and tanks
            if(outOfBounds) {
                let bulletCenter = Vector.getCenter(bullet.vector)    
                let flipRotate = xCheck ? 180 - bullet.rotation : 360 - bullet.rotation

                // flipRotate = xCheck ? + 180 + flipRotate : flipRotate
                let [ x, y ] = Vector.moveFromRotation(bulletVelocityRate * Engine.fps.delta, flipRotate)

                // kill the tank that the bullet hit
                if(++bullet.Properties.Bullet.bounceCount > 1) {
                    // check to see if bullet did not killed parent
                    if(parent) parent.Properties.Bullet.shootCount -= 1
                    World.remove(bullet)
                }

                Velocity.setRotation(bullet, flipRotate, bulletCenter)
                Velocity.move(bullet, x*2, y*2)

            } else {
                // move bullet
                Velocity.move(bullet, x, y)
            }
        }

    }
    
    function playerMouseEvents(type, event) {
        if(type === 'move') {
            let { clientX, clientY } = event
            let [ centerX, centerY ] = Vector.getCenter(Player.vector)

            // Getting the real mouse position from the canvas because it gets the window pos instead of the real canvas pos
            let { left: canvasLeft, top: canvasTop } = Canvas.getBoundingClientRect()

            clientX -= canvasLeft
            clientY -= canvasTop

            Player.clientX = clientX
            Player.clientY = clientY
            
            let angle = Vector.toDegree(math.atan2(clientY - centerY-5, clientX - centerX-5))

            Velocity.setRotation(PlayerBarrel, -angle, [ centerX, centerY ])
        } else if(type === 'down') {
            World.createBullet(Player, PlayerBarrel)
        }
    }

    console.clear()
    console.log('%cGame Running...', 'color: rgb(50, 250, 100);')
})