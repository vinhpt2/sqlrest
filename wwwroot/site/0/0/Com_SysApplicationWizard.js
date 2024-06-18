var Com_SysApplicationWizard={
	step:1,
	a:null,
	run:function(p){
		this.step=1;
		if(p.records.length){
			this.app=p.records[0];
			this.showDlgWizard();
		}else NUT.tagMsg("No Application selected!","yellow");
	},
	showDlgWizard:function(conf){
		var self=this;
		var id="divCom_SysApplicationWizard";
		this.a=createWindowTitle(id);
		this.a.innerHTML='Wizard.'+ self.app.applicationname;
		this.a.div.innerHTML='<iframe id="'+id+'" style="width:850px;height:550px;borderby:none;background:white" src="client/0/html/step1.html"></iframe></br><button id="butBack" class="w2ui-btn" onclick="Com_SysApplicationWizard.go(-1)">Close</button> <button id="butNext" class="w2ui-btn" onclick="Com_SysApplicationWizard.go(1)">Next</button>';
	},
	go:function(index){
		var id="divCom_SysApplicationWizard";
		if((index<0&&this.step>1)||(index>0&&this.step<3)){//next-back
			this.step+=index;
			document.getElementById(id).src="client/0/html/step"+this.step+".html";
			butBack.innerHTML=(this.step==1?"Close":"Back");
			butNext.innerHTML=(this.step==3?"Finish":"Next");
		}else if(this.step==3&&index>0){//finish
			this.a.div.innerHTML="<div id='"+id+"' class='nut-full'></div>";
			var div=this.a.div.firstChild;
			w2ui[id]?w2ui[id].render(div):
			$(div).w2layout({
				name: id,
				panels: [
					{ type: 'top', size: '28px', content: '<div id="divTopWz"></div>' },
					{ type: 'left', size: (this.app.applicationtype=="gis"?"910px":'410px'), resizable: true, content: '<div id="divLeftWz" class="nut-full"></div>' },
					{ type: 'main', content: '<div id="divMainWz" class="nut-full"><button>MAP</button></div>' }
				]
			});

			this.designApp(this.app.appid);
		}else if(this.step==1&&index<0){//close
			this.a.div.remove();
			this.a.nextElementSibling.remove();
			this.a.remove();
			_context.curWinid=null;
		}
	},
	runCom:function(){
		var records=[this.tag];
		var id=this.com;
		if(window[id]){
			window[id].run({
				records:records
			});
		} else {
			var script=document.createElement("script");
			script.src="client/0/com/"+id+".js";
			document.head.appendChild(script);
			script.onload=function(){
				window[id].run({
					records:records
				});
			}
		}
	},
	designApp:function(){
		var self=this;
		var isGis=(this.app.applicationtype=="gis");
		(isGis?divLeftWz:divMainWz).innerHTML="<div id='divTitleWz'><button onclick='menu_onClick({item:{tag:3}})'>NEW WINDOW</button></div>";
		//load menu
		NUT.ds.select({url:NUT.URL+"nv_rolemenu_menuitem",where:[["menuitemtype","=","menu"],["appid","=",this.app.appid]]},function(res){
			var ids={},pids={};
			for(var i=0;i<res.length;i++){
				if(res[i].menuitemid)ids[res[i].menuitemid]=true;
				if(res[i].parentid)pids[res[i].parentid]=true;
			}
			NUT.ds.select({url:NUT.URL+"sysmenuitem",orderby:"seqno",where:["or",["menuitemid","in",Object.keys(ids)],["menuitemid","in",Object.keys(pids)]]},function(menuitems){
				var nodes=[{type:'button', id:"EDIT_MENU", text: "EDIT MENU"}], lookup={};
				for(var i=0;i<menuitems.length;i++){
					var menuitem=menuitems[i];
					var isSummary=(menuitem.issummary);
					var node={type:(isSummary?'menu':'button'), id:menuitem.menuitemid, text: menuitem.menuitemname, group:isSummary, expanded:isSummary, tag:menuitem.linkwindowid};
					if(menuitem.parentid){
						isGis?lookup[menuitem.parentid].items.push(node):lookup[menuitem.parentid].nodes.push(node);
					}else{
						isGis?node.items=[]:node.nodes=[];
						nodes.push(node);
					}
					lookup[node.id]=node;
				};

				var id='w2menuWz';
				if(w2ui[id])
					w2ui[id].render(isGis?divTopWz:divLeftWz);
				else
					isGis?$(divTopWz).w2toolbar({name:id,items: nodes,onClick:self.menu_onClick}):$(divLeftWz).w2sidebar({name:id,flatButton:true,nodes: nodes,onClick:self.menu_onClick});
				
				w2ui[id].config=nodes;
			});
		});
		//load window
		NUT.ds.select({url:NUT.URL+"syswindow",orderby:"windowname",where:[["windowtype","=","window"],["appid","=",this.app.appid]]},function(res){
			for(var i=0;i<res.length;i++)self.createWindowTitle(res[i]);
		})
	},
	menu_onClick:function(evt){
		var id=evt.item?((evt.item.group)?(evt.subItem&&!evt.subItem.group?evt.subItem.id:null):evt.item.id):evt.node.id;
		if(id=="EDIT_MENU"){
			w2prompt({
				label: 'Menu JSON',
				value: JSON.stringify(this.config),
				title: 'EDIT MENU',
				width: 400,
				height: 200
			});
		}
	},
	createWindowTitle:function(win){
		var divWindow=divTitleWz.parentNode;
		for(var i=1;i<divWindow.childNodes.length;i++)
			divWindow.childNodes[i].style.display="none";
		
		var div=document.createElement("div");
		div.className="nut-full";
		div.style.backgroundColor="white";
		
		divWindow.appendChild(div);
		
		var a=document.createElement("i");
		a.innerHTML=win.windowname;
		a.className="nut-link";
		a.style.color="gray";
		a.div=div;
		a.tag=win;
		var self=this;
		a.onclick=function(){
			for(var i=1;i<this.div.parentNode.childNodes.length;i++)
				this.div.parentNode.childNodes[i].style.display="none";
			this.div.style.display="";
			
			for(var i=0;i<divTitleWz.childNodes.length;i++)
				divTitleWz.childNodes[i].style.color="gray";
			this.style.color="";
			this.nextElementSibling.style.color="";
			if(!this.loaded){
				self.loadTabs(this.div,this.tag);
				this.loaded=true;
			}
		};
		divTitleWz.appendChild(a);
		
		var close=document.createElement("span");
		close.className="nut-close";
		close.innerHTML="⛌  ";
		close.title="Delete";
		close.onclick=function(){
			this.previousElementSibling.div.remove();
			this.previousElementSibling.remove();
			this.remove();
		}
		divTitleWz.appendChild(close);
		return a;
	},
	loadTabs:function(div,win){
		var butTab=document.createElement("input");
		butTab.type="button";
		butTab.value="Build tab";
		butTab.style.float="right";
		butTab.tag=win;
		butTab.com="Com_SysBuildTab";
		butTab.onclick=this.runCom;
		
		var butLayout=document.createElement("input");
		butLayout.type="button";
		butLayout.value="Design layout";
		butLayout.style.float="right";
		butLayout.tag=win;
		butLayout.com="Com_SysLayoutWindow";
		butLayout.onclick=this.runCom;
		
		div.appendChild(butTab);
		div.appendChild(butLayout);
		var self=this;
		NUT.ds.select({url:NUT.URL+"systab",orderby:["tablevel","seqno"],where:["windowid","=",win.windowid]},function(tabs){
			if(tabs.length){
				var lookupTab={},winconf={tabs:[],tabid:win.windowid};
				for(var i=0;i<tabs.length;i++){
					var tab=tabs[i];

					tab.tabs=[];
					tab.maxLevel=0;
					
					if(tab.tablevel==0)winconf.tabs.push(tab);
					lookupTab[tab.tabid]=tab;

					if(tab.parenttabid){
						var parentTab=lookupTab[tab.parenttabid];
						if(tab.tablevel>0){
							if(tab.tablevel>parentTab.tablevel){
								parentTab.tabs.push(tab);
								if(tab.tablevel>parentTab.maxLevel)parentTab.maxLevel=tab.tablevel;
							}else{
								lookupTab[parentTab.parenttabid].tabs.push(tab);
							}
						}
					}
				}
				self.buildWindow(div,winconf,0);
			}
		});
	},
	buildWindow:function(div,conf,tabLevel,callback){
		var divTabs=document.createElement("div");
		divTabs.id="divtabsWz_"+conf.tabid+"_"+tabLevel;
		div.appendChild(divTabs);
		var tabs=[],windowsearch=(conf.windowtype=="search"||conf.windowtype=="filter"?conf.windowtype:false);
		var nodes=[];
		for(var i=0;i<conf.tabs.length;i++){
			var tabconf=conf.tabs[i];
			if(tabconf.tablevel==tabLevel){
				var divTab=document.createElement("div");
				divTab.id="divtabWz_"+tabconf.tabid;
				div.appendChild(divTab);
				var tab={id:tabconf.tabid,text:tabconf.tabname,tag:tabconf,windowsearch:windowsearch,callback:callback};
				
				var divContent=document.createElement("div");
				divContent.id="divcontWz_"+conf.tabid;
				divContent.style.height="320px";
				

				divTab.appendChild(divContent);
				if(tabconf.tabs.length)for(var l=tabLevel+1;l<=tabconf.maxLevel;l++)
					this.buildWindow(divTab,tabconf,l,callback);
				if(tabs.length)divTab.style.display="none";
				tabs.push(tab);
			}
		}

		if(!windowsearch)w2ui[divTabs.id]?w2ui[divTabs.id].render(divTabs):
		$(divTabs).w2tabs({
			name: divTabs.id,
			active: tabs[0].id,
			tabs: tabs,
			onClick: function(evt){
				if(!evt.tab.windowsearch){
					var id=evt.tab.id;
					for(var i=0;i<this.tabs.length;i++){
						var tab=this.tabs[i];
						var divTab=document.getElementById("divtabWz_"+tab.id);
						divTab.style.display=(tab.id==id)?"":"none";
					}
				}
			}
		});
		
	}
}