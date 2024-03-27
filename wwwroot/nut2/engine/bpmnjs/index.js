var _bpmnModeler=null;
var _context={user:{}};

function body_onLoad(){
	var params=(window.location.search.substr(1)).split("&");
	for(var i=0;i<params.length;i++){
		var param=params[i].split("=");
		_context.user[param[0]]=param[1];
	}
	
	var id="divApp";
	var div=document.getElementById(id);
	w2ui[id]?w2ui[id].render(div):
	$(div).w2layout({
		name: id,
		panels: [
			{ type: 'top', size: '28px', content: '<i style="float:right" class="nut-link"><img id="imgLogo" width="20" height="20" src="favicon.ico"/> Workflow 1.0 > '+_context.user.username+'</i>' },
			{ type: 'left', size: '310px', resizable: true, content: '<div id="divLeft" class="full"></div>' },
			{ type: 'main', content: '<div id="divMain" style="background:white;width:100%;height:75%"><h1>Create new or open a workflow</h1></div><div id="frmBottom" style="width:100%;height:25%"></div>' },
			{ type: 'right', size: '310px', resizable: true, content: '<div id="frmRight" style="width:100%;height:200px"></div>' }
		]
	});
	
	loadMenu();
	
	NUT_DS.select({url:NUT_URL+"sysapplication",order:"orderno"},function(apps){
		var appItems=[];
		for(var i=0;i<apps.length;i++)appItems.push({id:apps[i].applicationid,text:apps[i].applicationname});
		
		NUT_DS.select({url:NUT_URL+"sysuser",where:["clientid","=",_context.user.clientid]},function(users){
			var userItems=[];
			for(var i=0;i<users.length;i++)userItems.push(users[i].username);
			
			NUT_DS.select({url:NUT_URL+"systable",where:["clientid","=",_context.user.clientid]},function(tables){
				var tableItems=[];
				for(var i=0;i<tables.length;i++)tableItems.push({id:tables[i].tableid,text:tables[i].tablename});
			
				var id='frmBottom';
				var div=document.getElementById(id);
				if(w2ui[id])
					w2ui[id].render(div)
				else $(div).w2form({
					name: id,
					header:"Workflow",
					fields: [
						{field:'jobtypename',type:"text",required:true,html:{label:"Name",column:0}},
						{field:'numdaycomplete',type:"float",required:true,html:{label:"Duration",column:1,text:'@numdaycomplete'}},
						{field:'timeunit',type:"select",required:true,html:{label:"",anchor:"@numdaycomplete"},options:{items:[{id:1,text:"day"},{id:2,text:"hour"},{id:3,text:"minute"}]}},
						{field:'applicationid',type:"select",required:true,html:{label:"Application",column:0},options:{items:appItems}},
						{field:'tableid',type:"select",required:true,html:{label:"Table",column:1},options:{items:tableItems}},
						{field:'users',type:"text",required:true,html:{label:"Users",column:0,text:" <input type='button' onclick='butUsers_onClick(this.previousElementSibling)' value=' ... '/>"}},
						{field:'description',type:"text",html:{label:"Description",column:1}}
					],
					actions: {
						"⛌ Close": function () {
							w2popup.close();
						},
						"✔️ Save": function (evt) {
							if(this.validate(true).length)return;
							var startStep="StartEvent_1";
							if(_bpmnModeler.get("elementRegistry").get(startStep)){
								var self=this;
								_bpmnModeler.saveXML().then(function(xml){
									self.record.jobtypedata=xml.xml;
									self.record.createdate=new Date();
									self.record.jobstepstart=startStep;
									self.record.clientid=_context.user.clientid;
									self.record.jobtypeid?NUT_DS.update({url:NUT_URL+"wfjobtype",where:["jobtypeid","=",self.record.jobtypeid],data:self.record},function(res){NUT.tagMsg("Record updated.","lime")}):
									NUT_DS.insert({url:NUT_URL+"wfjobtype",data:self.record},function(res){if(res.length){self.record.jobtypeid=res[0].jobtypeid;loadMenu();NUT.tagMsg("Record inserted.","lime")}});
									
								});
							} else NUT.tagMsg("Start-step not found","red");
						}
					}
				});
				div.style.display="none";
				
				var id='frmRight';
				div=document.getElementById(id);
				if(w2ui[id])
					w2ui[id].render(div);
				else $(div).w2form({
					header:"Step",
					name:id,
					fields:[{field:'Name',type:"text",disabled:true},{field:'Duration',type:"float"},{field:'Assign',type:"select",options:{items:userItems}}],
					actions: {
						"✔️ Save": function (evt) {
							this.element.businessObject.$attrs.Duration=this.record.Duration;
							this.element.businessObject.$attrs.Assign=this.record.Assign;
						}
					}
				});
				div.style.display="none";
			});
		});
	});
}
function loadMenu(){
	NUT_DS.select({url:NUT_URL+"sysapplication",order:"orderno"},function(apps){
		var lookupApp={};appItems=[];
		for(var i=0;i<apps.length;i++){
			var app=apps[i];
			lookupApp[app.applicationid]=app;
			appItems.push({id:app.applicationid,text:app.applicationname});
		}
		
		NUT_DS.select({url:NUT_URL+"wfjobtype",order:"jobtypename",where:["clientid","=",_context.user.clientid]},function(res){
			var nodes=[], lookup={};			
			for(var i=0;i<res.length;i++){
				var wf=res[i];
				var node={count:'<span onclick="delete_onClick('+wf.jobtypeid+')" title="Delete">❌</span>', id:wf.jobtypeid, text: wf.jobtypename, img: 'icon-page', tag:wf.jobtypeid};
				if(lookup[wf.applicationid]){//has parent
					lookup[wf.applicationid].nodes.push(node)
				}else{
					var parent={type:'menu', id:"app_"+wf.applicationid, text: lookupApp[wf.applicationid].applicationname, group:true, expanded:true, nodes:[node]};
					lookup[wf.applicationid]=parent;
					nodes.push(parent);
				}
			};
			var id='menuleft';
			if(w2ui[id]){
				w2ui[id].nodes=nodes;
				w2ui[id].render(divLeft);
			}else
				$(divLeft).w2sidebar({name:id,topHTML:"<button style='margin:3px;padding:5px' onclick='openWorkflow()'>📄 New workflow</button><button style='float:right;margin:3px;padding:5px' onclick='loadMenu()' title='Refresh'> ⭯ </button>",nodes: nodes,onClick:menu_onClick});
		});
	});
}
function delete_onClick(id){
	w2confirm('<span style="color:red">Delete selected workflow?</span>').yes(function(){
		 NUT_DS.delete({url:NUT_URL+"wfjobtype",where:["jobtypeid","=",id]},function(res){
			loadMenu();
		});
	 });
}
function menu_onClick(evt){
	var tag=evt.item?((!evt.item.group)?evt.item.tag:(evt.subItem&&!evt.subItem.group?evt.subItem.tag:null)):evt.node.tag;
	if(tag){
		NUT_DS.select({url:NUT_URL+"wfjobtype",where:["jobtypeid","=",tag]},function(res){
			if(res.length){
				openWorkflow(res[0]);
			}
		});
	}
}
function openWorkflow(wf) {
      // modeler instance
	divMain.innerHTML="";
	frmRight.style.display="";
	frmBottom.style.display="";
	
	_bpmnModeler = new BpmnJS({ container: divMain });
	_bpmnModeler.on('element.click',element_onClick);

	var form=w2ui["frmBottom"];
	if(wf){
		form.record=wf;
		form.refresh();
		_bpmnModeler.importXML(wf.jobtypedata);
	} else _bpmnModeler.createDiagram();
}

function element_onClick(evt){
	var ele=evt.element;
	
	var form=w2ui["frmRight"];
	form.record={
		Name:ele.businessObject.name,
		Duration:ele.businessObject.$attrs.Duration,
		Assign:ele.businessObject.$attrs.Assign
	}
	form.refresh();
	if(evt.element.parent)
		form.unlock();
	else
		form.lock();
	
	form.element=ele;
}

function butUsers_onClick(input){
	NUT_DS.select({url:NUT_URL+"sysgroup",order:"groupname",where:["clientid","=",_context.user.clientid]},function(groups){
		var grpLookup={};
		for(var i=0;i<groups.length;i++){
			var group=groups[i];
			grpLookup[group.groupid]=group.groupname;
		}
		NUT_DS.select({url:NUT_URL+"sysuser",where:["clientid","=",_context.user.clientid]},function(res){
			var fields=[];
			for(var i=0;i<res.length;i++){
				var user=res[i];
				var fld={field:user.username,type:'checkbox',html:{column:i++%3,group:grpLookup[user.groupid]}};
				fields.push(fld);
			}
			
			var lookup={};
			if(input.value){
				var users=input.value.split(",");
				for(var i=0;i<users.length;i++)lookup[users[i].username]=true;
			}
			var id="divDlg_Users";
			var self=this;
			w2popup.open({
				title: '<i>Users in workflow</i>',
				modal:true,
				width: 700,
				height: 500,
				body: '<div id="'+id+'" class="nut-full"></div>',
				onOpen:function(evt){
					evt.onComplete=function(){
						var div=document.getElementById(id);
						w2ui[id]?w2ui[id].render(div):
						$(div).w2form({ 
							name: id,
							fields: fields,
							record:lookup,
							actions: {
								"⛌ Cancel":function(){
									w2popup.close();
								},
								"✔️ Ok":function(){
									var values=[];
									for(var key in this.record)if(this.record.hasOwnProperty(key))
										values.push(key);
									w2ui['frmBottom'].setValue(input.id,values.toString());
									w2ui['frmBottom'].refresh(input.id);
									w2popup.close();
								}
							}
						});
					}
				}
			});
		});
	});
}