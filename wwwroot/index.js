import { w2ui, w2layout, w2toolbar, w2form, w2utils, w2confirm , w2alert, w2popup, w2sidebar } from "../lib/w2ui.es6.min.js";
import { NWin } from "./js/window.js";
import { SqlREST } from "./js/sqlrest.js";

w2utils.settings.dataType = "RESTFULL";
w2utils.settings.dateFormat = "yyyy-mm-dd";
w2utils.settings.datetimeFormat = "yyyy-mm-dd";
w2utils.settings.timeFormat = "hh:mm:ss";
w2utils.settings.currencySuffix = "₫";
w2utils.settings.groupSymbol = "`";

NUT.ds = SqlREST;
NUT.w2alert = w2alert;
NUT.w2confirm = w2confirm;
NUT.utils = w2utils;

var _isMobile = (window.orientation !== undefined);

window.onload = function () {
	document.body.innerHTML = '<div id="divLogin" class="nut-full"></div>';
	(w2ui["frmLogin"] || new w2form({
		name: "frmLogin",
		style: "width:360px;height:220px;top:30%;margin:auto",
		header: '🗝️ <i class="nut-link">Login</i>',
		fields: [
			{ field: 'Username', type: 'text' },
			{ field: 'Password', type: 'password' },
			{ field: 'SavePassword', type: 'checkbox' },
		],
		record: localStorage.getItem(NUT.I_PASS) ? { Username: atob(localStorage.getItem(NUT.I_USER)), Password: atob(localStorage.getItem(NUT.I_PASS)), SavePassword: true } : { Username: atob(localStorage.getItem(NUT.I_USER)), Password: "", SavePassword: false },
		actions: {
			"❔ Help": function () {
				window.open('help.html');
			},
			custom: {
				text: "🗝️ Login",
				class: "w2ui-btn-blue",
				onClick: function () {
					NUT.loading(divLogin);
					var self = this;
					NUT.ds.select({ url: NUT.URL + "nv_user_site", where: [["username", "=", this.record.Username], ["password", "=", this.record.Password]] }, function (res) {
						if (res.success) {
							if (res.result.length == 1) {
								NUT.ctx.user = res.result[0];
								NUT.username = NUT.ctx.user.username;
								localStorage.setItem(NUT.I_USER, btoa(self.record.Username));
								localStorage.setItem(NUT.I_PASS, self.record.SavePassword ? btoa(self.record.Password) : "");
								
								(w2ui["layMain"] || new w2layout({
									name: "layMain",
									style: "width:100%;height:100%;top:0;margin:0",
									panels: [
										{ type: 'top', size: 38, html: '<div id="divTop" class="nut-full"></div>' },
										{ type: 'left', size: 300, resizable: true, html: '<div id="divLeft" class="nut-full"></div>', hidden: true },
										{ type: 'main', html: '<div id="divMain" class="nut-full" style="background:url(\'site/' + NUT.ctx.user.siteid + '/back.png\');background-size:cover"><div id="divApp" style="position:absolute;width:100%;top:30%"></div><div id="divTool" style="position:absolute;width:100%;bottom:10px"></div></div>' }
									],
								})).render(divLogin);

								(w2ui["tbrTop"] || new w2toolbar({
									name: "tbrTop",
									items: [
										{ type: 'html', id: 'logo', html: '<img src="site/' + NUT.ctx.user.siteid + '/logo.png"/>' },
										{ type: 'html', id: 'site', html: '<b>' + NUT.ctx.user.sitecode + '</b><br/>' + NUT.ctx.user.sitename },
										{ type: 'spacer', id: "divSpacer" },
										{ type: 'button', id: "home", icon: "nut-i-home", tooltip: "Home" },
										{ type: 'button', id: "notify", icon: "nut-i-notification", tooltip: "Notify" },
										{ type: 'button', id: "job", icon: "nut-i-information", tooltip: "Job" },
										{ type: 'break' },
										{
											type: 'menu', id: 'user', text: NUT.ctx.user.username, items: [
												{ id: 'profile', text: 'Profile...' },
												{ id: 'changepass', text: 'Change password' },
												{ text: '--' },
												{ id: 'logout', text: 'Logout' }]
										},
										{ type: 'break' },
										{ type: 'button', id: "app", icon: "nut-i-switcher", tooltip: "Applications" }
									],
									onClick(evt) {
										if (evt.target == "user:profile") {
											w2alert("<table><tr><td><b><i>Tài khoản:</i></b></td><td colspan='3'>" + NUT.ctx.user.username + "</td></tr><tr><td><b><i>Họ tên:</i></b></td><td colspan='3'>" + NUT.ctx.user.fullname + "</td></tr><tr><td><b><i>Điện thoại:</i></b></td><td>" + NUT.ctx.user.phone + "</td><td><b><i>Nhóm:</i></b></td><td>" + NUT.ctx.user.groupid + "</td></tr><tr><td><b><i>Trạng thái:</i></b></td><td>" + NUT.ctx.user.status + "</td><td><b><i>Ghi chú:</i></b></td><td>" + NUT.ctx.user.description + "</td></tr></table>", "<b>ℹ️ Information #<i>" + NUT.ctx.user.userid + "</i></b>");
										}
										else if (evt.target == "user:changepass") {
											w2popup.open({
												title: "🔑 <i>Change password</i>",
												speed: 0,
												width: 400,
												height: 210,
												body: "<table style='margin:auto'><tr><td>*Old password:</b></td><td><input id='txtUser_PasswordOld' type='password'/></td></tr><tr><td>*New password:</b></td><td><input id='txtUser_PasswordNew' type='password'/></td></tr><tr><td>*Re-type password:</b></td><td><input id='txtUser_PasswordNew2' type='password'/></td></tr></table>",
												buttons: '<button class="w2ui-btn" onclick="w2popup.close()">⛌ Close</button><button class="w2ui-btn" onclick="userChangePassword()">✔️ Ok</button>'
											});
										}
										else if (evt.target == "user:logout") {
											w2ui.layMain.hide("left");
											window.onload();
										}
									}
								})).render(divTop);

								openDesktop();
								//renderMain();
							} else NUT.notify("⚠️ Login fail for user " + self.record.Username,"yellow");
						} else NUT.notify("⛔ ERROR: " + res.result, "red");
						NUT.loading();
					}, true);
				}
			}
		}
	})).render(divLogin);
}

function openDesktop() {
	NUT.ds.select({ url: NUT.URL + "nv_access_app", orderby: "seqno", where: ["userid", "=", NUT.ctx.user.userid] }, function (res) {
		if (res.success) {
			var id = null;
			var appHtml = "<center>";
			var toolHtml = "<center>";
			for (var i = 0; i < res.result.length; i++) {
				var data = res.result[i];
				if (data.appid != null) {
					if (id != data.appid) {
						id = data.appid;
						NUT.ctx.apps[id] = data;
						if (data.issystem) {
							toolHtml += "<div class='nut-tool' onclick='openApp(" + id + ")' title='" + data.description + "'><img src='site/" + data.siteid + "/"+id+"/icon.png'/></div>";
						} else {
							appHtml += "<div class='nut-tile' style='background:" + data.color + "' onclick='openApp(" + id + ")' title='" + data.description + "'><img src='site/" + data.siteid + "/" + id +"/icon.png'/><br/>" + data.appname + "</div>";
						}
					}
				}
			};
			divApp.innerHTML = appHtml + "</center>";
			divTool.innerHTML = toolHtml + "</center>";
			//if (res.length == 1) openApplication(id);
		} else NUT.notify("⛔ ERROR: " + res.result, "red");
	});
}

function userChangePassword(){
	var user=NUT.ctx.user;
	if(txtUser_PasswordOld.value&&txtUser_PasswordNew.value&&txtUser_PasswordNew2.value){
		if(txtUser_PasswordOld.value==user.password&&txtUser_PasswordNew.value==txtUser_PasswordNew2.value)
			NUT.ds.update({ url: NUT.URL + "n_user", data: { password: txtUser_PasswordNew.value }, where: [["userid", "=", user.userid], ["password", "=", txtUser_PasswordOld.value]] }, function (res) {
				if (res.success)
					NUT.alert("<span style='color:green'>Password change!</span>");
				else
					NUT.notify("⛔ ERROR: " + res.result, "red");
			})
		else w2alert("<span style='color:orange'>Passwords not match!</span>");
	}else w2alert("<span style='color:orange'>Old password, new password and retype password are all required!</span>");
}

window.openApp=function(idApp){
	//load menu
	NUT.ctx.curWinId=null;
	NUT.ctx.curApp=NUT.ctx.apps[idApp];
	
	if(NUT.ctx.curApp.apptype=="engine"){
		window.open(NUT.ctx.curApp.link+"?username="+NUT.ctx.user.username+"&clientid="+NUT.ctx.user.clientid);
		labCurrentApp.innerHTML="";
	}else {
		var isGis=(NUT.ctx.curApp.apptype=="gis");
		divMain.innerHTML = '<div id="divTitle" style="padding:6px"><img width="64" height="64" src="site/' + NUT.ctx.curApp.siteid+'/'+idApp+'/icon.png"/><br/><h2><b style="color:brown">'+NUT.ctx.curApp.appname+'</b></h2><br/><hr/><br/><h3><i>'+NUT.ctx.curApp.description+'</i></h3></div>';
		divMain.style.backgroundImage="";
		
		if(isGis){
			NUT.ds.select({ url: NUT.URL + "nv_map_service",orderby:"seqno",where:["appid","=",idApp]},function(res){
				if (res.success) {
					var maps = res.result;
					var lookup={};
					for(var i=0;i<maps.length;i++){
						var map=maps[i];
						map.subLayers=[];
						lookup[map.mapid]=map;
					}
					NUT.ds.select({ url: NUT.URL + "n_layer",orderby:"seqno",where:["appid","=",idApp]},function(res2){
						if (res2.success) {
							for (var i = 0; i < res2.result.length; i++) {
								var lyr = res.result[i];
								lyr.maporder = lookup[lyr.mapid].seqno;
								lookup[lyr.mapid].subLayers.push(lyr);
							}
							var layers = [];
							for (var i = 0; i < maps.length; i++)if (maps[i].subLayers.length) layers.push(maps[i]);
							divMain.innerHTML = "<div id='divMapTool'></div>";
							w2ui.divApp.sizeTo("left", "50%", true);
							GSMap.createMap({
								layers: layers,
								divMap: divMain,
								divTool: divMapTool,
								view: {
									center: [108, 16],
									zoom: 11
								}
							});
							GSMap.awBasic.onFeatureSelect = map_onSelect;
						} else NUT.notify("⛔ ERROR: " + res2.result, "red");
					})
				} else NUT.notify("⛔ ERROR: " + res.result, "red");
			});
		}
		//load domain
		NUT.ds.select({ url: NUT.URL + "n_domain",clientid:NUT.ctx.curApp.clientid,where:["appid","=",idApp]},function(res){
			if (res.success)
				NUT.ctx.domain = NUT.configDomain(res.result);
			else
				NUT.notify("⛔ ERROR: " + res.result, "red");
		});
		//load service
		NUT.ds.select({ url: NUT.URL + "nv_appservice_service",clientid:NUT.ctx.curApp.clientid,where:["appid","=",idApp]},function(res){
			NUT.ctx.service = {};
			if (res.success)
				for (var i = 0; i < res.length; i++)NUT.ctx.service[res[i].servicename] = res[i];
			else
				NUT.notify("⛔ ERROR: " + res.result, "red");
		});
		NUT.ds.select({ url: NUT.URL + "nv_rolemenu_menu",clientid:NUT.ctx.curApp.clientid,where:[["menutype","=","menu"],["appid","=",idApp],["roleid","=",NUT.ctx.curApp.roleid]]},function(res){
			if (res.success) {
				var ids = {}, pids = {};
				for (var i = 0; i < res.result.length; i++) {
					var rec = res.result[i];
					if (rec.menuid) ids[rec.menuid] = true;
					if (rec.parentid) pids[rec.parentid] = true;
				}
				NUT.ds.select({ url: NUT.URL + "n_menu", orderby: "seqno", where: ["or", ["menuid", "in", Object.keys(ids)], ["menuid", "in", Object.keys(pids)]] }, function (res2) {
					if (res2.success) {
						var nodes = [], lookup = {}, openWinId = null;
						for (var i = 0; i < res2.result.length; i++) {
							var menu = res2.result[i];
							if (menu.linkwindowid && menu.isopen) openWinId = menu.linkwindowid;
							var node = { id: menu.menuid, text: menu.menuname, expanded: menu.isopen, tag: menu.linkwindowid || menu.execname };
							if (menu.parentid) {
								var parent = lookup[menu.parentid];
								parent.group = true;
								if (parent.nodes) parent.nodes.push(node);
								else parent.nodes = [node];
							} else nodes.push(node);
							lookup[node.id] = node;
						};

						(w2ui["mnuMain"]||new w2sidebar({
							name: "mnuMain",
							flatButton: true,
							nodes: nodes,
							onClick: menu_onClick,
							onFlat: function (evt) {
								var width = _isMobile ? "100%" : "300px";
								w2ui.layMain.sizeTo("left", evt.detail.goFlat ? '40px' : width, true);
								divLeft.style.width = (evt.detail.goFlat ? '40px' : width);
							}
						})).render(divLeft);

						w2ui.layMain.show("left");
						if (openWinId) menu_onClick({ item: { tag: openWinId }});
					} else NUT.notify("⛔ ERROR: " + res2.result, "red");
				});
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	}
}
function map_onSelect(evt){
	if(evt.tool=="toolSelect"){
		var tabconf=NUT.ctx.winconfig[NUT.ctx.curWinid].tabs[0];
		var grid=w2ui["divgrid_"+tabconf.tabid];
		var where=["or"];
		for(var i=0;i<evt.features.length;i++){
			var feat=evt.features[i];
			var lyrconf=GSMap.getLayerConfig(feat.getId().split(".")[0]);
			if(lyrconf.windowid==NUT.ctx.curWinid){
				var attr=feat.getProperties();
				var clause=[];
				for(var j=0;j<tabconf.fields.length;j++){
					var field=tabconf.fields[j];
					if(field.columndohoa&&attr[field.columndohoa]){
						if(attr[field.columndohoa])clause.push([field.columndohoa,"=",attr[field.columndohoa]]);
						else {clause=[];break}
					}
				}
				if (clause.length)where.push(clause);
			}
		}
		if(where.length>1){
			grid.postData.select=where;
			grid.reload();
		}
	}
}

function menu_onClick(evt) {
	var tag=evt.detail.node.tag;
	if(Number.isInteger(tag)){
		var win = new NWin(tag);
		var a = createWindowTitle(tag, divTitle);
		var conf=NUT.ctx.winconfig[tag];
		if(conf){
			if(conf.execname)
				NUT.runComponent(conf.execname);
			else{
				conf.tabs[0].tempWhere=evt.tempWhere;
				win.buildWindow(a.div,conf,0);
			}
			a.innerHTML=conf.windowname;
		}else{
			NUT.ds.select({ url: NUT.URL + "n_cache",where:["windowid","=",tag]},function(res){
				if (res.success) {
					var cache = res.result[0];
					if (cache) {
						conf = NUT.configWindow(zipson.parse(cache.config), JSON.parse(cache.layout));
						if (conf.execname) {
							NUT.runComponent(conf.execname);
						} else {
							conf.tabs[0].tempWhere = evt.tempWhere;
							conf.tabid = conf.windowid;
							NUT.ctx.winconfig[tag] = conf;
							var needCaches = [];
							for (var key in conf.needCache) {
								if (conf.needCache.hasOwnProperty(key) && !NUT.ctx.domain[key]) needCaches.push(conf.needCache[key]);
							}
							win.buildWindow(a.div, conf, 0);
						}
						a.innerHTML = conf.windowname;
					} else NUT.notify("⚠️ No cache for window "+tag,"yellow");
				} else NUT.notify("⛔ ERROR: " + res.result, "red");
			});
		}
		if(_isMobile&&!w2ui.w2menu.flat)w2ui.w2menu.goFlat();
		NUT.ctx.curWinid=tag;
	}else{
		NUT.runComponent(tag);
	}
}

function createWindowTitle(id, divTitle, noClose){
	if (!NUT.ctx.curWinid) divTitle.innerHTML = "";
	else for (var i = 0; i < divTitle.childNodes.length; i++) {
		var node = divTitle.childNodes[i].firstChild;
		node.style.color = "gray";
		if (id == node.tag) {
			node.onclick();
			return;
		}
	}

	var divWindow = divTitle.parentNode;
	for (var i = 1; i < divWindow.childNodes.length; i++)
		divWindow.childNodes[i].style.display = "none";

	var div = document.createElement("div");
	div.className = "nut-full";
	divWindow.appendChild(div);

	var span = document.createElement("span");
	var a = document.createElement("i");
	a.innerHTML = " Loading... ⌛ ";
	a.className = "nut-link";
	a.div = div;
	a.tag = id;
	a.onclick = function () {
		var children = this.div.parentNode.childNodes;
		for (var i = 1; i < children.length; i++)
			children[i].style.display = "none";
		this.div.style.display = "";

		children = this.parentNode.parentNode.childNodes;
		for (var i = 0; i < children.length; i++)
			children[i].firstChild.style.color = "gray";
		this.style.color = "";

		NUT.ctx.curWinid = this.tag;
	};
	span.appendChild(a);

	var close = document.createElement("span");
	close.className = "nut-close";
	close.innerHTML = noClose ? "    " : " ⛌   ";
	close.tag = id;
	if (!noClose) close.onclick = function () {
		var title = this.parentNode.parentNode;
		this.previousElementSibling.div.remove();
		this.parentNode.remove();
		if (this.tag == NUT.ctx.curWinid) {
			if (title.childNodes.length) title.childNodes[0].firstChild.onclick();
			else NUT.ctx.curWinid = null;
		}
	}
	span.appendChild(close);

	divTitle.appendChild(span);
	return a;
}

function linkfield_onClick(windowid,value,wherefield){
	menu_onClick({item:{tag:windowid},tempWhere:[wherefield,"=",value]});
	event.stopImmediatePropagation();
}

