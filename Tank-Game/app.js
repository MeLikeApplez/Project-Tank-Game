const express = require('express')
const app = express()
const server = app.listen(8080, () => console.log('Listening...'))

const path = require('path')

const io = require('socket.io')(server)

app.use(express.static('html'))
app.use(express.static('css'))
app.use(express.static('js'))
app.use(express.static('music'))

app.use('/math.js', express.static(path.join(__dirname+'/node_modules/mathjs/lib/browser/math.js')))
app.use('/physics', express.static(path.join(__dirname+'/js/physics')))
app.use('/sat.js', express.static(path.join(__dirname+'/node_modules/sat/SAT.js')))
app.use('/tone.js', express.static(path.join(__dirname+'/node_modules/tone/build/Tone.js')))
app.use('/tone.js.map', express.static(path.join(__dirname+'/node_modules/tone/build/Tone.js.map')))

app.use('/create-asset.js', express.static(path.join(__dirname+'/js/assets/create-asset.ss')))

io.sockets.on('connection', socket => {
    socket.emit('refresh', 0)
})