const express = require('express')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const app = express()

const connectionString = 'mongodb+srv://futonland:7KXaQvPzeVjw87c@cluster0.ncmz1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'

MongoClient.connect(connectionString, (err, client) => {
  if (err) throw err

  console.log('Database connected')
  const db = client.db('futonland-stock')
  const stockCollection = db.collection('stock')

  app.set('view engine', 'ejs')
  app.use(express.static('public'))
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  app.get('/', (req, res) => {
    stockCollection.find().toArray()
      .then(results => {
        res.render('index.ejs', { quotes: results })
      })
      .catch(error => console.error(error))

    
    // res.send('Hello World')
    // res.sendFile(__dirname + '/index.html')
  })

  app.post('/quotes', (req, res) => {
    stockCollection.insertOne(req.body)
      .then(result => {
        res.redirect('/')
        console.log(result)
      })
      .catch(error => console.error(error))
  })

  app.put('/quotes', (req, res) => {
    stockCollection.findOneAndUpdate(
      { name: 'Yoda' },
      {
        $set: {
          name: req.body.name,
          quote: req.body.quote
        }
      },
      {
        upsert: true
      }
    )
    .then(result => {
      res.json('Success')
     })
    .catch(error => console.error(error))
  })

  app.delete('/quotes', (req, res) => {
    stockCollection.deleteOne(
      { name: req.body.name }
    )
    .then(result => {
      if (result.deletedCount === 0) {
        return res.json('No quote to delete')
      }
      res.json(`Deleted Darth Vadar's quote`)
    })
    .catch(error => console.error(error))
  })

  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`Server started on port ${port}`)
  })

})