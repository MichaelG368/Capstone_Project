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
            res.redirect('/login')
        } catch{
            res.redirect('/register')
        }
    })

    const initalizePassport = require('./passport-config')

    ProfileCollection.find().toArray()
        .then(users => {
            initalizePassport(
                passport, 
                email => users.find(user => user.email === email),
                id => users.find(user => user.id === id)
                )        
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
        res.redirect('/login')
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

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', {first_name: req.user.first_name, last_name: req.user.last_name, email: req.user.email, od: req.user.od, 
        os: req.user.os, med_contact: req.user.med_contact, opto: req.user.opto, conditions: req.user.conditions})
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

ProfileCollection.find().toArray()
        .then(users => {
            initalizePassport(
                passport, 
                email => users.find(user => user.email === email),
                id => users.find(user => user.id === id)
                )        
        })

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNotAuthenticated, async (req, res) => {
    res.render('register.ejs')
})

app.get('/edit_profile', checkAuthenticated, (req, res) => {
    res.render('edit.ejs', {first_name: req.user.first_name, last_name: req.user.last_name, email: req.user.email, od: req.user.od, 
        os: req.user.os, med_contact: req.user.med_contact, opto: req.user.opto, conditions: req.user.conditions})
})

app.get('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
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