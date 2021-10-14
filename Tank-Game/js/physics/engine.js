class CanvasEngine extends CanvasAnimation {
    constructor(canvas, imports) {
        super()

        this.canvasContext = canvas.getContext('2d')
        this.canvasElement = canvas

        const { CanvasWorld, Vector2D, Velocity2D } = imports

        this.World = new CanvasWorld(this)
        this.Vector = new Vector2D(this)
        this.Velocity = new Velocity2D(this)
    }

    Render(callback) {
        let { World, Velocity } = this
        let pause, loadBodies = false

        const animator = this.Animate(this.fps.maxLimit, props => {
            this.canvasContext.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
            
            this.fps = props.fps
            clearTimeout(pause)

            if(loadBodies) {
                let bodiesList = World.bodiesList
                for(let index = 0, length = bodiesList.length; index < length; index++) {
                    let body = bodiesList[index]
    
                    body.Draw.load(this.canvasContext)
    
                }
            } 
            
            loadBodies = true

            pause = setTimeout(() => {
                loadBodies = false
                console.warn(`Reloading Animation... ${new Date()}`)
            }, props.fps.delta * 1000 * 3)

            callback(animator, props)
        })

        if(typeof callback === 'function') {
            animator.start('delay', 1000)
        }
    }

    Initialize(callback) {
        this.canvasElement.width = 1080 * 2
        this.canvasElement.height = 720 * 2

        this.canvasElement.style.width = '1080px'
        this.canvasElement.style.height = '720px'

        this.canvasContext.scale(2, 2)

        this.canvasContext.strokeStyle = 'white'
        this.canvasContext.fillStyle = 'white'

        callback()
    }

    Unstable(warnOnly=false) {
        if(!warnOnly) throw Error('This Function is an Unstable Feature! Please Do Not Use this Function if it is Unstable!')

        console.warn('Warning! This Function is an Unstable Feature!')
        console.trace()
    }
}