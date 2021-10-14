class Vector2D {
    constructor(Engine) {
        this.Engine = Engine
    }

    clone(obj) {
        // ( obj<any> )

        return JSON.parse(JSON.stringify(obj))
    }

    toSAT(vector) {
        // ( vector<array><array> )

        return new SAT.Polygon(new SAT.Vector(0, 0), vector.map(v => new SAT.Vector(v[0], v[1])))
    }

    toVector(sat) {
        // ( sat<SAT.Polygon> )

        return sat.points.map(v => [v.x, v.y])
    }

    toRadian(deg) {
        // ( deg<int> )

        return deg * (math.PI / 180)
    }

    toDegree(rad) {
        // ( rad<int> )

        return rad * (180 / math.PI)
    }

    getCenter(vector) {
        // ( vector<array><array> )

        let x = vector.map(v => v[0]).sort((a, b) => a - b)
        let y = vector.map(v => v[1]).sort((a, b) => a - b)

        let biggestX = x[x.length-1]
        let biggestY = y[y.length-1]
        let smallestX = x[0]
        let smallestY = y[0]

        return [
            (smallestX + biggestX) / 2,
            (smallestY + biggestY) / 2
        ]
    }

    getSides(vector) {
        // ( vector<array><array> )
        
        let x = vector.map(v => v[0]).sort((a, b) => a - b)
        let y = vector.map(v => v[1]).sort((a, b) => a - b)

        let biggestX = x[x.length-1]
        let biggestY = y[y.length-1]
        let smallestX = x[0]
        let smallestY = y[0]

        return {
            left: smallestX, right: biggestX,
            top: smallestY, bottom: biggestY,
            width: biggestX - smallestX,
            height: biggestY - smallestY
        }
    }

    getSignByRotation(deg) {
        // ( deg<int> )

        return [
            (deg >= 90) && (deg <= 270) ? -1 : 1,
            (deg >= 0) && (deg <= 180) ? -1 : 1
        ]
    }

    getQuadrantByRotation(deg) {
        // ( deg<int> )

        let [ signX, signY ] = this.getSignByRotation(deg)
        let sign = `${signX} ${signY}`

        switch(sign) {
            case '1 1': {
                return 1
                break
            }
            case '-1 1': {
                return 2
                break
            }
            case '-1 -1': {
                return 3
                break
            }
            case '1 -1': {
                return 4
                break
            }
        }
    }

    moveFromRotation(rateOfChange, deg) {
        // ( rateOfChange<int>, deg<int> )

        // get the flipped y-axis-sign
        let flip = this.getSignByRotation(deg)[1]

        deg = this.toRadian(deg)

        // formula
        // cos = x
        // sin = y
        // [cos( radian ) * rateOfChange, sin( radian ) * rateOfChange]
        return [
            (math.cos(deg) * rateOfChange),
            // flip the rate by y-axis-sign because the y-axis is flipped
            (math.sin(deg) * (flip === 1 ? -rateOfChange : rateOfChange)) * flip
        ]
    }

    deepCollisionCheck(body, x=0, y=0) {
        // ( body<world body>, x<int?>, y<int?> )

        if(body[Symbol.for('location')] !== 'main') throw Error(`Bodies must be in the "main" location! Current Location: "${body[Symbol.for('location')]}"`)
        let future = sat => new SAT.Polygon(new SAT.Vector(0, 0), sat.points.map(v => new SAT.Vector(v.x + x, v.y + y)))
        let collided = false

        function nested(nest) {
            let children = nest.Node.children
            let length = children.length

            if(length > 0) {
                let child

                for(let index = 0; index < length; index++) {
                    child = children[index]['autoGet']

                    if(child.Properties.isInteractable) {
                        for(let otherBodyIndex = 0, length = this.Engine.World.bodiesList.length; otherBodyIndex < length; otherBodyIndex++) {
                            let otherBody = this.Engine.World.bodiesList[otherBodyIndex]
                
                            if(otherBody.uuid === child.uuid || !otherBody.Properties.isInteractable) continue
                            
                            if(this.collisionCheck(future(child.SATVector), otherBody.SATVector) || this.collisionCheck(child.SATVector, otherBody.SATVector)) {
                                collided = true
                                break
                            }
                        }
                    }

                    nested(child)
                }

                return false
            } else {
                return true
            }
        }
        
        if(body.Properties.isInteractable) {
            for(let otherBodyIndex = 0, length = this.Engine.World.bodiesList.length; otherBodyIndex < length; otherBodyIndex++) {
                let otherBody = this.Engine.World.bodiesList[otherBodyIndex]
    
                if(otherBody.uuid === body.uuid || !otherBody.Properties.isInteractable) continue
    
                if(this.collisionCheck(future(body.SATVector), otherBody.SATVector) || this.collisionCheck(body.SATVector, otherBody.SATVector)) {
                    collided = true
                    break
                }
            }
        }

        nested(body)

        return collided
    }

    allCollisionCheck(vector, options={}) {
        // ( vector<array><array>, options<object> )

        if(!Array.isArray(vector)) throw Error('A Vector must be provided!')

        const { clone=false, excludes=[] } = options
        let collided = false

        vector = clone ? this.clone(vector) : vector

        for(let otherBodyIndex = 0, length = this.Engine.World.bodiesList.length, excludeLength = excludes.length; otherBodyIndex < length; otherBodyIndex++) {
            let otherBody = this.Engine.World.bodiesList[otherBodyIndex]
            let skipIteration = false

            for(let excludeIndex = 0; excludeIndex < excludeLength; excludeIndex++) {
                let exclude = excludes[excludeIndex]

                if(otherBody.uuid === exclude.uuid || !otherBody.Properties.isInteractable) {
                    skipIteration = true
                    break
                }
            }

            if(skipIteration) continue

            if(this.collisionCheck(Vector.toSAT(vector), otherBody.SATVector)) {
                collided = true
                break
            }
        }

        return collided
    }

    collisionCheck(bodyA, bodyB) {
        // ( bodyA<world body>, bodyB<world body> )

        let SATVectors = [bodyA, bodyB]
        let constructorAName = bodyA.constructor.name.toLowerCase()
        let constructorBName = bodyB.constructor.name.toLowerCase()

        switch(constructorAName) {
            case 'polygon':
                if(constructorBName === 'polygon') return SAT.testPolygonPolygon(...SATVectors)
                    
                // circle
                return SAT.testPolygonCircle(...SATVectors)
            break;
            case 'circle':
                if(constructorBName === 'circle') return SAT.testCircleCircle(...SATVectors)
                    
                // circle
                return SAT.testCirclePolygon(...SATVectors)
            break;
        }
    }

    rotate(vector, deg, [ cx=0, cy=0 ]=[]) {
        // ( vector<array><array>, deg<int>, centers<array> )
        
        deg = this.toRadian(deg)

        for(let index = 0, length = vector.length; index < length; index++) {
            let v = vector[index]
            let [ x, y ] = v

            let cos = math.cos(deg)
            let sin = math.sin(deg)

            v[0] = (cos * (x - cx)) + (sin * (y - cy)) + cx
            v[1] = (cos * (y - cy)) - (sin * (x - cx)) + cy
        }

        return vector
    }
}