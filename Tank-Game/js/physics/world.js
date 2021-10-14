class CanvasWorld extends CreateAsset {
    constructor(Engine) {
        super()

        this.Engine = Engine

        this.bodiesList = []
    }

    get Draw() {        
        return {
            create: function() {
                return {
                    [Symbol.for('location')]: 'draw',
                        type: 'path',
                        shape: '<shape>',
                        path: [],
                        drawExample: {
                            start: 'beginPath',
                            lineTo: [ { coordinates: [['x', 'y'], ['x', 'y']], order: null } ],
                            moveTo: [ { coordinates: [['x', 'y'], ['x', 'y']], order: null } ],
                            strokeStyle: '<color>',
                            fillStyle: '<color/null>',
                            end: 'closePath/null',
                        },
                        templete: {
                            start: 'beginPath',
                            lineTo: [], moveTo: [],
                            strokeStyle: '', fillStyle: '',
                            end: null
                        },
                        addPath: function(...drawings) {
                            drawings.forEach(drawing => {
                                let setup = this.templete
                                this.path.push(Object.assign(setup, drawing))
                            })
    
                            return true
                        },
                        load: function(context=null) {
                            if(!context) return void 0
                            let { path } = this
    
                            path.forEach(p => {
                                let { lineTo, moveTo } = p
    
                                lineTo.map(v => { v.type = 'lineTo' })
                                moveTo.map(v => { v.type = 'moveTo' })
    
                                let drawers = [...lineTo, ...moveTo].sort((a, b) => a.order - b.order)
    
                                context[p.start]()
    
                                // line and move drawing
                                drawers.forEach(({ type, coordinates }) => coordinates.map(coordinate => context[type](...coordinate)))
    
                                if(p.end == 'closePath') {
                                    if(p.fillStyle) {
                                        context.fillStyle = p.fillStyle
                                        context.fill()
                                    }
                                    context[p.end]()
                                }
    
                                context.strokeStyle = p.strokeStyle
                                context.stroke()
                            })  
                        },
                        // simple draw functions
                        polygonFill: function({ fillColor='white', lineColor='white', points=[] }={}) {
                            // ([x<int>, y<int>], [x<int>, y<int>], ...etc)
                            this.shape = 'polygon'
                            
                            this.addPath({
                                lineTo: [{ coordinates: points, order: 1 }],
                                strokeStyle: lineColor,
                                fillStyle: fillColor,
                                end: 'closePath'
                            })
                        },
                        polygonLine: function({ lineColor='white', points=[] }={}) {
                            // ({ points: [x<int>, y<int>], [x<int>, y<int>], ...etc })
                            this.shape = 'polygon'
                            
                            this.addPath({
                                lineTo: [{ coordinates: points, order: 1 }],
                                strokeStyle: lineColor,
                            })
                        },
                        square: function(options={}) {
                            //  ({ width: <int>, height: <int>, offsetX: <int>, offsetY: <int> })
                            let { lineColor='white', fillColor='white', fill=true } = options
                            let { width=0, height=0, offsetX=0, offsetY=0 } = options
                            this.shape = 'polygon'
                            
                            this.addPath({
                                lineTo: [{ coordinates: [[offsetX, offsetY], [offsetX, height+offsetY], 
                                    [width+offsetX, height+offsetY], [width+offsetX, offsetY], [offsetX, offsetY]],
                                    order: 1
                                }],
                                strokeStyle: lineColor, fillStyle: fill ? fillColor : '',
                                end: fill ? 'closePath' : null
                            })
                        },
                        triangle: function(options={}) {
                            // ({ points: [[x1<int>, y1<int>], [x2<int>, y2<int>], [x3<int>, y3<int>]] })
                            let { points } = options
                            if(points.length !== 3) return void 0
                            let { lineColor='white', fillColor='white', fill=true } = options
                            let { offsetX=0, offsetY=0 } = options
                            let [ [x1, y1], [x2, y2], [x3, y3] ] = points 
    
                            this.shape = 'polygon'

                            this.addPath({
                                lineTo: [{
                                    coordinates: [[x1+offsetX, y1+offsetY], [x2+offsetX, y2+offsetY], [x3+offsetX, y3+offsetY], [x1+offsetX, y1+offsetY]],
                                    order: 1
                                }],
                                strokeStyle: lineColor, fillStyle: fill ? fillColor : '',
                                end: fill ? 'closePath' : null
                            })                            
                        },
                        circle: function() {
                            // https://www.w3schools.com/tags/canvas_arc.asp
                        
                            this.shape = 'circle'
                        }
                    //
                }
            }
        }
    }

    get Bodies() {
        let world = this
        
        return {
            create: function(type='Entity', name='@Game-Object') {
                // ( type<String?>, name<String?> ) 

                if(!(type === 'Character' || type === 'Static' || type === 'Entity')) throw Error('Bodies Type must be Character, Static or Entity!')
                let uuid = world.createUUID()
                
                const state = Object.freeze({
                    [Symbol.for('location')]: 'state',
                    uuid: uuid,
                    get: function() {
                        return world.bodiesList.find(body => body.state.uuid === this.uuid)
                    },
                    get autoGet() {
                        return this.get()
                    }
                })
                
                const Properties = {
                    [Symbol.for('location')]: 'properties',
                    isStatic: type === 'Static',
                    isColliding: null,
                    isMoving: null,
                    isInteractable: true,
                    isKeyboardConnected: false,
                    isMouseConnected: false,
                    addProperties: function(obj={}) {
                        return Object.assign(this, obj)
                    }
                }

                const Controller = {
                    [Symbol.for('location')]: 'controller',
                    mouse: {
                        [Symbol.for('location')]: 'mouse',
                        connect: function(mouse) {
                            if(mouse.constructor.name !== 'MouseEvent') return false

                            this.mouseEvent = mouse
                            this.events = {
                                onclick: '',
                                onmousemove: null
                            }

                            this.listener = callback => {
                                mouse.onclick((type, event) => {
                                    this.events.onclick = event
                                    callback(type, event)
                                })

                                mouse.onmousemove(event => {
                                    this.events.onmousemove = event
                                    callback('move', event)
                                })
                            }

                            Properties.isMouseConnected = true
                            return true
                        },
                        disconnect: function() {
                            Properties.isMouseConnected = false
                            
                            this.mouseEvent.canvas.onmousedown = undefined
                            this.mouseEvent.canvas.onmouseup = undefined
                            this.mouseEvent.canvas.onmousemove = undefined

                            this.listener = null
                            this.mouseEvent = null
                            this.events = null

                            return true
                        },
                        listener: null,
                        mouseEvent: null,
                        events: null
                    },
                    keyboard: {
                        [Symbol.for('location')]: 'keyboard',
                        connect: function(keyboard) {
                            if(keyboard.constructor.name !== 'KeyboardEvent') return false

                            this.keyboardEvent = keyboard

                            this.listener = callback => {
                                keyboard.onkeydown((...args) => {
                                    this.events = args[1]
                                    callback(...args)
                                })

                                keyboard.onkeyup((...args) => {
                                    this.events = args[1]
                                    callback(...args)
                                })
                            }

                            Properties.isKeyboardConnected = true
                            return true
                        },
                        disconnect: function() {
                            Properties.isKeyboardConnected = false
                            
                            window.onkeydown = null
                            window.onkeyup = null

                            this.listener = null
                            this.keyboardEvent = null
                            this.events = null

                            return true
                        },
                        listener: null,
                        keyboardEvent: null,
                        events: null
                    }
                }

                let parentNode = state
                const Node = {
                    [Symbol.for('location')]: 'node',
                    type: 'parent',
                    parent: null,
                    children: [],
                    addChild: function(state) {
                        if(state[Symbol.for('location')] !== 'state') throw Error('Child location must be in the "state"!')
                        let newChild = state.autoGet

                        newChild.Node.type = 'child'
                        newChild.Node.parent = parentNode

                        this.children.push(state)

                        return true
                    },
                    removeChild: function(state) {
                        if(state[Symbol.for('location')] !== 'state') throw Error('Child location must be in the "state"!')
                        let index = this.children.findIndex(child => child.uuid === state.uuid)
                        let child = this.children[index].autoGet

                        child.Node.type = 'parent'
                        child.Node.parent = null

                        this.children.splice(index, 1)

                        return index !== -1
                    },
                    findChild: function(type, find) {
                        if(!(type === 'name' || type === 'uuid')) throw Error('Type must be "name" or "uuid"')

                        return this.children.find(child => child['autoGet'][type] === find) ?? -1
                    }
                }

                const newBody = {
                    [Symbol.for('location')]: 'main',
                    vector: [],
                    SATVector: new SAT.Polygon(new SAT.Vector(0, 0), []),
                    type: type,
                    rotation: 0,
                    uuid: uuid,
                    name: name,
                    state: state,
                    Properties: Properties,
                    Draw: world.Draw.create(),
                    Controller: Controller,
                    Node: Node
                }

                newBody.Draw.path = new Proxy(newBody.Draw.path, {
                    set: function(target, prop, value) {
                        target[prop] = value

                        let vectorHolder = [] 

                        for(let index = 0, length = target.length; index < length; index++) {
                            let path = target[index]
                            let drawers = [...path.lineTo, ...path.moveTo].sort((a, b) => a.order - b.order).map(d => d.coordinates)

                            drawers = drawers.reduce((total, curr) => total = [...total, ...curr])
                            vectorHolder.push(...drawers)
                        }

                        newBody.vector = vectorHolder
                        
                        switch(newBody.Draw.shape) {
                            case 'polygon':
                                let createSATVectors = vectorHolder.map(v => v = new SAT.Vector(...v))
                                createSATVectors = new SAT.Polygon(new SAT.Vector(0, 0), createSATVectors)

                                newBody.SATVector = createSATVectors
                                break;
                            case 'circle' :
                                newBody.SATVector = new SAT.Circle(new SAT.Vector(0, 0), 0)
                                break;
                        }

                        return Reflect.set(...arguments)
                    }
                })

                if(type === 'Character') Object.assign(newBody, { clientX: 0, clientY: 0 })

                world.add(newBody)

                return newBody.state

            }
        }
    }

    getCanvasSize(canvas) {
        // ( canvas<HTMLCanvas> )

        return [parseFloat(canvas.style.width), parseFloat(canvas.style.height)]
    }

    isOutOfBounds(body, border, { offsetX=0, offsetY=0 }={}) {
        // ( body<world body>, border<array>, offsets<object?> )

        let [ width, height ] = border
        let collided = false
        let xCheck, yCheck

        for(let vIndex = 0, vLength = body.vector.length; vIndex < vLength; vIndex++) {
            let vector = body.vector[vIndex]
            let [ x, y ] = vector
            xCheck = x + offsetX < 0 || x + offsetX >= width
            yCheck = y + offsetY < 0 || y + offsetY >= height

            if(xCheck || yCheck) {
                collided = true
                break
            }

        }

        return {
            collided: collided,
            x: xCheck, y: yCheck
        }
    }

    createTank({ offsetX=0, offsetY=0, tankName='', tankColor='rgb(80, 120, 250)', barrelColor='rgb(80, 120, 250)', Mouse=null, Keyboard=null }={}) {
        // ( options<object?> )

        let tank = this.Bodies.create('Character', `@Tank ${tankName}`).autoGet
        let barrel = this.Bodies.create('Character', `@Tank-Barrel ${tankName}`).autoGet

        barrel.Properties.isInteractable = false

        if(Mouse && Keyboard) {
            tank.Controller.mouse.connect(Mouse)
            tank.Controller.keyboard.connect(Keyboard)
        }

        tank.Draw.square({ width: 120, height: 70, offsetX: offsetX, offsetY: offsetY, fillColor: tankColor, lineColor: tankColor })
        barrel.Draw.square({ width: 120, height: 10, offsetX: offsetX+50, offsetY: offsetY+30, fillColor: barrelColor, lineColor: barrelColor })

        tank.Node.addChild(barrel.state)

        tank.Properties.addProperties({
            Bullet: {
                shootCount: 0
            }
        })

        return {
            tank: tank,
            barrel: barrel
        }
    }

    createBullet(parent, barrel) {
        // ( parent<world body>, barrel<world body> )

        if(!(parent || barrel)) throw Error('No Parent tank or barrel!')    
        
        // bullet shoot count max limit    
        if(parent.Properties.Bullet.shootCount >= 6) return void 0

        // every time it shoots count up
        ++parent.Properties.Bullet.shootCount

        let bullet = this.Bodies.create('Entity', '@Bullet Moving-Bullet').autoGet

        let [ cx, cy ] = this.Engine.Vector.getCenter(parent.vector)
        let [ x, y ] = [cx, (cy - 2.5)]

        bullet.Properties.isInteractable = false
        bullet.Properties.addProperties({
            Bullet: {
                bounceCount: 0,
                parent: parent.state
            }
        })

        bullet.Draw.polygonFill({
            points: [[x+0, y+0], [x+20, y+0], [x+30, y+2], [x+30, y+3], [x+20, y+5], [x+0, y+5]],
            fillColor: 'grey', lineColor: 'grey'
        })

        // rotate bullet with the barrel
        this.Engine.Velocity.setRotation(bullet, barrel.rotation, [ cx, cy ])
        
        // offset the bullet to the end of the barrel
        let rateOffset = 80
        let [ ax, ay ] = this.Engine.Vector.moveFromRotation(rateOffset, bullet.rotation)

        Velocity.move(bullet, ax, ay)
    }

    add(...bodies) {
        // ( ...bodies<world bodies> )

        for(let index = 0, length = bodies.length; index < length; index++) {
            let bodyLocation = bodies[index][Symbol.for('location')]
            if(bodyLocation !== 'main') throw Error(`Bodies must be in the "main" location! Current Location: "${bodyLocation}"`)
        }

        let beforeList = [...this.bodiesList, ...bodies]

        // re-arrange the list so bullets render first
        let bullets = beforeList.filter(v => v.name.includes('Bullet'))
        let notBullets = beforeList.filter(v => !v.name.includes('Bullet'))

        this.bodiesList = [...bullets, ...notBullets]
    }

    remove(...bodies) {
        // ( ...bodies<world bodies> )

        let nested = nest => {
            let children = nest.Node.children
            let length = children.length

            if(length > 0) {
                let child

                for(let index = 0; index < length; index++) {
                    child = children[index]['autoGet']
                    let bodyIndex = this.bodiesList.findIndex(b => b.uuid == child.uuid)

                    nested(child)
                    this.bodiesList.splice(bodyIndex, 1)
                }

                return true
            } else {
                return false
            }
            
        }
        
        for(let index = 0, length = bodies.length; index < length; index++) {
            let bodyLocation = bodies[index][Symbol.for('location')]
            if(bodyLocation !== 'main') throw Error(`Bodies must be in the "main" location! Current Location: "${bodyLocation}"`)
            
            let body = bodies[index]
            let bodyIndex = this.bodiesList.findIndex(b => b.uuid == body.uuid)

            if(bodyIndex === -1) continue
            
            try {
                body.Controller.mouse.disconnect()
                body.Controller.keyboard.disconnect()
            } catch(err) {}

            nested(body)

            this.bodiesList.splice(bodyIndex, 1)
        }
    }

    createUUID() {
        let fourString = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)

        return `${fourString()}${fourString()}-${fourString()}-${fourString()}-${fourString()}-${fourString()}${fourString()}`
    }
}