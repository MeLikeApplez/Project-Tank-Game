class MouseEvent {
    constructor(canvas) {
        this.canvas = canvas
        this.up = false
        this.down = false
    }

    onclick(callback) {
        let thisMouseEvent = this
        this.canvas.onmousedown = function(event) {
            this.up = false
            this.down = true
            callback('down', event)
        }

        this.canvas.onmouseup = function(event) {
            this.up = true
            this.down = false
            callback('up', event)
        }
    }

    onmousemove(callback) {
        this.canvas.onmousemove = function(event) {
            callback(event)
        }
    }
}

class KeyboardEvent {
    constructor() {
        this.pressed = []
        this.allowed = ['w', 'a', 's', 'd']
    }

    onkeydown(callback) {
        let pressed = this.pressed
        let allowed = this.allowed

        window.onkeydown = function(event) {
            if(!pressed.some(k => k === event.key) && allowed.some(k => k === event.key)) {
                pressed.push(event.key)

                callback(pressed, event)
            }
        }
    }

    onkeyup(callback) {
        let pressed = this.pressed

        window.onkeyup = function(event) {
            if(pressed.some(k => k === event.key)) {
                pressed.splice(pressed.findIndex(k => k === event.key), 1)

                callback(pressed, event)
            }
        }
    }
}