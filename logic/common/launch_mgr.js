

function launch_mgr() {
}

launch_mgr.prototype.prepare = function (cb) {
	server.log("launch_mgr prepare.");
	
	server.http.launch.get("/version", this.handle_version.bind(this));
	
	cb();
}

launch_mgr.prototype.stop = function (cb) {
    server.log("launch_mgr stop.");
    cb();
}

//format : {ver : str, cid : channel, os, sig}
launch_mgr.prototype.handle_version = function(req,res){
	
	var data = req.query;
	
    server.log(req.ip + " recv  %j", data);
   
	var ret = {code : 1 , appurl : "" , time : 0};
	
	var cinfo = server.data_mgr.channeldata(data.cid);

	if(cinfo)
	{
		var value = cinfo[data.ver];
		
		if(value)
		{
			var sig = value.conf.sig;
			var check_flag;
			if(sig)
			{
				if(sig == data.sig)
				{
					check_flag = true;
				}
				else
				{
					check_flag = false;
					server.log("sig_err","sig need : %j, send : %j",sig,data.sig);
				}
			}
			else
			{
				check_flag = true;
			}
			
			if(!check_flag)
			{
				ret.appurl = server.launch_mgr.get_appurl(data.ver, cinfo._conf);
			}
			else
			{
				var now = new Date().getTime();
				ret.code = 0;
				ret.time = Math.ceil(now/1000);
				//ret.url = value.conf.url;
				//ret.ver = value.conf.version;
				
				//ret.conf = value.client;	
			}
		}
		else
		{
			ret.appurl = server.launch_mgr.get_appurl(data.ver, cinfo._conf);
		}
	}
	
	res.send(ret);
}

//get app download url , by current version
launch_mgr.prototype.get_appurl = function (ver, conf) {
	var appurl = ""
	
	if(conf)
	{
		var arr = ver.split(".");
		
		for(var i = arr.length; i >= 1; i--)
		{
			if(conf["appurl" + i] != undefined)
			{
				appurl = conf["appurl" + i];
				break;
			}
		}
	}
	
	return appurl;
}

module.exports = new launch_mgr();