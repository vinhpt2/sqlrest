var SysPreviewWindow={
	run:function(p){
		if(p.records.length){
			var windowid=p.records[0].windowid;
			NUT.ds.select({url:NUT.URL+"n_cache",where:["windowid","=",windowid]},function(res){
				if(res.success&&res.result.length){
					var conf=NUT.configWindow(zipson.parse(res.result[0].configjson));
					conf.tabid=conf.windowid;

					var needCaches = [];
					for (var key in conf.needCache) {
						if (conf.needCache.hasOwnProperty(key) && !NUT.dmlinks[key]) needCaches.push(conf.needCache[key]);
					}
					SysPreviewWindow.showDlgPreview(conf, needCaches);
				} else NUT.notify("⚠️ Selected window has no cache!", "yellow");
			});
		} else NUT.notify("⚠️ No Window selected!","yellow");
	},
	showDlgPreview:function(conf,needCaches){
		var id="div_SysPreviewWindow";
		NUT.w2popup.open({
			title: "_Preview",
			width: 1000,
			height: 700,
			body: '<div id="'+id+'" class="nut-full"></div>',
			onOpen:function(evt){
				evt.onComplete = function () {
					var win = new NUT.NWin(id);
					var div=document.getElementById(id);
					needCaches ? win.cacheDomainAndOpenWindow(div, conf, needCaches, 0) :win.buildWindow(div,conf,0);
				}
			}
		});
	}
}