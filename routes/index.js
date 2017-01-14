//登录和注册需要的User类
var User = require('../models/user');
//发表需要的Post类
var Post = require('../models/post');
var Type = require('../models/type');
// 查询模块
var url = require('url');
//引入留言需要的Comment类
var Comment = require('../models/comment');
//需要引入一个加密的模块
var crypto = require('crypto');
//引入multer插件
var multer = require('multer');
//插件的配置信息
// var storage = multer.diskStorage({
//     //这个是上传图片的地址.
//     destination:function(req,file,cb){
//         cb(null,'public/images')
//     },
//     //上传到服务器上图片的名字.
//     filename:function(req,file,cb){
//         cb(null,file.originalname)
//     }
// })
// var upload = multer({storage:storage,size:10225});

//一个权限的问题？
//1.用户未登录的情况下，是无法访问/post ,/logout的
//2.用户在登录的情况下，是无法访问/login,/reg 的
//那么，如果才能完成这个权限的问题呢？

function checkLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login');
    }
    next();
}
//如果登录了，是无法访问登录和注册页面的
function checkNotLogin(req, res, next) {
    if (req.session.user) {
        res.redirect('back');
    }
    next();
}

module.exports = function(app){
    app.get('/',function(req,res){
        var page = parseInt(req.query.p) || 1;
        Post.getTen(null,page,function(err,posts,total){
            if(err){
                posts = [];
            }
            User.getAll(function (err,users) {
                if(err){
                    users = [];
                }
                res.render('web/body',{
                    title:'主页',
                    page:page,
                    total:total,
                    users:users,
                    isFirstPage:(page-1)==0,
                    isLastPage:((page-1)*10+posts.length)==total,
                    user:req.session.user,
                    //所有的文章
                    posts:posts
                })
            })
        });
    })

    // 用户注册
    app.get('/reg', checkNotLogin);
    app.get('/reg',function(req,res,next){
        res.render('web/reg',{
            title:'注册兔耳',
            user:req.session.user
        });
    })
    // 注册行为
    app.post('/doReg', checkNotLogin);
    app.post('/doReg',function(req,res,next){
        var date = new Date();
        var time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        var errors;
        var name = req.body.name;
        var email = req.body.email;
        var password = req.body.password;
        var confirmPsd = req.body.confirmPassword;
        //补充一下，如果未填写的情况下，提示用户
        if(name == '' || password == '' || confirmPsd == '' || email == ''){
            return res.end('用户信息不能为空');
        }
        if(errors){
            res.end(errors);
        }else{
            //2.对密码进行加密处理
            var md5 = crypto.createHash('md5');
            var password = md5.update(req.body.password).digest('hex');

            //3.可以开始实例化User对象了
            var newUser = new User({
                name:name,
                time:time,
                password:password,
                email:email,
                logo:'/upload/images/defaultlogo.png'
            });
            User.getEmail(newUser.email,function(err,user){
                //如果发生了错误,跳转回首页
                if(err){
                    return res.end('/');
                }
                //如果存在重复的用户名
                if(user){
                    return res.end('邮箱已存在');
                }
                User.getName(newUser.name,function (err,user) {
                    if(err){
                        return res.end('/');
                    }
                    //如果存在重复的用户名
                    if(user){
                        return res.end('用户名已存在');
                    }
                    newUser.save(function(err,user){
                        if(err){
                            req.end('error');
                        }
                        //用户信息存入session
                        // req.session.user = newUser;
                        //console.log(req.session.user);
                        res.end('success');
                    })
                })
            })
        }
    })

    //登录
    app.get('/login', checkNotLogin);
    app.get('/login',function(req,res){
        res.render('web/login',{
            title:'登录',
            user:req.session.user,
        })
    })

    //登录行为
    app.post('/doLogin', checkNotLogin);
    app.post('/doLogin',function(req,res){
        //1.检查下用户名有没有
        //2.检查下密码对不对
        //3.存储到session中用户的登录信息
        //4.跳转到首页
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        User.getEmail(req.body.email,function(err,user){
            if(!user){
                //说明用户名不存在
                return res.end('邮箱不存在');
            }
            //检查两次密码是否一样
            if(user.password != password){
                return res.end('密码错误');
            }
            req.session.user = user;
            //console.log(req.session.user);
            return res.end('success');
        })

    })

    // 退出
    app.get('/logout',function(req,res){
        //1.清除session
        //2.给用户提示
        //3.跳转到首页
        req.session.user = null;
        res.redirect('/');
    })

    //发表
    app.get('/post', checkLogin);
    app.get('/post',function(req,res){
        Type.getAll(req.session.user.email,function (err,types) {
            if(err){
                types = [];
            }
            res.render('web/add',{
                title:'发表',
                user:req.session.user,
                types:types
            })
        })
    })

    //发表行为
    app.post('/doPost', checkLogin);
    app.post('/doPost',function(req,res){
        //当前SESSION里面的用户信息
        var currentUser = req.session.user;
        //判断一下内容不能为空
        console.log(req.body.content);
        if(!req.body.content || !req.body.typeid){
            return res.end('内容、类别不能为空');
        }
        var post = new Post(currentUser.name,currentUser.logo,req.body.email,req.body.typeid,req.body.mood,req.body.weather,req.body.location,req.body.content);
        post.save(function(err){
            if(err){
                return res.end(err);
            }
            res.end('success');
        })
    })

    // 用户设置
    app.get('/userCenter', checkLogin);
    app.get('/userCenter',function (req,res) {
        res.render('web/uInfo',{
            title:'用户设置',
            user:req.session.user
        })
    })

    //通过邮箱查找指定的注册用户信息
    app.get('/userInfo', checkLogin);
    app.get('/userInfo',function(req,res,next){
        var params = url.parse(req.url,true);
        var currentEmail = params.query.email;
        if(currentEmail){
            User.getEmail(currentEmail,function(err,result){
                if(err){
                    console.log(err);
                }else{
                    return res.json(result);
                }
            })
        }
    })

    // 更新用户信息
    app.post('/userInfo/modify', checkLogin);
    app.post('/userInfo/modify',function (req,res,next) {
        var logo = req.body.logo;
        var name = req.body.name;
        var email = req.body.email;
        var gender = req.body.gender;
        var city = req.body.city;
        var company = req.body.company;
        var qq = req.body.qq;
        var phoneNum = req.body.phoneNum;
        var comments = req.body.comments;
        if(!name){
            return res.end('昵称不能为空');
        }else {
            User.getName(name,function (err,user) {
                if(err){
                    return res.end(err);
                }
                if(user && name!=req.session.user.name){
                    return res.end('该昵称已被使用');
                }
                req.session.user.name = name;
                req.session.user.logo = logo;
                Post.getUserArchive(email,function (err,posts) {
                    if(err){
                        return res.end(err);
                    }
                    if (posts.length != 0){
                        console.log(posts);
                        Post.updateEmail(email,name,logo,function (err) {
                            if(err){
                                return res.end('err');
                            }
                        })
                        User.update(email,logo,name,gender,city,company,qq,phoneNum,comments,function (err) {
                            // if(err){
                            //     return res.end('修改失败');
                            // }
                            res.end('success');
                        })
                    }
                    User.update(email,logo,name,gender,city,company,qq,phoneNum,comments,function (err) {
                        // if(err){
                        //     return res.end('修改失败');
                        // }
                        res.end('success');
                    })
                })
            })
        }
    })

    // 获取某个用户的所有日记
    app.get('/lists',function (req,res,next) {
        var page = parseInt(req.query.p) || 1;
        Post.getTen(null,page,function(err,posts,total){
            if (err) {
                return res.end(err);
            }
            User.getFifteen(function (err,users) {
                if(err){
                    return res.end(err);
                }
                var data ={
                    posts:posts,
                    users:users
                }
                data=JSON.stringify(data);
                return res.end(data);
            })
        });
    })
    
    // 发现
    app.get('/find',function (req,res,next) {
        var page = parseInt(req.query.p) || 1;
        Post.getTen(null,page,function(err,posts,total){
            if(err){
                posts = [];
            }
            res.render('web/discover',{
                title:'发现',
                page:page,
                total:total,
                isFirstPage:(page-1)==0,
                isLastPage:((page-1)*10+posts.length)==total,
                user:req.session.user,
                posts:posts,
            })
        });
    })
    // 获取所有用户的所有日记
    app.get('/lis',function (req,res,next) {
        var page = parseInt(req.query.p) || 1;
        Post.getTen(null,page,function (err,posts,total) {
            if (err) {
                return res.end(err);
            }
            posts = JSON.stringify(posts);
            return res.end(posts);
        });
    })

    // 文章详情
    app.get('/diary',function (req,res,next) {
        var params = url.parse(req.url,true);
        var currentId = params.query.id;
        Post.getOne(currentId,function(err,post){
            if(err){
                req.flash('error','找不到当前文章');
                return res.redirect('/');
            }
            res.render('web/detail',{
                title:req.params.title,
                user:req.session.user,
                post:post,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        })
    })

    // 编辑日志
    app.get('/edit/:id',function (req,res,next) {
        Post.getOne(req.params.id,function (err,post) {
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            if(post.email==req.session.user.email){
                return res.render('web/edit',{
                    title:'编辑文章',
                    user:req.session.user,
                    post:post,
                    success:req.flash('success').toString(),
                    error:req.flash('error').toString()
                })
            }
            req.flash('error','不是本文作者不能修改');
            return res.redirect('back');
        })

    })
    // 编辑日志的行为
    app.post('/doEdit/:id',function (req,res,next) {
        var typeid = req.body.typeid;
        var content = req.body.content;
        console.log(typeid,content);
        if(!typeid || !content){
            req.flash('error','类别、内容不能为空');
            return res.redirect('back');
        }
        console.log(req.params.id)
        Post.update(req.params.id,typeid,req.body.mood,req.body.weather,req.body.location,content,function (err) {
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            // req.flash('success','修改成功');
            res.redirect('/');
        })
    })

    // 删除日志
    app.get('/remove/:id',function (req,res,next) {
        console.log(req.params.id)
        Post.remove(req.params.id,function (err) {
            if(err){
                // req.flash('error',err);
                return res.redirect('back');
            }
            // req.flash('success','修改成功');
            res.redirect('/');
        })
    })

    //文章的留言发布
    app.post('/comment/:id',function(req,res){
        var date = new Date();
        var time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        if(req.body.content==''){
            req.flash('error','留言内容不能为空');
            return res.redirect('back');
        }
        var comment = {
            name:req.body.name,
            time:time,
            logo:req.session.user.logo,
            email:req.session.user.email,
            content:req.body.content
        }
        var newCommnet = new Comment(req.params.id,comment);
        newCommnet.save(function(err){
            if(err){
                return res.redirect('back');
            }
            req.flash('success','留言成功');
            res.redirect('back');
        })
    })

    // 我的主页
    app.get('/home/:email',function (req,res,next) {
        var page = parseInt(req.query.p) || 1;

        User.getEmail(req.params.email,function (err,user) {
            if (!user) {
                return res.end('用户名不存在');
            }
            Post.getTen(user.email,page,function(err,posts,total){
                if(err){
                    posts = [];
                }
                Type.getAll(req.params.email,function (err,types) {
                    if(err){
                        types = [];
                    }
                    res.render('web/home',{
                        title:'发现',
                        page:page,
                        total:total,
                        isFirstPage:(page-1)==0,
                        isLastPage:((page-1)*10+posts.length)==total,
                        name:user.name,
                        time:user.time,
                        logo:user.logo,
                        action:user.action,
                        user:req.session.user,
                        posts:posts,
                        types:types
                    })
                })
            });
        })

    })

    
    // 管理分类
    app.get('/type',function (req,res,next) {
        Type.getAll(req.session.user.email,function(err,types){
            if(err){
                types = [];
            }
            res.render('web/type',{
                title:'管理分类',
                user:req.session.user,
                types:types,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        });
    })
    // 添加日记本
    app.post('/addType',function (req,res) {
        //当前SESSION里面的用户信息
        var currentUser = req.session.user;
        //判断一下内容不能为空
        if(!req.body.typeid){
            req.flash('error','内容不能为空');
            return res.redirect('back');
        }
        console.log(typeof req.body.typeid);
        var type = new Type(currentUser.email,req.body.typeid);
        type.save(function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','新增日记本成功');
            res.redirect('back');
        })
    })
    // 修改日记本
    app.post('/type/update',function (req,res,next) {
            var oldTypeid = req.body.oldTypeid;
            var newTypeid = req.body.newTypeid;
            if(!newTypeid || newTypeid == '默认笔记'){
                req.flash('error',"日记本名不能为空且不能为'默认笔记'");
                return res.redirect('back');
            }
            Type.getTypeid(newTypeid,function (err,type) {
                if(err){
                    return res.redirect('back');
                }
                if(type){
                    req.flash('error','日记本名已存在');
                    return res.redirect('back');
                }
                Post.updateTypeid(oldTypeid,newTypeid,function (err) {
                    if(err){
                        // req.flash('error',err);
                        return res.redirect('back');
                    }
                })
                Type.update(oldTypeid,newTypeid,function (err) {
                    if(err){
                        // req.flash('error',err);
                        return res.redirect('back');
                    }
                    req.flash('success','笔记本修改成功')
                    res.redirect('back');
                })
            })
        })

    // 删除日记本
    app.post('/type/remove',function (req,res,next) {
        var typeid = req.body.bookid;
        Post.getType(typeid,function (err,posts) {
            if(err){
                // req.flash('error',err);
                return res.redirect('back');
            }
            if(posts.length != 0){
                req.flash('error','笔记本中有文章，不可以删除');
                return res.redirect('back');
            }
            Type.remove(typeid,function (err) {
                if(err){
                    // req.flash('error',err);
                    return res.redirect('back');
                }
                req.flash('success','删除笔记本成功');
                return res.redirect('back');
            })
        })
    })

    // 点击日记本获取文章
    app.get('/typeid/:typeid/:name',function (req,res,next) {
        var page = parseInt(req.query.p) || 1;
            Post.getTypeid(req.params.typeid,req.params.name,page,function (err,posts,total) {
                console.log(posts);
                if(err){
                    posts = [];
                }
                User.getName(req.params.name,function (err,user) {
                    if(err){
                        user = [];
                    }
                    res.render('web/typeArticle',{
                        title:'管理分类',
                        typeid:req.params.typeid,
                        name:req.params.name,
                        email:user.email,
                        posts:posts,
                        user:req.session.user,
                        page:page,
                        total:total,
                        isFirstPage:(page-1)==0,
                        isLastPage:((page-1)*10+posts.length)==total
                    })
                })

            })
    })




}