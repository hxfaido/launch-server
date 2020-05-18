
require("main");

//set some global thing at here
server.CONST_SERVER = require("./logic/common/const");

server.on("init", function(){
    var fs = require("fs");
    var path = require("path");
    
    //load all utils module
    var modules = fs.readdirSync("./logic/utils");
    for(var j = 0; j < modules.length; j++){
        var module_name = modules[j];
        if (path.extname(module_name) === ".js") {
            try {
                var fname = path.basename(module_name);
                fname = fname.slice(0, fname.lastIndexOf("."));
                server[fname] = require("./logic/utils/" + module_name);
            }
            catch (e) {
                server.log_err("require module : %j failed , %j", module_name, e);
            }
        }
    }
      
    //read all data first
    server.data = {};
    var files = fs.readdirSync("./data");
    server.fn.async(files,function(name,cb){

        var ext = path.extname(name);
        if (ext === ".json") {
            server.fn.readjson("./data/" + name,function(data){
                server.data[path.basename(name, ".json")] = data;
                cb();
            });
        }
        else if(ext === ".ejson"){
            server.fn.readextjson("./data/" + name,function(data){
                server.data[path.basename(name, ".ejson")] = data;
                cb();
            });
        }
		else
		{
			cb();
		}
		
    },function(){
        require("./logic/common/init");
    });

});

server.start({
});
