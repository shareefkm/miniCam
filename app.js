//connect mongoose
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/minimart');
const port = 3007;
//imports
const express = require('express');
const app = express();
const layout = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const nocache = require('nocache');
const config = require('./config/config')



const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin')
//static Files
app.use(express.static('public'))
app.use('/css',express.static(__dirname+'public/css'));
app.use('/js',express.static(__dirname+'public/js'));
app.use('/fonts',express.static(__dirname+'public/fonts'));
app.use('/images',express.static(__dirname+'public/images'));



//set engine
app.use(layout);
app.set('layout','./layout/layout')
app.set('view engine','ejs')

app.use(cookieParser());
app.use(session({
    secret:config.sessionSecret,
    saveUninitialized:true,
    resave:false,
    cookie:{
        maxAge:5000000
    }
}));
app.use(nocache());





//routs
app.use('/',userRouter)
app.use('/admin',adminRouter)


//404 error
app.get('*',(req,res)=>{
    res.status(404),res.render('404')
})
app.listen(port,()=> console.log(`server connected ${port}...`));