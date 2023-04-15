const express = require("express")
const path = require('path')
const hbs = require('express-handlebars')
const Datastore = require('nedb')

const app = express()
const PORT = 3000   

app.use(express.urlencoded({ extended: true }))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')

app.engine('hbs', hbs({
    extname: '.hbs',
    partialsDir: "views/partials",
    helpers: {
        formatBool: (val) => {
            if(val===null) { return "Brak danych" }
            else return val ? "Tak" : "Nie"
        },
        formatSelect: (val) => {
            return val ? "selected" : ""
        },
        eq: (a, b) => {
            return a==b
        },
        insideValue: (a, b) => {
            return a[b]
        }
    } 
}))

const options = ['ubezpieczony', 'benzyna', 'uszkodzony', 'naped4x4']
const select = [true, false, null]
const carsDb = new Datastore({
    filename: 'cars.db',
    autoload: true
})
const carDoc = {
    ubezpieczony: null,
    benzyna: null,
    uszkodzony: null,
    naped4x4: null 
}
var lastDeleted = {}
var currentEdit = null

app.get("/", (req, res) => {
    res.render('index.hbs', {});
})

app.get("/addCar", (req, res) => {
    res.render('add.hbs', {options: options})
})

app.post("/addCar/add", (req, res) => {
    if(!req.body.options) req.body.options = []
    for (let option in carDoc) {
        req.body.options.includes(option) ? carDoc[option] = true : carDoc[option] = false
    }
    carsDb.insert(carDoc, (err, newDoc) => {
        res.render("add.hbs", {options: options, id: newDoc._id})
    })
})

app.get("/list", (req, res) => {
    carsDb.find({}, (err, docs) => {
        res.render("list.hbs", {data: docs})
    })
})

app.get("/list/delete", (req, res) => {
    console.log(req.query.id)
    carsDb.findOne({_id: req.query.id}, (err, doc) => {
        if(doc) lastDeleted = doc
    })
    carsDb.remove({_id: req.query.id})
    carsDb.find({}, (err, docs) => {
        res.render("list.hbs", {data: docs, id: req.query.id, revert: false})
    })
})

app.get("/list/revert", (req, res) => {
    carsDb.insert(lastDeleted)
    carsDb.find({}, (err, docs) => {
        res.render("list.hbs", {data: docs, id: lastDeleted._id, revert: true})
    })
})

app.get("/edit", (req, res) => {
    currentEdit = req.query.id
    carsDb.find({}, (err, docs) => {
        res.render("edit.hbs", {data: docs, options: options, select: select, id: req.query.id})
    })
})

app.get("/edit/confirm", (req, res) => {
    for (let option in carDoc) {
        if(req.query[option] == '') carDoc[option] = null
        else req.query[option] == 'true' ? carDoc[option]=true : carDoc[option]=false
    }
    carsDb.update({_id: currentEdit}, {$set: carDoc})
    carsDb.find({}, (err, docs) => {
        console.log(req.query)
        res.render("edit.hbs", {data: docs, options: options, select: select, id: req.query.id})
    })
})

app.use(express.static('static'))

app.listen(PORT, () => {
    console.log('Server starting... PORT: ' + PORT)
})