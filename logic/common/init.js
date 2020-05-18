//--- init server ---//

//for prepare
server.prepare = false;


//prepare
server.data_mgr = require("./data_mgr");
server.launch_mgr = require("./launch_mgr");
var mgr_arr = [server.data_mgr,server.launch_mgr];


server.fn.async(mgr_arr, "prepare", function() {
	
	server.log("->->->->->launch server prepare ok.->->->->->");
	server.prepare = true;
});

server.on("dynamic", function (dynamic) {
    server.log("dynamic.ini has change!!");
	
	server.data_mgr.reload_dynamic();
});

server.on("stop", function() {
	server.prepare = false;
    server.fn.async(mgr_arr, "stop", function(){
	    server.stop();
    });
});
