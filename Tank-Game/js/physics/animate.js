class CanvasAnimation {
    constructor() {
        this.fps = {
            set: null,
            current: null,
            maxLimit: 60,
            delta: null,
        }
    }

    Animate(setFPS=60, execute) {
        let lastLoop = new Date()
        let maxFPSLimit = 60
        let anim = {
            fps: null,
            fpsInterval: null,
            startTime: null,
            now: null,
            then: null,
            elapsed: null,
            animationFunction: null
        }

        if(setFPS > maxFPSLimit) throw Error('FPS cannot be set higher than 60 FPS')

        anim.fpsInterval = 1000 / setFPS
        anim.then = Date.now()
        anim.startTime = anim.then

        function run(timestamp) {
            anim.animationFunction = requestAnimationFrame(run)

            anim.now = Date.now()
            anim.elapsed = anim.now - anim.then
            
            if(anim.elapsed > anim.fpsInterval) {
                let thisLoop = new Date()
                let fps = 1000 / (thisLoop - lastLoop)
                lastLoop = thisLoop
                execute({
                    fps: {
                        set: setFPS,
                        current: fps,
                        maxLimit: maxFPSLimit,
                        delta: 1 / fps
                    },
                })

                anim.then = anim.now - (anim.elapsed % anim.fpsInterval)
            }
        }

        return {
            start: function(delay, ms) {
                if(delay?.toLowerCase() == 'delay') return void setTimeout(() => run(), ms)
                run()

                return this
            },
            stop: function() {
                cancelAnimationFrame(anim.animationFunction)
                
                return this
            }
        }
    }
}