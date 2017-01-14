/**
 * Created by hama on 2016/11/18.
 */
var mongo = require('./db');
var shortid = require('shortid');
//引入markdown插件
var markdown = require('markdown').markdown;
function Post(name,logo,email,typeid,mood,weather,location,content){
    //发布人
    this.name = name;
    this.logo = logo;
    this.email = email;
    this.typeid = typeid;
    this.mood = mood;
    this.weather = weather;
    this.location = location;
    //内容
    // XSS跨站脚本攻击的预防.
    // this.content = content.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    this.content = content;
}
module.exports = Post;
//保存文章
Post.prototype.save  = function(callback){
    var date = new Date();
    //保存当前时间的各种格式
    var time = {
        date:date,
        year:date.getFullYear(),
        month:date.getFullYear() + '-' + (date.getMonth() + 1),
        day:date.getFullYear() + '-' +
        (date.getMonth() + 1) + '-' + date.getDate(),
        minute:date.getFullYear() + '-' +
        (date.getMonth() + 1) + '-' + date.getDate() + ' ' +
            date.getHours() + ':' +
        (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes() + ':' + date.getSeconds())
    };
    //我们要保存的数据
    var post = {
        _id:shortid.generate(),
        name:this.name,
        logo:this.logo,
        time:time,
        email:this.email,
        typeid:this.typeid,
        mood:this.mood,
        weather:this.weather,
        location:this.location,
        content:this.content,
        //新增的留言字段
        comments:[],
        // 新增访问量
        pv:0
    }
    //接下来就是常规的打开数据库->读取posts集合->内容插入->关闭数据库
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.insert(post,{safe:true},function(err){
                mongo.close();
                if(err){
                    return callback(err);
                }
                //如果没有错的情况下,保存文章，不需要返回数据.
                callback(null);
            })
        })
    })
}
//获取所有的文章
Post.getTen = function(email,page,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            var query = {};
            if(email){
                query.email = email;
            }
            //查询
            collection.count(query,function (err,total) {
                // total是查询的文章总数量
                collection.find(query,{
                    // 根据当前的页数
                    skip:(page-1)*10,
                    // pageSize 理解为步长
                    limit:10
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
                    callback(null,docs,total);//返回查询的文档数据.(数组形式)
                })
            })
        })
    })
}
//可以根据用户名、发布时间、文章标题来查询某一篇具体的文章
Post.getOne = function(id,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.findOne({
                "_id":id
            },function(err,doc){
                if(err){
                    mongo.close();
                    callback(err);
                }
                // 增加访问量的代码
                if(doc) {
                    collection.update({
                        "_id": id
                    }, {
                        $inc: {"pv": 1}
                    }, function (err) {
                        mongo.close();
                        if (err) {
                            return callback(err);
                        }
                    });
                    //markdown解析一下
                    // doc.post = markdown.toHTML(doc.post);
                    //把留言的内容用markdown解析一下
                    // doc.comments.forEach(function (comment) {
                    //     comment.content = markdown.toHTML(comment.content);
                    // })
                    callback(null, doc);
                }
            })
        })
    })
}
//为文章添加编辑功能，返回markdown格式的原始内容
Post.edit = function(id,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.findOne({
                "_id":id
            },function(err,doc){
                mongo.close();
                if(err){
                    return callback(err);
                }
                return callback(null,doc);//返回查询文章的原始格式.
            })
        })
    })
}
//修改操作
Post.update = function(id,typeid,mood,weather,location,content,callback){
    var post = {
        typeid:typeid,
        mood:mood,
        weather:weather,
        location:location,
        content:content
    }
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.update({
                "_id":id
            },{$set:post},function(err){
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}
// 根据类别
Post.updateTypeid = function(oldTypeid,newTypeid,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.update({
                "typeid":oldTypeid
            },{$set:{typeid:newTypeid}},{multi:true},function(err){
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}
// 根据邮箱
Post.updateEmail = function(email,name,logo,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.update({
                "email":email
            },{
                $set:{
                    name:name,
                    logo:logo
                }
            },{
                multi:true
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
//删除操作
Post.remove = function(id,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.remove({
                "_id":id
            },{
                w:1
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
// 返回包含用户名，发布时间，标题的文章
Post.getArchive = function (callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            // 只获取到发布人，发布时间，发布的标题
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
// 获取某个用户的所有日记
Post.getUserArchive = function (email,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            // 只获取到发布人，发布时间，发布的标题
            collection.find({
                "email":email
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


Post.search = function (keyword,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            var pattern = new RegExp(keyword,'i');
            collection.find({
                "title":pattern
            },{
                "name":1,
                "time":1,
                "title":1
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

Post.getType = function (typeid,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            // 只获取到发布人，发布时间，发布的标题
            collection.find({
                "typeid":typeid
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

//获取所有的文章
Post.getTypeid = function(typeid,name,page,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            var query = {};
            if(typeid && name){
                query.typeid = typeid;
                query.name = name;
            }
            //查询
            collection.count(query,function (err,total) {
                // total是查询的文章总数量
                collection.find(query,{
                    // 根据当前的页数
                    skip:(page-1)*10,
                    // pageSize 理解为步长
                    limit:10
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
                    callback(null,docs,total);//返回查询的文档数据.(数组形式)
                })
            })
        })
    })
}