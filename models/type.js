/**
 * Created by Administrator on 2017/1/6.
 */
var mongo = require('./db');
var shortid = require('shortid');
//引入markdown插件
var markdown = require('markdown').markdown;
function Type(email,typeid){
    //发布人
    this.email = email;
    this.typeid = typeid;
    //内容
    //XSS跨站脚本攻击的预防.
    // this.post = post.replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
module.exports = Type;
//保存条目
Type.prototype.save  = function(callback){
    //我们要保存的数据
    var type = {
        _id:shortid.generate(),
        email:this.email,
        typeid:this.typeid
    }
    //接下来就是常规的打开数据库->读取posts集合->内容插入->关闭数据库
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('types',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.insert(type,{safe:true},function(err){
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
// 获取某个用户的所有分类
Type.getAll = function (email,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('types',function (err,collection) {
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
Type.update = function(oldTypeid,newTypeid,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('types',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.update({
                "typeid":oldTypeid
            },{$set:{typeid:newTypeid}},function(err){
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}
Type.getId = function(id,callback){
    //1.打开数据库
    mongo.open(function(err,db){
        //发生错误的时候
        if(err){
            return callback(err);
        }
        //2.还是读取types集合
        db.collection('types',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            //查询日记本
            collection.findOne({_id:id},function(err,type){
                if(err){
                    return callback(err);
                }
                callback(null,type);
            })
        })
    })
}
Type.getTypeid = function(typeid,callback){
    //1.打开数据库
    mongo.open(function(err,db){
        //发生错误的时候
        if(err){
            return callback(err);
        }
        //2.还是读取types集合
        db.collection('types',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            //查询日记本
            collection.findOne({typeid:typeid},function(err,type){
                if(err){
                    return callback(err);
                }
                callback(null,type);
            })
        })
    })
}
//删除操作
Type.remove = function(typeid,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('types',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.remove({
                "typeid":typeid
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