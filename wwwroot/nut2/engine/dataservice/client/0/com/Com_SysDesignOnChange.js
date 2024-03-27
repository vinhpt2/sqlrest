var Com_SysDesignOnChange={
	run: function(p){
		switch(p.action){
			case "SAVE":
			p.data.id=p.recid;
			NUT_DS.call({method:"PATCH",url:p.config.urledit,data:[p.data]},function(){
				NUT.tagMsg("Data updated!","green");
			});
			break;
			case "NEW":
				NUT_DS.call({method:"POST",url:p.config.urledit,data:[p.data]},function(){
					NUT.tagMsg("Data inserted!","green");
				});
			break;
			case "DEL":
				NUT_DS.call({method:"DELETE",url:p.config.urledit,data:[p.recid]},function(){
					NUT.tagMsg("Data delete!","green");
				});
			break;
		}
	}
}