
//do rpc between servers

var SYS_MSG = server.CONST.SYS_MSG;

//-------------- server --------------//
function rpc_server(port){

	this.port = port;
	this.handler = {};
	this.handler[SYS_MSG.CONNECT] = function (msg, s) {
		//one day timeout
		s.settimeout(86400000);
	};
	
	server.start_netserver(port,this.handler);
}

rpc_server.prototype.add = function(fun){
	
	var name = fun.name;
	if(name.length == 0)
	{
		server.log_err("rpc function should have a name !!!");
		return;
	}	
	
	if(this.handler[name])
	{
		server.log_err("rpc function %j is in port %j yet !",name, this.port);
		return;
	}
	
	this.handler[name] = function(msg,s){
		var args = msg.args;
		var id = msg.id;
		
		fun.apply(null,	args.concat(function(ret){
			s.send(name,{"ret" : ret, "id" : id});
		}));
	}
}


//-------------- client --------------//
function rpc_client(ip,port){
	
	this.ip = ip;
	this.port = port;
	this.id = 0;
	this.fn_obj = {};
	
	this.client = null;
	this.waitmsg = [];

	var self = this;	
	this.handler = {};
	this.handler[SYS_MSG.CONNECT] = function (dummy, s) {
		//flush all waiting msgs
		for(var i = 0; i < self.waitmsg.length; i++)
		{
			var msg = self.waitmsg[i];
			//store callback
			self.fn_obj[msg.id] = msg.fn;		
			delete msg.fn;
			s.send(msg);			
		}
		self.waitmsg = [];
		//no need reconnect after flush all msgs. 
		s.setretry(false);
		s.settimeout(0);
	};	
	
	this.handler[SYS_MSG.CLOSE] = function (dummy, s) {
		self.client = null;
		
		var keys = Object.keys(self.fn_obj);
		if(keys.length > 0)
		{
			server.log_err("rpc client %j : %j close , callback length %j", self.ip, self.port, keys.length);
		}
		
		self.fn_obj = {};
		
		//should not have waitmsg
	};	
}

rpc_client.prototype.fn = function(name){
	return this.call.bind(this,name);
}

rpc_client.prototype.call = function(name){

	var fn = arguments[arguments.length - 1];
	if(typeof fn != "function")
	{
		server.log_err("call rpc function %j should have callback !",name);
		return;
	}

	var msg = {};
	msg[server.CONST.NET.DEFAULT_MSGID] = name;
	msg.id = ++this.id;
	msg.args = Array.prototype.slice.call(arguments, 1, arguments.length - 1);
	msg.fn = fn;
	
	if(!this.handler[name])
	{
		var self = this;
		this.handler[name] = function(data,s){
			var _fn = self.fn_obj[data.id];
			if(_fn)
			{
				delete self.fn_obj[data.id];
				_fn(data.ret);
			}
		}
	}
	
	if(this.client == null)
	{
		this.waitmsg.push(msg);
		this.client = server.start_netclient(this.ip, this.port, this.handler);
	}
	else
	{
		if(this.waitmsg.length == 0)
		{
			//store callback
			this.fn_obj[msg.id] = msg.fn;
			delete msg.fn;
			this.client.send(msg);
		}
		else
		{
			this.waitmsg.push(msg);
		}
	}
}


//create
var _server_obj = {};
var _client_obj = {};

exports.create = function(ip,port){
	
	if(arguments.length == 1)
	{
		//for server
		port = ip;
		
		if(!_server_obj[port])
			_server_obj[port] = new rpc_server(port);
		
		return _server_obj[port];
	}
	else
	{
		//for client
		var key = ip + ":" + port;
		
		if(!_client_obj[key])
			_client_obj[key] = new rpc_client(ip,port);
		
		return _client_obj[key];		
	}
}

