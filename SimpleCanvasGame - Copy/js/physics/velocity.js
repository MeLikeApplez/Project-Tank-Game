class Velocity2D {
    constructor(Engine) {
        this.Engine = Engine
    }

    move(body, x=0, y=0) {
        // ( body<world body>, x<int?>, y<int?> )

        // auto collision detection
        if(body[Symbol.for('location')] !== 'main') throw Error(`Bodies must be in the "main" location! Current Location: "${body[Symbol.for('location')]}"`)
        
        const nested = (nest) => {
            let children = nest.Node.children
            let length = children.length

            if(length > 0) {
                let child

                for(let index = 0; index < length; index++) {
                    child = children[index]['autoGet']
                
                    for(let vIndex = 0, vLength = child.vector.length; vIndex < vLength; vIndex++) {
                        child.vector[vIndex][0] = +((child.vector[vIndex][0] + x).toFixed(13))
                        child.vector[vIndex][1] = +((child.vector[vIndex][1] + y).toFixed(13))
                    }

                    child.SATVector.setPoints(child.vector.map(v => v = new SAT.Vector(...v)))

                    nested(child)
                }

                return true
            } else {
                return false
            }
        }

        if(!this.Engine.Vector.deepCollisionCheck(body, x, y)) {
            for(let index = 0, length = body.vector.length; index < length; index++) {            
                body.vector[index][0] = +((body.vector[index][0] + x).toFixed(13))
                body.vector[index][1] = +((body.vector[index][1] + y).toFixed(13))
            }

            nested(body)
        }

        body.SATVector.setPoints(body.vector.map(v => v = new SAT.Vector(...v)))
    }

    setRotation(body, deg=0, center) {
        // ( body<world body>, deg<int?>, center<array> )

        // NO auto collision detection

        if(body[Symbol.for('location')] !== 'main') throw Error(`Bodies must be in the "main" location! Current Location: "${body[Symbol.for('location')]}"`)

        deg = deg - body.rotation

        body.rotation = +((body.rotation + deg).toFixed(13))
        body.rotation = +((body.rotation >= 360 ? body.rotation - 360 : (body.rotation <= 0 ? body.rotation + 360 : body.rotation)).toFixed(13))

        return this.Engine.Vector.rotate(body.vector, deg, center)
    }

    rotate(body, deg=0, center) {
        // ( body<world body>, deg<int?>, center<array> )
        
        // auto collision detection
        
        if(body[Symbol.for('location')] !== 'main') throw Error(`Bodies must be in the "main" location! Current Location: "${body[Symbol.for('location')]}"`)
        
        let rotatedVector = this.Engine.Vector.rotate(Vector.clone(body.vector), deg, center)
        let isColliding = this.Engine.Vector.allCollisionCheck(rotatedVector, { excludes: [body] })

        if(!isColliding) {
            body.rotation = +((body.rotation + deg).toFixed(13))
            body.rotation = +((body.rotation >= 360 ? body.rotation - 360 : (body.rotation <= 0 ? body.rotation + 360 : body.rotation)).toFixed(13))
            
            return this.Engine.Vector.rotate(body.vector, deg, center)
        }
        
        // check if body is stuck
        if(Vector.deepCollisionCheck(body)) {
            deg *= -1

            body.rotation = +((body.rotation + deg).toFixed(13))
            body.rotation = +((body.rotation >= 360 ? body.rotation - 360 : (body.rotation <= 0 ? body.rotation + 360 : body.rotation)).toFixed(13))
            
            return this.Engine.Vector.rotate(body.vector, deg, center)
        }

        return body.vector
    }
}