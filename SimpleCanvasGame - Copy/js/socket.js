void function __socket_init__() {
    let count = 0
    io.connect(location.origin).on('refresh', () => ++count > 1 ? location.reload() : 0)
}()