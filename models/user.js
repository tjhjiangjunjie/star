/**
 * Created by hama on 2016/11/17.
 */

//对用户登录和注册的逻辑进行设计

//1.首先引用数据库连接文件
var mongo = require('./db');
var shortid = require('shortid');
//2.创建一个User类，在这里面对登录和注册进行设计
//User类的主要功能就是为了完成新增和查询操作，那么它应该是针对
//用户信息(users集合)进行的.
function User(user){
    this.logo = user.logo;
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
    this.time = user.time;
}
module.exports = User;

//保存用户信息的save方法,注册
//1.打开数据库
//2.用户信息放到数据库里面，存放起来.
//3.关闭数据库
User.prototype.save = function(callback){
    //接收一下表单的数据，要保存的user对象
    var user = {
        _id:shortid.generate(),
        logo:this.logo,
        name:this.name,
        time:this.time,
        password:this.password,
        email:this.email,
        gender:this.gender,
        city:this.city,
        company:this.company,
        qq:this.qq,
        phoneNum:this.phoneNum,
        comments:this.comments
    }
    //使用open方法打开数据库
    mongo.open(function(err,db){
        if(err){
            //如果发生了错误
            return callback(err);
        }
        //读取users集合
        db.collection('users',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            //将用户的信息存放到users集合当中去
            collection.insert(user,{safe:true},function(err,user){
                mongo.close();
                if(err){
                    return callback(err);
                }
                return callback(user[0]);//返回注册成功的用户名.
            })
        })
    })
}
User.getId = function(id,callback){
    //1.打开数据库
    mongo.open(function(err,db){
        //发生错误的时候
        if(err){
            return callback(err);
        }
        //2.还是读取users集合
        db.collection('users',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            //查询用户名
            collection.findOne({_id:id},function(err,user){
                if(err){
                    return callback(err);
                }
                callback(null,user);//成功返回查询的用户信息.
            })
        })
    })
}
//根据邮箱获取用户信息
User.getEmail = function(email,callback){
    //1.打开数据库
    mongo.open(function(err,db){
        //发生错误的时候
        if(err){
            return callback(err);
        }
        //2.还是读取users集合
        db.collection('users',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            //查询用户名
            collection.findOne({email:email},function(err,user){
                if(err){
                    return callback(err);
                }
                callback(null,user);//成功返回查询的用户信息.
            })
        })
    })
}
User.getFifteen = function(callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('users',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
                // total是查询的文章总数量
                collection.find({},{
                    limit:15
                }).sort({
                    time:-1
                }).toArray(function(err,docs){
                    mongo.close();
                    if(err){
                        return callback(err);
                    }
                    //在返回结果的时候，让markdown格式化一下
                    //就可以直接使用markdown的语法规则来解析HTML标签了。
                    // docs.forEach(function(doc){
                    //     doc.post = markdown.toHTML(doc.post);
                    // })
                    // 得到的是十篇文章
                    callback(null,docs);//返回查询的文档数据.(数组形式)
                })
            })
        })
}
// 获取所有的用户
User.getAll = function (callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('users',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.find({
            }).sort({
                time:-1
            }).toArray(function (err,docs) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
}

// 根据名称获取用户信息
User.getName = function(name,callback){
    //1.打开数据库
    mongo.open(function(err,db){
        //发生错误的时候
        if(err){
            return callback(err);
        }
        //2.还是读取users集合
        db.collection('users',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            //查询用户名
            collection.findOne({name:name},function(err,user){
                if(err){
                    return callback(err);
                }
                callback(null,user);//成功返回查询的用户信息.
            })
        })
    })
}

User.update = function(email,logo,name,gender,city,company,qq,phoneNum,comments,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('users',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.update({
                email:email
            },{
                $set:{
                    logo:logo,
                    name:name,
                    gender:gender,
                    city:city,
                    company:company,
                    qq:qq,
                    phoneNum:phoneNum,
                    comments:comments
                }
            },function(err){
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}