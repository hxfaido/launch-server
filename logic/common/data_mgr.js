
function data_mgr() {
}

data_mgr.prototype.prepare = function (cb) {
	server.log("data_mgr prepare.");
	
	this.channel_conf = {};
	//watch all channel data
    var fs = require("fs");
    var path = require("path");
	
	var files = fs.readdirSync("./data");
	var self = this;
	for(var i = 0; i < files.length; i++)
	{
		var name = files[i];
        var ext = path.extname(name);
		if(ext === ".ejson"){
			var filename = path.basename(name, ".ejson");
			this.channel_conf[filename] = {};
			watch_channel(filename);
        }		
	}
	
	function watch_channel(channel)
	{
		server.fn.watchedata(channel,function(){
			self.reload_channel(channel);
		});		
	}

	this.reload_dynamic();
	server.log("channel_arr : %j",this.channel_conf);
	cb();
}

data_mgr.prototype.channeldata = function(name){
	return this.channel_conf[name];
}

data_mgr.prototype.reload_dynamic = function() {
	for(var key in this.channel_conf)
	{
		this.reload_channel(key);
	}
}

data_mgr.prototype.reload_channel = function(name){
	server.log("reload_channel : " + name);
	
	var channel = server.data[name];
	var channel_conf = channel.conf || {};
	var channel_client = channel.client || {};
	var dynamic_conf = server.dynamic.conf || {};
	var dynamic_client = server.dynamic.client || {};
	
	channel_conf.__proto__ = dynamic_conf;
	merge_conf(channel_client,dynamic_client);
	
	var obj = {};
	for(var key in channel)
	{
		//skip the config key
		if(key == "conf" || key == "client")
		{
			continue;
		}
		var value = server.data[name][key];
		var ver_obj = {};
		
		ver_obj.conf = value.conf || {};
		ver_obj.conf.__proto__ = channel_conf;
		ver_obj.client = value.client || {};
		merge_conf(ver_obj.client,channel_client);		
		
		obj[key] = ver_obj;
	}
	
	//store root conf
	obj._conf = channel_conf;
	
	this.channel_conf[name] = obj;
}

function merge_conf(child,parent){
	if(parent)
	{
		if(typeof parent == "object" && !(parent instanceof Array))
		{
			for(var key in parent)
			{
				var child_value = child[key]; 
				if(child_value === undefined)
				{
					child[key] = parent[key];
				}
				else
				{
					if(typeof child_value == "object")
					{
						if(child_value instanceof Array)
						{
							//ignore
						}
						else
						{
							merge_conf(child_value, parent[key]);
						}
					}
					else
					{
						//ignore
					}
				}
			}			
		}
	}
}

module.exports = new data_mgr();
