//crypto msg

xor.keylen = 16;
//just a random arr
xor.default_ekey = [ 211, 236, 11, 232, 213, 104, 200, 234, 56, 117, 9, 206, 14, 40, 133, 51 ];
xor.default_dkey = [ 251, 84, 205, 242, 159, 135, 187, 73, 166, 202, 186, 86, 11, 26, 113, 140 ];

//notice client xor need opposite to server xor
function xor(ekey,dkey)
{
	if(arguments.length == 0)
	{
		server.log("xor ekey dkey use the default one.");
		this.set_ekey(new Buffer(xor.default_ekey));
		this.set_dkey(new Buffer(xor.default_dkey));		
	}
	else if(arguments.length == 1)
	{
		server.log("xor ekey dkey use the same one.");
		this.set_ekey(new Buffer(ekey));
		this.set_dkey(new Buffer(ekey));		
	}
	else
	{
		this.set_ekey(new Buffer(ekey));
		this.set_dkey(new Buffer(dkey));
	}
}

xor.prototype.set_ekey = function(key){
	if(key instanceof Array || key instanceof Buffer)
	{
		if(key.length != xor.keylen)
		{
			throw new Error("xor ekey length must be : " + xor.keylen);
		}
		
		this.ekey = key;
	}
	else
	{
		throw new Error("xor ekey must be array or buffer");	
	}	
}

xor.prototype.set_dkey = function(key){
	if(key instanceof Array || key instanceof Buffer)
	{
		if(key.length != xor.keylen)
		{
			throw new Error("xor dkey length must be : " + xor.keylen);
		}
		
		this.dkey = key;
	}
	else
	{
		throw new Error("xor dkey must be array or buffer");	
	}		
}

//change it every time
xor.prototype._change_ekey = function(){
	for (var i = 0; i < xor.keylen; i++)
	{
		if (this.ekey[i] <= 1)
			this.ekey[i] = 255;
		else
			this.ekey[i] -= 1;
	}
}
xor.prototype._change_dkey = function(){
	for(var i = 0; i < xor.keylen; i++)
	{
		if (this.dkey[i] == 255)
			this.dkey[i] = 1;
		else
			this.dkey[i] += 1;
	}	
}

xor.prototype.encode = function(buf){
	var magic = this.ekey[0];
	var len = buf.length;
	for (var i = 0; i < len; i++)
	{
		var _old = buf[i];
		buf[i] ^= magic;
		magic = this.ekey[_old & 0x0F];
	}

	this._change_ekey();
	
	return buf;
}

xor.prototype.decode = function(buf){
	var magic = this.dkey[0];
	var len = buf.length;
	for(var i = 0; i < len; i++)
	{
		var _old = buf[i];
		buf[i] ^= magic;
		magic = this.dkey[_old & 0x0F];
	}

	this._change_dkey();
	
	return buf;
}


exports.xor = xor;
