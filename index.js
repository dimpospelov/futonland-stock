const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.send('Hello World, Fuckers!')
})

app.listen(3000)