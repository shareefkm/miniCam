
const isUserLogin = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            next()
        }else{
            res.redirect('/')
        }
    } catch (error) {
        console.log(error.message);
    }
}
const isUserLogout = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            res.redirect('/')
        }else{
            next()
        }
    } catch (error) {
        console.log(error.message);
    }
}
const isAdminLogin = async(req,res,next)=>{
    try {
        if(req.session.admin_id){
            next()
        }else{
            res.redirect('/admin')
        }
    } catch (error) {
        console.log(error.message);
    }
}
const isAdminLogout = async(req,res,next)=>{
    try {
        if(req.session.admin_id){
            res.redirect('/admin/adminhome')
        }else{
            next()
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    isUserLogin,
    isUserLogout,
    isAdminLogin,
    isAdminLogout
}