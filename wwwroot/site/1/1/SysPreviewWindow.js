var SysPreviewWindow={
	run:function(p){
		if(p.records.length){
			var windowid=p.records[0].windowid;
			var self=this;
			var conf=_context.winconfig[windowid];
			if(conf){
				self.showDlgWorkflow(conf);
			}else{
				NUT.ds.select({url:NUT.URL+"syscache",where:["windowid","=",windowid]},function(res){
					if(res.length){
						conf=NUT.configWindow(zipson.parse(res[0].config));
						conf.tabid=conf.windowid;
						
						var needCaches=[];
						for(key in conf.needCache)if(conf.needCache.hasOwnProperty(key)&&!_context.domain[key])
							needCaches.push(conf.needCache[key]);
						self.showDlgPreview(conf,needCaches);
					}
				});
			}
		}else NUT.tagMsg("No Window selected!","yellow");
	},
	showDlgPreview:function(conf,needCaches){
		var id="divCom_SysPreviewWindow";
		w2popup.open({
			title: '👁️ <i>Preview</i> - '+ conf.windowname,
			width: 900,
			height: 800,
			body: '<div id="'+id+'" class="nut-full"></div>',
			onOpen:function(evt){
				evt.onComplete=function(){
					var div=document.getElementById(id);
					needCaches?cacheDomainAndOpenWindow(div,conf,needCaches,0):buildWindow(div,conf,0);
				}
			}
		});
	}
}