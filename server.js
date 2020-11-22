if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const { Server } = require('mongodb')
const MongoClient = require('mongodb').MongoClient

MongoClient.connect('mongodb+srv://MJGAdmin:TheDBuserf0rmyprojectDB.@profiles.bbaev.mongodb.net/EyeProfileDetails.EyeProfiles?retryWrites=true&w=majority', { useUnifiedTopology: true }, (err, client) => {
    if (err) return console.error(err)
    console.log('Connected to Database')
    const db = client.db('EyeProfiles')
    const ProfileCollection = db.collection('EyeProfileDetails')

    app.post('/register', checkNotAuthenticated, async (req, res) => {
        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            ProfileCollection.insertOne({
                id: Date.now().toString(),
                email: req.body.email,
                password: hashedPassword,
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                od: req.body.od,
                os: req.body.os,
                med_contact: req.body.med_contact,
                opto: req.body.opto,
                conditions: req.body.conditions
            })
            req.logOut()
            res.redirect('/')
        } catch{
            res.redirect('/register')
        }
    })

    const initalizePassport = require('./passport-config')
    
    app.get('/login', checkNotAuthenticated, (req, res) => {
        res.render('login.ejs')
        ProfileCollection.find().toArray()
        .then(users => {
            initalizePassport(
                passport, 
                email => users.find(user => user.email === email),
                id => users.find(user => user.id === id)
                )        
        })
    })

        app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }))

    app.get('/', checkAuthenticated, (req, res) => {
        ProfileCollection.findOne({ id: req.user.id })
        .then(users => {
            res.render('index.ejs', {first_name: users.first_name, last_name: users.last_name, email: users.email, od: users.od, 
                os: users.os, med_contact: users.med_contact, opto: users.opto, conditions: users.conditions})    
        })
    })

    app.get('/edit_profile', checkAuthenticated, (req, res) => {
        ProfileCollection.findOne({ id: req.user.id })
        .then(users => {
        res.render('edit.ejs', {first_name: users.first_name, last_name: users.last_name, email: users.email, od: users.od, 
            os: users.os, med_contact: users.med_contact, opto: users.opto, conditions: users.conditions})
        })
    })
    
    app.put('/edit_profile', async (req, res) => {
        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            ProfileCollection.findOneAndUpdate(
                { id: req.user.id },
            { $set: {id: req.user.id,
                email: req.body.email,
                password: hashedPassword,
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                od: req.body.od,
                os: req.body.os,
                med_contact: req.body.med_contact,
                opto: req.body.opto,
                conditions: req.body.conditions} }
                )
            req.logOut()
            res.redirect('/')
        } catch{
            res.redirect('/login')
        }
    })
    
    app.delete('/delete_profile', checkAuthenticated, (req, res) => {
        ProfileCollection.findOneAndDelete(
            { id: req.user.id }
        )
        req.logOut()
        res.redirect('/')
    })

})

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended:false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/register', checkNotAuthenticated, async (req, res) => {
    res.render('register.ejs')
})

app.get('/logout', (req, res) => {
    req.logOut()
    res.redirect('/')
})

app.use(express.static(__dirname + '/public'));

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}

app.listen(process.env.PORT || 3000)