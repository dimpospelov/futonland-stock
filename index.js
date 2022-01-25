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

  // Authentication middleware
  app.use((req, res, next) => {
    const auth = {login: 'futonland', password: 'calyer'}
    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')
    if (login && password && login === auth.login && password === auth.password) {
      return next()
    }
    res.set('WWW-Authenticate', 'Basic realm="401"') // change this
    res.status(401).send('Authentication required.') // custom message
  })

  app.get('/', (req, res) => {

    // Removing empty values from the query
    req.query = Object.fromEntries(Object.entries(req.query).filter(([_, v]) => v != ''));

    let query = {}
    if (req.query.product_type) query.product_type = req.query.product_type
    if (req.query.brand) query.brand = req.query.brand
    if (req.query.keyword || req.query.location) {
      query.$and = []
      if (req.query.keyword) query.$and.push( { $or: [ { title: { $regex: req.query.keyword, $options: "i" } }, { product_type: { $regex: req.query.keyword, $options: "i" } }, { brand: { $regex: req.query.keyword, $options: "i" } }, { itemid: { $regex: req.query.keyword, $options: "i" } } ] } )
      if (req.query.location) query.$and.push( { $or: [ { [req.query.location+'-1']: { $exists: true } }, { [req.query.location+'-2']: { $exists: true } } ] } )
    }
    if (req.query.price == '2500') delete req.query.price
    if (req.query.price) query.sale_price = { $gt: 0, $lt: parseInt(req.query.price) }

    // console.log(query)

    stockCollection.find(query).sort({ [req.query.sort || 'title']: 1 }).toArray()
      .then(results => {

        // Exclusions
        for (var i=0; i<results.length; i++) {
          if (results[i].product_type == "Fabrics" ||
            results[i].product_type == "Futon Covers" ||
            results[i].product_type == "Futon Sets" ||
            results[i].product_type == "Pillow Shams") {
            results.splice(i, 1)
            i--
          }
        }

        // Filters info
        let brands = [],
          types = [],
          prices = [],
          brandsCounted = {},
          typesCounted = {}

        results.forEach((result) => {
          brands.push(result.brand)
          types.push(result.product_type)
          prices.push(result.sale_price)
        })
        brands.sort().forEach(x => { brandsCounted[x] = (brandsCounted[x] || 0) + 1 })
        types.sort().forEach(x => { typesCounted[x] = (typesCounted[x] || 0) + 1 })

        // Rendering page
        res.render('index.ejs', { 
          request: req.query,
          count: results.length,
          brands: brandsCounted,
          types: typesCounted,
          priceMin: Math.min(...prices),
          products: results,
          timestamp: results.length ? results[0]._id.getTimestamp() : ''
        })

      })
      .catch(error => console.error(error))


  })

  // app.post('/products', (req, res) => {
  //   stockCollection.insertOne(req.body)
  //     .then(result => {
  //       res.redirect('/')
  //     })
  //     .catch(error => console.error(error))
  // })

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

  // app.delete('/products', (req, res) => {
  //   stockCollection.deleteOne(
  //     // { name: req.body.name }
  //     {}
  //   )
  //   .then(result => {
  //     if (result.deletedCount === 0) {
  //       return res.json('No quote to delete')
  //     }
  //     res.json(`Deleted Darth Vadar's quote`)
  //   })
  //   .catch(error => console.error(error))
  // })

  const port = process.env.PORT || 3001
  app.listen(port, () => {
    console.log(`Server started on port ${port}`)
  })

})
