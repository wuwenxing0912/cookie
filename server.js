var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
    console.log('请指定端口号，如：\nnode server.js 8888 ')
    process.exit(1)
}

var server = http.createServer(function(request, response) {
    var parsedUrl = url.parse(request.url, true)
    var pathWithQuery = request.url
    var queryString = ''
    if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
    var path = parsedUrl.pathname
    var query = parsedUrl.query
    var method = request.method


    if (path === '/') {
        let string = fs.readFileSync('./index.html', 'utf8')
        var cookies = request.headers.cookie.split('; ')
        console.log(cookies)
        let obj = {}
        for (let i = 0; i < cookies.length; i++) {
            let parts = cookies[i].split('=')
            let key = parts[0]
            let value = parts[1]
            obj[key] = value
        }
        let email = obj.sign_in_email
        users = fs.readFileSync('./db/user', 'utf8')
        users = JSON.parse(users)
        let foundedUser
        for (let i = 0; i < users.length; i++) {
            if (users[i].email === email) {
                foundedUser = users[i]
                break
            }
        }
        if (foundedUser) {
            string = string.replace('_email_', foundedUser.email)
        } else {
            string = string.replace('_email_', 'unknow')
        }

        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()
    } else if (path === '/sign-up' && method === 'GET') {
        let string = fs.readFileSync('./sign-up.html', 'utf8')
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.statusCode = 200
        response.end()
    } else if (path === '/sign-up' && method === 'POST') {
        readBody(request).then((body) => {
            var arrayInfo = body.split('&') //得到的是['email=xxx','password=xxx','password_confirm=xxx']
            let obj = {}
            arrayInfo.forEach((array) => {
                    var parts = array.split('=') //得到的是['email','xxx']
                    var key = parts[0]
                    var value = parts[1]
                    obj[key] = decodeURIComponent(value)
                })
                // var email = obj['email']
                // var password = obj['password']
                // var password_confirm = obj['password_confirm']
            var { email, password, password_confirm } = obj //等同于上面的写法
            if (email.indexOf('@') === -1) {
                response.statusCode = 400
                response.setHeader('Content-Type', 'application/json;charset=utf-8')
                response.write(`{
                    "errors":{
                        "email": "invalid"
                    }
                }`)
            } else if (password !== password_confirm) {
                response.statusCode = 400
                response.write(`{
                    "errors":{
                       "password": "invalid"
                    }
                }`)
            } else {
                var users = fs.readFileSync('./db/user', 'utf8')
                users = JSON.parse(users)
                console.log(users)
                var isUser = false
                for (var i = 0; i < users.length; i++) {
                    if (users[i].email === email) {
                        isUser = true
                        break;
                    }
                }
                if (isUser) {
                    response.statusCode = 400
                    response.write('user exist')
                } else {
                    users.push({ email: email, password: password })
                    userString = JSON.stringify(users)
                    fs.writeFileSync('./db/user', userString)
                    response.statusCode = 200
                }
            }
            response.end()
        })
    } else if (path === '/sign-in' && method === 'GET') {
        let string = fs.readFileSync('./sign-in.html', 'utf8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()
    } else if (path === '/sign-in' && method === 'POST') {
        readBody(request).then((body) => {
            var arrayInfo = body.split('&') //得到的是['email=xxx','password=xxx','password_confirm=xxx']
            let obj = {}
            arrayInfo.forEach((array) => {
                var parts = array.split('=') //得到的是['email','xxx']
                var key = parts[0]
                var value = parts[1]
                obj[key] = decodeURIComponent(value)
            })
            var { email, password } = obj

            var users = fs.readFileSync('./db/user', 'utf8')
            users = JSON.parse(users)
            var founded = false
            for (var i = 0; i < users.length; i++) {
                if (users[i].email === email && users[i].password === password) {
                    founded = true
                    break;
                }
            }
            if (founded) {
                response.setHeader('Set-Cookie', `sign_in_email=${email}`)
                response.statusCode = 200
            } else {
                response.statusCode = 401
            }

            response.end()
        })
    } else if (path === '/main.js') {
        let string = fs.readFileSync('./main.js', 'utf8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/javascript;charset=utf-8')
        response.write(string)
        response.end()

    } else if (path === '/xxx') {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/xml;charset=utf-8')
        response.write(`
        {
            "one":"大家好",
            "two":"才是",
            "three":"真的",
            "four":"好"
        }
        `)
        response.end()
    } else {
        response.statusCode = 404
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write('呜呜呜')
        response.end()
    }


})

function readBody(request) {
    return new Promise((resolve, reject) => {
        let body = []
        request.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            body = Buffer.concat(body).toString()
            resolve(body)
        })
    })
}

server.listen(port)
console.log('监听 ' + port + ' 成功\n请打开 http://localhost:' + port)