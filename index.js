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
    // Remove empty values from the query
    req.query = Object.fromEntries(Object.entries(req.query).filter(([_, v]) => v != ''));

    stockCollection.find(req.query).toArray()
      .then(results => {

        // List of brands and count
        let brands = []
        let brandsCounted = {}        
        results.forEach(result => brands.push(result.brand))
        brands.sort().forEach(x => { brandsCounted[x] = (brandsCounted[x] || 0) + 1 })

        // List of product types and count
        let types = []
        let typesCounted = {}        
        results.forEach(result => types.push(result.product_type))
        types.sort().forEach(x => { typesCounted[x] = (typesCounted[x] || 0) + 1 })

        res.render('index.ejs', { 
          request: req.query,
          count: results.length,
          brands: brandsCounted,
          types: typesCounted,
          products: results
        })
      })
      .catch(error => console.error(error))
  })

  // Adding documents manually. Remove this.
  app.post('/products', (req, res) => {
    stockCollection.insertOne(req.body)
      .then(result => {
        res.redirect('/')
      })
      .catch(error => console.error(error))
  })

  // app.put('/products', (req, res) => {
  //   stockCollection.findOneAndUpdate(
  //     { name: 'Yoda' },
  //     {
  //       $set: {
  //         name: req.body.name,
  //         quote: req.body.quote
  //       }
  //     },
  //     {
  //       upsert: true
  //     }
  //   )
  //   .then(result => {
  //     res.json('Success')
  //    })
  //   .catch(error => console.error(error))
  // })

  // Removing documents manually. Remove this.
  app.delete('/products', (req, res) => {
    stockCollection.deleteOne(
      // { name: req.body.name }
      {}
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
